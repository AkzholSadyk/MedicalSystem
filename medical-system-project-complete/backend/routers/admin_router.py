import models
from database import get_db
from dependencies import get_current_admin
from fastapi import APIRouter, Depends, HTTPException, status
from schemas import AdminUserRead, AdminUserUpdate
from sqlalchemy.orm import Session

router = APIRouter(prefix="/admin", tags=["admin"])


def _user_to_adminread(user: models.User) -> AdminUserRead:
    # Compose full name from patient/doctor profiles when available
    first = ""
    last = ""
    phone = None
    if getattr(user, "patient", None):
        first = user.patient.first_name or ""
        last = user.patient.last_name or ""
        phone = user.patient.phone
    elif getattr(user, "doctor", None):
        first = user.doctor.first_name or ""
        last = user.doctor.last_name or ""
        phone = user.doctor.phone

    full_name = (first + " " + last).strip()
    status = "active" if user.is_active else "blocked"

    return AdminUserRead(
        id=user.id,
        role=user.role,
        full_name=full_name,
        email=user.email,
        phone=phone,
        created_at=user.created_at,
        status=status,
    )


@router.get("/users", response_model=list[AdminUserRead])
def list_users(
    db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)
):
    users = db.query(models.User).all()
    return [_user_to_adminread(u) for u in users]


@router.get("/users/{user_id}", response_model=AdminUserRead)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return _user_to_adminread(user)


@router.put("/users/{user_id}", response_model=AdminUserRead)
def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Update core user fields
    if payload.email is not None:
        user.email = payload.email
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.role is not None:
        user.role = payload.role

    # Update profile data if exists
    if getattr(user, "patient", None):
        if payload.first_name is not None:
            user.patient.first_name = payload.first_name
        if payload.last_name is not None:
            user.patient.last_name = payload.last_name
        if payload.phone is not None:
            user.patient.phone = payload.phone
    elif getattr(user, "doctor", None):
        if payload.first_name is not None:
            user.doctor.first_name = payload.first_name
        if payload.last_name is not None:
            user.doctor.last_name = payload.last_name
        if payload.phone is not None:
            user.doctor.phone = payload.phone

    db.add(user)
    db.commit()
    db.refresh(user)

    return _user_to_adminread(user)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Prevent deleting the currently logged-in admin
    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete the currently logged-in admin",
        )

    # Delete user and cascade
    db.delete(user)
    db.commit()

    return None
