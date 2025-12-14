import os
import pathlib
import uuid
from typing import List, Optional

import schemas
from config import settings
from database import get_db
from dependencies import get_current_patient, get_current_user, require_role
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from models import Patient, User
from sqlalchemy.orm import Session

router = APIRouter()

AVATAR_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "static", "avatars")
)
os.makedirs(AVATAR_DIR, exist_ok=True)


@router.get("", response_model=List[schemas.PatientRead])
async def get_patients(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None, description="Search by name, email, or phone"),
    current_user: User = Depends(require_role(["doctor", "admin"])),
    db: Session = Depends(get_db),
):
    """
    Get list of all patients (only for doctors and admins)
    """
    query = db.query(Patient)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Patient.first_name.ilike(search_filter))
            | (Patient.last_name.ilike(search_filter))
            | (Patient.phone.ilike(search_filter))
        )

    patients = query.offset(skip).limit(limit).all()
    return patients


@router.get("/me", response_model=schemas.PatientRead)
async def get_my_profile(patient: Patient = Depends(get_current_patient)):
    """
    Get current patient's profile
    """
    # ensure avatar_url is absolute
    if getattr(patient, "avatar_url", None) and patient.avatar_url.startswith("/"):
        patient.avatar_url = f"{settings.APP_URL}{patient.avatar_url}"
    return patient


@router.get("/{patient_id}", response_model=schemas.PatientRead)
async def get_patient(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a specific patient by ID
    """
    # Patients can only view their own profile
    if current_user.role == "patient":
        patient = (
            db.query(Patient)
            .filter(Patient.id == patient_id, Patient.user_id == current_user.id)
            .first()
        )
    else:
        # Doctors and admins can view any patient
        patient = db.query(Patient).filter(Patient.id == patient_id).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
        )

    if getattr(patient, "avatar_url", None) and patient.avatar_url.startswith("/"):
        patient.avatar_url = f"{settings.APP_URL}{patient.avatar_url}"
    return patient


@router.post(
    "", response_model=schemas.PatientRead, status_code=status.HTTP_201_CREATED
)
async def create_patient(
    patient_data: schemas.PatientCreate,
    current_user: User = Depends(require_role(["doctor", "admin"])),
    db: Session = Depends(get_db),
):
    """
    Create a new patient (only for doctors and admins)
    """
    new_patient = Patient(**patient_data.model_dump())

    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    return new_patient


@router.put("/me", response_model=schemas.PatientRead)
async def update_my_profile(
    patient_data: schemas.PatientUpdate,
    patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    """
    Update current patient's profile
    """
    update_data = patient_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(patient, field, value)

    db.commit()
    db.refresh(patient)

    return patient


@router.patch("/me", response_model=schemas.PatientRead)
async def patch_my_profile(
    patient_data: schemas.PatientUpdate,
    patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    """
    Partially update current patient's profile
    """
    update_data = patient_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(patient, field, value)

    db.commit()
    db.refresh(patient)

    return patient


@router.post("/me/avatar", response_model=schemas.PatientRead)
async def upload_my_avatar(
    file: UploadFile = File(...),
    patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    """Upload avatar for current patient"""
    # Generate a safe filename using UUID and preserve extension
    ext = pathlib.Path(file.filename).suffix or ""
    filename = f"patient_{patient.id}_{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(AVATAR_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(await file.read())

    # Store relative URL
    patient.avatar_url = f"/static/avatars/{filename}"
    db.commit()
    db.refresh(patient)

    return patient


@router.put("/{patient_id}", response_model=schemas.PatientRead)
async def update_patient(
    patient_id: int,
    patient_data: schemas.PatientUpdate,
    current_user: User = Depends(require_role(["doctor", "admin"])),
    db: Session = Depends(get_db),
):
    """
    Update a patient's information (only for doctors and admins)
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
        )

    update_data = patient_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(patient, field, value)

    db.commit()
    db.refresh(patient)

    return patient


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(
    patient_id: int,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    """
    Delete a patient (only for admins)
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
        )

    db.delete(patient)
    db.commit()

    return None
