from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Dict
import json

from database import get_db
from dependencies import get_current_user, require_role
from models import User, ChatSession, Patient, Doctor, ChatMessage
from schemas import ( 
            DoctorPatientChatSessionRead, 
            DoctorPatientChatMessageResponse, 
        )
from services.chat_service import chat_service, manager

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/sessions", response_model=DoctorPatientChatSessionRead, status_code=status.HTTP_201_CREATED)
async def create_chat_session(
    patient_id: int,
    doctor_id: int,
    current_user: User = Depends(require_role(["admin", "doctor"])),
    db: Session = Depends(get_db)
):
    """
    Create a new chat session between a patient and a doctor.
    Only admins and doctors can initiate a session.
    """
    if current_user.role == "doctor" and current_user.doctor.id != doctor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctors can only create sessions for themselves."
        )
    
    session = chat_service.create_session(db, patient_id, doctor_id)
    return session


@router.get("/sessions/me", response_model=List[DoctorPatientChatSessionRead])
async def get_my_chat_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all active chat sessions for the current user (patient or doctor).
    """
    sessions = chat_service.get_user_sessions(db, current_user)
    return sessions


@router.get("/sessions/{session_id}/messages", response_model=List[DoctorPatientChatMessageResponse])
async def get_session_messages(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all messages for a specific chat session.
    User must be the patient or doctor in the session.
    """
    session = chat_service.get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")

    is_patient = current_user.role == "patient" and current_user.patient and session.patient_id == current_user.patient.id
    is_doctor = current_user.role == "doctor" and current_user.doctor and session.doctor_id == current_user.doctor.id
    is_admin = current_user.role == "admin"

    if not (is_patient or is_doctor or is_admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this chat session")

    messages = chat_service.get_messages_by_session(db, session_id)
    return messages


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    session_id: int,
    token: str, # Token passed as query parameter
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for real-time chat communication.
    """
    try:
        # Authenticate user using the token
        # from dependencies import get_user_from_token
        user = get_user_from_token(db, token)
        from utils.security import decode_token
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
            return

        # Check if user is part of the session
        session = chat_service.get_session_by_id(db, session_id)
        if not session:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Session not found")
            return

        is_patient = user.role == "patient" and user.patient and session.patient_id == user.patient.id
        is_doctor = user.role == "doctor" and user.doctor and session.doctor_id == user.doctor.id
        
        if not (is_patient or is_doctor):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Not authorized for this session")
            return

        await manager.connect(session_id, user.id, websocket)
        
        # Send a connection confirmation message
        await manager.send_personal_message(json.dumps({"type": "status", "message": "Connected"}), websocket)

        try:
            while True:
                data = await websocket.receive_text()
                
                # Expecting a JSON string with 'content'
                try:
                    message_data = json.loads(data)
                    content = message_data.get("content")
                except json.JSONDecodeError:
                    await manager.send_personal_message(json.dumps({"type": "error", "message": "Invalid JSON format"}), websocket)
                    continue

                if not content:
                    continue

                # 1. Save message to DB
                new_message = chat_service.save_message(db, session_id, user.id, content)
                
                # 2. Prepare message for broadcast
                sender_full_name = chat_service.get_full_name(db, user.id)
                
                broadcast_message = {
                    "type": "message",
                    "id": new_message.id,
                    "session_id": new_message.session_id,
                    "sender_id": new_message.sender_id,
                    "sender_name": sender_full_name,
                    "content": new_message.content,
                    "created_at": new_message.created_at.isoformat()
                }
                
                # 3. Broadcast message to all connected users in the session
                await manager.broadcast(session_id, json.dumps(broadcast_message))

        except WebSocketDisconnect:
            manager.disconnect(session_id, user.id)
            # Optionally broadcast a disconnect message
            # await manager.broadcast(session_id, f"User {user.id} left the chat")
        
    except Exception as e:
        print(f"WebSocket Error: {e}")
        # Ensure the connection is closed on any unhandled error
        if websocket.client_state != status.WS_DISCONNECTED:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR, reason="Internal server error")
