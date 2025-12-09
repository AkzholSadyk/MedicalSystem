import uuid
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import AIChatMessage, AIChatSession, User
from schemas import (
    AIChatMessageCreate,
    AIChatMessageRead,
    AIChatSessionCreate,
    AIChatSessionRead,
    AIChatSessionWithMessagesRead,
)
from services.ai_service import ai_service

router = APIRouter()

# Removed demo OpenAI/Olama import and example call; ai_service handles AI requests


@router.post("/message", response_model=AIChatMessageRead)
async def send_chat_message(
    message_data: AIChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Send a message to AI chat and get response
    """
    # Normalize session_id: treat 0 as no session
    session_id = message_data.session_id
    if session_id == 0:
        session_id = None

    # Get or create session
    if session_id:
        session = (
            db.query(AIChatSession)
            .filter(
                AIChatSession.id == session_id,
                AIChatSession.user_id == current_user.id,
            )
            .first()
        )

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found"
            )

        session_id = session.id
    else:
        # Create new session
        session = AIChatSession(
            session_id=str(uuid.uuid4()),
            user_id=current_user.id,
            title="Новый чат",  # Will be updated with AI-generated title
            is_active=True,
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        session_id = session.id

    # Save user message
    user_message = AIChatMessage(
        user_id=current_user.id,
        session_id=session_id,
        role="user",
        content=message_data.content,
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)

    # Get chat history for context
    chat_history = (
        db.query(AIChatMessage)
        .filter(AIChatMessage.session_id == session_id)
        .order_by(AIChatMessage.created_at)
        .limit(20)
        .all()
    )

    # Prepare messages for AI
    messages = [{"role": msg.role, "content": msg.content} for msg in chat_history]

    # Get user context
    user_context = {"role": current_user.role}
    if current_user.role == "patient" and current_user.patient:
        user_context["name"] = (
            f"{current_user.patient.first_name} {current_user.patient.last_name}"
        )
    elif current_user.role == "doctor" and current_user.doctor:
        user_context["name"] = (
            f"{current_user.doctor.first_name} {current_user.doctor.last_name}"
        )

    try:
        # Get AI response
        ai_response = await ai_service.chat_completion(messages, user_context)

        # Save AI response
        assistant_message = AIChatMessage(
            user_id=current_user.id,
            session_id=session_id,
            role="assistant",
            content=ai_response["content"],
            model=ai_response.get("model"),
            tokens_used=ai_response.get("tokens"),
        )
        db.add(assistant_message)

        # Update session last_message_at
        session.last_message_at = datetime.utcnow()

        # Generate title for new sessions
        if len(chat_history) == 1:  # First message
            try:
                title = await ai_service.generate_session_title(message_data.content)
                session.title = title
            except Exception:
                pass  # Keep default title if generation fails

        db.commit()
        db.refresh(assistant_message)

        return AIChatMessageRead.from_orm(assistant_message)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI service error: {str(e)}",
        )


@router.get("/sessions", response_model=List[AIChatSessionRead])
async def get_chat_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
):
    """
    Get all chat sessions for current user
    """
    sessions = (
        db.query(AIChatSession)
        .filter(AIChatSession.user_id == current_user.id)
        .order_by(AIChatSession.last_message_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return sessions


@router.get("/sessions/{session_id}", response_model=AIChatSessionWithMessagesRead)
async def get_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a specific chat session with all messages
    """
    session = (
        db.query(AIChatSession)
        .filter(
            AIChatSession.id == session_id,
            AIChatSession.user_id == current_user.id,
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found"
        )

    # Get all messages for this session
    messages = (
        db.query(AIChatMessage)
        .filter(AIChatMessage.session_id == session.id)
        .order_by(AIChatMessage.created_at)
        .all()
    )

    # attach messages to session object if relationship not loaded
    session.messages = messages

    return AIChatSessionWithMessagesRead.from_orm(session)


@router.post(
    "/sessions", response_model=AIChatSessionRead, status_code=status.HTTP_201_CREATED
)
async def create_chat_session(
    session_data: AIChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_session = AIChatSession(
        user_id=current_user.id, title=session_data.title or "Новый чат", is_active=True
    )

    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return AIChatSessionRead.from_orm(new_session)


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a chat session
    """
    session = (
        db.query(AIChatSession)
        .filter(
            AIChatSession.id == session_id,
            AIChatSession.user_id == current_user.id,
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found"
        )

    db.delete(session)
    db.commit()

    return None
