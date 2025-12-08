from sqlalchemy.orm import Session
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Optional

import models
import schemas
from dependencies import get_user_by_id

class ConnectionManager:
    """Manages active WebSocket connections for chat sessions."""
    def __init__(self):
        # {session_id: {user_id: WebSocket}}
        self.active_connections: Dict[int, Dict[int, WebSocket]] = {}

    async def connect(self, session_id: int, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = {}
        self.active_connections[session_id][user_id] = websocket

    def disconnect(self, session_id: int, user_id: int):
        if session_id in self.active_connections and user_id in self.active_connections[session_id]:
            del self.active_connections[session_id][user_id]
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, session_id: int, message: str):
        if session_id in self.active_connections:
            for connection in self.active_connections[session_id].values():
                await connection.send_text(message)

manager = ConnectionManager()


class ChatService:
    """Handles CRUD operations for Doctor-Patient Chat sessions and messages."""

    def create_session(self, db: Session, patient_id: int, doctor_id: int) -> models.ChatSession:
        """Creates a new chat session between a patient and a doctor."""
        # Check if a session already exists
        existing_session = db.query(models.ChatSession).filter(
            models.ChatSession.patient_id == patient_id,
            models.ChatSession.doctor_id == doctor_id,
            models.ChatSession.is_active == True
        ).first()

        if existing_session:
            return existing_session

        new_session = models.ChatSession(patient_id=patient_id, doctor_id=doctor_id)
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        return new_session

    def get_session_by_id(self, db: Session, session_id: int) -> Optional[models.ChatSession]:
        """Retrieves a chat session by its ID."""
        return db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()

    def get_user_sessions(self, db: Session, user: models.User) -> List[models.ChatSession]:
        """Retrieves all active chat sessions for a given user (doctor or patient)."""
        if user.role == "patient":
            return db.query(models.ChatSession).join(models.Patient).filter(
                models.Patient.user_id == user.id,
                models.ChatSession.is_active == True
            ).all()
        elif user.role == "doctor":
            return db.query(models.ChatSession).join(models.Doctor).filter(
                models.Doctor.user_id == user.id,
                models.ChatSession.is_active == True
            ).all()
        return []

    def save_message(self, db: Session, session_id: int, sender_id: int, content: str) -> models.ChatMessage:
        """Saves a new message to the database."""
        new_message = models.ChatMessage(
            session_id=session_id,
            sender_id=sender_id,
            content=content
        )
        db.add(new_message)
        
        # Update session last_message_at
        db.query(models.ChatSession).filter(models.ChatSession.id == session_id).update(
            {"last_message_at": models.func.now()}
        )
        
        db.commit()
        db.refresh(new_message)
        return new_message

    def get_messages_by_session(self, db: Session, session_id: int) -> List[models.ChatMessage]:
        """Retrieves all messages for a given session."""
        return db.query(models.ChatMessage).filter(models.ChatMessage.session_id == session_id).order_by(models.ChatMessage.created_at).all()

    def get_full_name(self, db: Session, user_id: int) -> str:
        """Retrieves the full name (Last Name First Name Patronymic) of a user."""
        user = get_user_by_id(db, user_id)
        if not user:
            return "Unknown User"

        if user.role == "patient" and user.patient:
            p = user.patient
            return f"{p.last_name} {p.first_name} {p.patronymic or ''}".strip()
        elif user.role == "doctor" and user.doctor:
            d = user.doctor
            return f"{d.last_name} {d.first_name} {d.patronymic or ''}".strip()
        
        return user.username

chat_service = ChatService()
