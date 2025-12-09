from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_doctor, require_role
from models import Doctor, User
from schemas import DoctorCreate, DoctorRead, DoctorUpdate

router = APIRouter()


@router.get("", response_model=List[DoctorRead])
async def get_doctors(
    skip: int = 0,
    limit: int = 100,
    specialization: Optional[str] = Query(None, description="Filter by specialization"),
    db: Session = Depends(get_db),
):
    query = db.query(Doctor)

    if specialization:
        query = query.filter(Doctor.specialization.ilike(f"%{specialization}%"))

    doctors = query.offset(skip).limit(limit).all()
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
