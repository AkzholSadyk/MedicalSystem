from typing import List

import models
from database import get_db
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from models import User
from sqlalchemy.orm import Session
from utils.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> models.User:
    """
    Get current authenticated user from JWT token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_token(token)
    if payload is None:
        raise credentials_exception

    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user"
        )

    return user


async def get_current_active_user(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    """
    Get current active user
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user"
        )

    return current_user


def require_role(allowed_roles: List[str]):
    """
    Dependency to check if user has required role
    """

    async def role_checker(
        current_user: models.User = Depends(get_current_user),
    ) -> models.User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}",
            )
        return current_user

    return role_checker


async def get_current_patient(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
) -> models.Patient:
    """
    Get current patient profile
    """
    if current_user.role != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can access this resource",
        )

    patient = (
        db.query(models.Patient)
        .filter(models.Patient.user_id == current_user.id)
        .first()
    )
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient profile not found"
        )

    return patient


async def get_current_doctor(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
) -> models.Doctor:
    """
    Get current doctor profile
    """
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can access this resource",
        )

    doctor = (
        db.query(models.Doctor).filter(models.Doctor.user_id == current_user.id).first()
    )
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Doctor profile not found"
        )

    return doctor


async def get_current_pharmacist(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
) -> models.User:
    """
    Ensure the current user is a pharmacist and return the user record.
    """
    if current_user.role != "pharmacist":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only pharmacists can access this resource",
        )

    # Pharmacist specific profile table is not implemented; return user
    return current_user


async def get_current_admin(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    """
    Ensure the current user is an admin. Raise 403 for non-admins.
    """
    # First check token-level claim (if present) then fallback to role field
    # decode_token already ran in get_current_user, so check role
    if getattr(current_user, "role", None) != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required"
        )

    return current_user


import traceback

from fastapi import APIRouter, Request

router = APIRouter()


@router.post("/ai-chat/message")
async def ai_chat_message(request: Request):
    try:
        data = await request.json()
        # Временно верни сам запрос, чтобы проверить формат
        print("Received data:", data)
        # здесь твоя логика обработки
        return {"message": "OK"}
    except Exception as e:
        print("Error in /ai-chat/message:")
        traceback.print_exc()
        return {"error": str(e)}


from sqlalchemy.orm import Session


def get_user_by_id(user_id: int, db: Session):
    return db.query(User).filter(User.id == user_id).first()
