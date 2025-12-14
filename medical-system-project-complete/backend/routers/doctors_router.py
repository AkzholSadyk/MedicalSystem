import os
import pathlib
import uuid
from typing import List, Optional

from config import settings
from database import get_db
from dependencies import get_current_doctor, require_role
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from models import Clinic, Doctor, DoctorClinic, User
from schemas import DoctorCreate, DoctorRead, DoctorUpdate
from sqlalchemy import or_
from sqlalchemy.orm import Session

router = APIRouter()

AVATAR_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "static", "avatars")
)
os.makedirs(AVATAR_DIR, exist_ok=True)


@router.get("", response_model=List[DoctorRead])
async def get_doctors(
    skip: int = 0,
    limit: int = 100,
    specialization: Optional[str] = Query(None, description="Filter by specialization"),
    clinic: Optional[str] = Query(None, description="Filter by clinic name"),
    search: Optional[str] = Query(
        None, description="Search by name, specialization, or clinic"
    ),
    db: Session = Depends(get_db),
):
    """
    Get list of doctors with optional filters.
    Supports filtering by specialization, clinic, and general search.
    """
    query = db.query(Doctor)

    # Filter by specialization
    if specialization:
        query = query.filter(Doctor.specialization.ilike(f"%{specialization}%"))

    # Filter by clinic name (through DoctorClinic relationship)
    if clinic:
        query = (
            query.join(DoctorClinic)
            .join(Clinic)
            .filter(Clinic.name.ilike(f"%{clinic}%"))
        )

    # General search filter (name, specialization, or clinic)
    if search:
        search_filter = f"%{search}%"
        # Search in doctor name or specialization
        name_filter = or_(
            Doctor.first_name.ilike(search_filter),
            Doctor.last_name.ilike(search_filter),
            Doctor.specialization.ilike(search_filter),
        )

        # Also search in clinics if clinic filter is not already applied
        if not clinic:
            clinic_subquery = (
                db.query(DoctorClinic.doctor_id)
                .join(Clinic)
                .filter(Clinic.name.ilike(search_filter))
                .subquery()
            )
            query = query.filter(or_(name_filter, Doctor.id.in_(clinic_subquery)))
        else:
            query = query.filter(name_filter)
    else:
        # If clinic filter is applied, ensure we join the tables
        if clinic:
            query = query.join(DoctorClinic).join(Clinic)

    doctors = query.offset(skip).limit(limit).distinct().all()
    # normalize avatar urls
    for d in doctors:
        if getattr(d, "avatar_url", None) and d.avatar_url.startswith("/"):
            d.avatar_url = f"{settings.APP_URL}{d.avatar_url}"
    return doctors


@router.get("/me", response_model=DoctorRead)
async def get_my_profile(doctor: Doctor = Depends(get_current_doctor)):
    """
    Get current doctor's profile
    """
    # Ensure related clinics/departments are available for Pydantic `DoctorRead`
    try:
        doctor.clinics = getattr(doctor, "clinics", [])
    except Exception:
        doctor.clinics = []

    # departments may be stored through DoctorClinic -> Department relationship
    deps = []
    for dc in getattr(doctor, "clinics", []):
        if getattr(dc, "department", None):
            deps.append(dc.department)
    doctor.departments = deps

    return doctor


@router.get("/{doctor_id}", response_model=DoctorRead)
async def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    """
    Get a specific doctor by ID (public endpoint)
    """
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()

    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found"
        )

    # attach related clinics/departments
    doctor.clinics = getattr(doctor, "clinics", [])
    deps = []
    for dc in getattr(doctor, "clinics", []):
        if getattr(dc, "department", None):
            deps.append(dc.department)
    doctor.departments = deps

    if getattr(doctor, "avatar_url", None) and doctor.avatar_url.startswith("/"):
        doctor.avatar_url = f"{settings.APP_URL}{doctor.avatar_url}"
    return doctor


@router.post("", response_model=DoctorRead, status_code=status.HTTP_201_CREATED)
async def create_doctor(
    doctor_data: DoctorCreate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    """
    Create a new doctor (only for admins)
    """
    new_doctor = Doctor(**doctor_data.model_dump())

    db.add(new_doctor)
    db.commit()
    db.refresh(new_doctor)

    return new_doctor


@router.put("/me", response_model=DoctorRead)
async def update_my_profile(
    doctor_data: DoctorUpdate,
    doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    """
    Update current doctor's profile
    """
    update_data = doctor_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(doctor, field, value)

    db.commit()
    db.refresh(doctor)

    return doctor


@router.post("/me/avatar", response_model=DoctorRead)
async def upload_my_avatar(
    file: UploadFile = File(...),
    doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    filename = f"doctor_{doctor.id}_{file.filename}"
    # generate safe filename with uuid
    ext = pathlib.Path(file.filename).suffix or ""
    filename = f"doctor_{doctor.id}_{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(AVATAR_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(await file.read())

    doctor.avatar_url = f"/static/avatars/{filename}"
    db.commit()
    db.refresh(doctor)

    return doctor


@router.put("/{doctor_id}", response_model=DoctorRead)
async def update_doctor(
    doctor_id: int,
    doctor_data: DoctorUpdate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    """
    Update a doctor's information (only for admins)
    """
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()

    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found"
        )

    update_data = doctor_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(doctor, field, value)

    db.commit()
    db.refresh(doctor)

    return doctor


@router.delete("/{doctor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_doctor(
    doctor_id: int,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    """
    Delete a doctor (only for admins)
    """
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()

    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found"
        )

    db.delete(doctor)
    db.commit()

    return None
