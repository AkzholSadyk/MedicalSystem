from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import Appointment, Doctor, Patient, User
from schemas import (  
    AppointmentCreate,
    AppointmentRead, 
    AppointmentUpdate,
)

router = APIRouter()


@router.get("", response_model=List[AppointmentRead])
async def get_appointments(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = Query(
        None, alias="status", description="Filter by status"
    ),
    date_from: Optional[date] = Query(
        None, description="Filter appointments from this date"
    ),
    date_to: Optional[date] = Query(
        None, description="Filter appointments to this date"
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get appointments based on user role
    - Patients: only their appointments
    - Doctors: appointments where they are the doctor
    - Admins: all appointments
    """
    query = db.query(Appointment)

    # Filter based on role
    if current_user.role == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if patient:
            query = query.filter(Appointment.patient_id == patient.id)
    elif current_user.role == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if doctor:
            query = query.filter(Appointment.doctor_id == doctor.id)

    # Apply filters
    if status_filter:
        query = query.filter(Appointment.status == status_filter)

    if date_from:
        query = query.filter(Appointment.appointment_date >= date_from)

    if date_to:
        query = query.filter(Appointment.appointment_date <= date_to)

    appointments = (
        query.order_by(
            Appointment.appointment_date.desc(), Appointment.appointment_time.desc()
        )
        .offset(skip)
        .limit(limit)
        .all()
    )

    return appointments


@router.get("/upcoming", response_model=List[AppointmentRead])
async def get_upcoming_appointments(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get upcoming appointments for current user
    """
    today = date.today()
    query = db.query(Appointment).filter(
        Appointment.appointment_date >= today, Appointment.status == "scheduled"
    )

    # Filter based on role
    if current_user.role == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if patient:
            query = query.filter(Appointment.patient_id == patient.id)
    elif current_user.role == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if doctor:
            query = query.filter(Appointment.doctor_id == doctor.id)

    appointments = (
        query.order_by(Appointment.appointment_date, Appointment.appointment_time)
        .limit(limit)
        .all()
    )

    return appointments


@router.get("/{appointment_id}", response_model=AppointmentRead)
async def get_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a specific appointment by ID
    """
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()

    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found"
        )

    # Check access permissions
    if current_user.role == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or appointment.patient_id != patient.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
            )
    elif current_user.role == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor or appointment.doctor_id != doctor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
            )

    return appointment


@router.post("", response_model=AppointmentRead, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appointment_data: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new appointment
    """
    # Verify doctor exists
    doctor = db.query(Doctor).filter(Doctor.id == appointment_data.doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found"
        )

    # If patient is creating, use their ID
    if current_user.role == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient profile not found",
            )
        appointment_data.patient_id = patient.id
    else:
        # Verify patient exists
        patient = (
            db.query(Patient).filter(Patient.id == appointment_data.patient_id).first()
        )
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
            )

    # Check for conflicting appointments
    existing = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == appointment_data.doctor_id,
            Appointment.appointment_date == appointment_data.appointment_date,
            Appointment.appointment_time == appointment_data.appointment_time,
            Appointment.status == "scheduled",
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This time slot is already booked",
        )

    new_appointment = Appointment(**appointment_data.model_dump())

    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)

    return new_appointment


@router.put("/{appointment_id}", response_model=AppointmentRead)
async def update_appointment(
    appointment_id: int,
    appointment_data: AppointmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update an appointment
    """
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()

    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found"
        )

    # Check permissions
    if current_user.role == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or appointment.patient_id != patient.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
            )
    elif current_user.role == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor or appointment.doctor_id != doctor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
            )

    update_data = appointment_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(appointment, field, value)

    db.commit()
    db.refresh(appointment)

    return appointment


@router.patch("/{appointment_id}/status", response_model=AppointmentRead)
async def update_appointment_status(
    appointment_id: int,
    status: str = Query(..., pattern="^(scheduled|completed|cancelled|no_show)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update appointment status
    """
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()

    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found"
        )

    appointment.status = status

    db.commit()
    db.refresh(appointment)

    return appointment


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete (cancel) an appointment
    """
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()

    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found"
        )

    # Check permissions
    if current_user.role == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or appointment.patient_id != patient.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
            )
    elif current_user.role == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor or appointment.doctor_id != doctor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
            )

    # Instead of deleting, mark as cancelled
    appointment.status = "cancelled"

    db.commit()

    return None
