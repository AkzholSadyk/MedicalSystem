from typing import List

from database import get_db
from dependencies import get_current_user, require_role
from fastapi import APIRouter, Depends, HTTPException, status
from models import Doctor, MedicalRecord, Patient, User
from schemas import MedicalRecordCreate, MedicalRecordRead, MedicalRecordUpdate
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("", response_model=List[MedicalRecordRead])
async def get_medical_records(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get medical records based on user role
    - Patients: only their records
    - Doctors: records they created
    - Admins: all records
    """
    query = db.query(MedicalRecord)

    if current_user.role == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if patient:
            query = query.filter(MedicalRecord.patient_id == patient.id)
    elif current_user.role == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if doctor:
            query = query.filter(MedicalRecord.doctor_id == doctor.id)

    records = (
        query.order_by(MedicalRecord.record_date.desc()).offset(skip).limit(limit).all()
    )
    return records


@router.get("/patient", response_model=List[MedicalRecordRead])
async def get_current_patient_medical_records(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get medical records for the authenticated patient user.
    This explicit route avoids treating the string 'patient' as an integer path parameter.
    """
    if current_user.role != "patient":
        return []

    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        return []

    records = (
        db.query(MedicalRecord)
        .filter(MedicalRecord.patient_id == patient.id)
        .order_by(MedicalRecord.record_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return records


@router.get("/patient/{patient_id}", response_model=List[MedicalRecordRead])
async def get_patient_medical_records(
    patient_id: int,
    current_user: User = Depends(require_role(["doctor", "admin"])),
    db: Session = Depends(get_db),
):
    """
    Get all medical records for a specific patient (doctors and admins only)
    """
    records = (
        db.query(MedicalRecord)
        .filter(MedicalRecord.patient_id == patient_id)
        .order_by(MedicalRecord.record_date.desc())
        .all()
    )

    return records


@router.get("/{record_id}", response_model=MedicalRecordRead)
async def get_medical_record(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a specific medical record by ID
    """
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Medical record not found"
        )

    # Check access permissions
    if current_user.role == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or record.patient_id != patient.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
            )
    elif current_user.role == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor or record.doctor_id != doctor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
            )

    return record


@router.post("", response_model=MedicalRecordRead, status_code=status.HTTP_201_CREATED)
async def create_medical_record(
    record_data: MedicalRecordCreate,
    current_user: User = Depends(require_role(["doctor", "admin"])),
    db: Session = Depends(get_db),
):
    """
    Create a new medical record (only doctors can create)
    """
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == record_data.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
        )

    # Verify doctor exists
    doctor = db.query(Doctor).filter(Doctor.id == record_data.doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found"
        )

    # If current user is a doctor, ensure they are creating their own record
    if current_user.role == "doctor":
        current_doctor = (
            db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        )
        if current_doctor and current_doctor.id != record_data.doctor_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Doctors can only create records for themselves",
            )

    new_record = MedicalRecord(**record_data.model_dump())

    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return MedicalRecordRead.from_orm(new_record)


@router.put("/{record_id}", response_model=MedicalRecordRead)
async def update_medical_record(
    record_id: int,
    record_data: MedicalRecordUpdate,
    current_user: User = Depends(require_role(["doctor", "admin"])),
    db: Session = Depends(get_db),
):
    """
    Update a medical record (only the doctor who created it or admins)
    """
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Medical record not found"
        )

    # Check if doctor is updating their own record
    if current_user.role == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor or record.doctor_id != doctor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own medical records",
            )

    update_data = record_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)

    return MedicalRecordRead.from_orm(record)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_medical_record(
    record_id: int,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    """
    Delete a medical record (only admins)
    """
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Medical record not found"
        )

    db.delete(record)
    db.commit()

    return None
