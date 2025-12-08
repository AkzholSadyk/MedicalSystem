from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import Appointment, Clinic, Doctor, MedicalRecord, Patient, User
from schemas import DashboardStats, DoctorDashboardStats, PatientDashboardStats

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """
    Get dashboard statistics based on user role
    """
    if current_user.role == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient:
            return DashboardStats()

        total_appointments = (
            db.query(func.count(Appointment.id))
            .filter(Appointment.patient_id == patient.id)
            .scalar()
            or 0
        )

        upcoming_appointments = (
            db.query(func.count(Appointment.id))
            .filter(
                Appointment.patient_id == patient.id,
                Appointment.appointment_date >= date.today(),
                Appointment.status == "scheduled",
            )
            .scalar()
            or 0
        )

        completed_appointments = (
            db.query(func.count(Appointment.id))
            .filter(
                Appointment.patient_id == patient.id, Appointment.status == "completed"
            )
            .scalar()
            or 0
        )

        total_medical_records = (
            db.query(func.count(MedicalRecord.id))
            .filter(MedicalRecord.patient_id == patient.id)
            .scalar()
            or 0
        )

        return DashboardStats(
            total_appointments=total_appointments,
            upcoming_appointments=upcoming_appointments,
            completed_appointments=completed_appointments,
            total_medical_records=total_medical_records,
        )

    elif current_user.role == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor:
            return DashboardStats()

        # Get unique patients
        total_patients = (
            db.query(func.count(func.distinct(Appointment.patient_id)))
            .filter(Appointment.doctor_id == doctor.id)
            .scalar()
            or 0
        )

        appointments_today = (
            db.query(func.count(Appointment.id))
            .filter(
                Appointment.doctor_id == doctor.id,
                Appointment.appointment_date == date.today(),
            )
            .scalar()
            or 0
        )

        upcoming_appointments = (
            db.query(func.count(Appointment.id))
            .filter(
                Appointment.doctor_id == doctor.id,
                Appointment.appointment_date >= date.today(),
                Appointment.status == "scheduled",
            )
            .scalar()
            or 0
        )

        total_medical_records = (
            db.query(func.count(MedicalRecord.id))
            .filter(MedicalRecord.doctor_id == doctor.id)
            .scalar()
            or 0
        )

        total_appointments = (
            db.query(func.count(Appointment.id))
            .filter(Appointment.doctor_id == doctor.id)
            .scalar()
            or 0
        )

        return DashboardStats(
            total_patients=total_patients,
            appointments_today=appointments_today,
            upcoming_appointments=upcoming_appointments,
            total_medical_records=total_medical_records,
            total_appointments=total_appointments,
        )

    else:  # admin
        total_patients = db.query(func.count(Patient.id)).scalar() or 0
        total_doctors = db.query(func.count(Doctor.id)).scalar() or 0
        total_appointments = db.query(func.count(Appointment.id)).scalar() or 0
        total_medical_records = db.query(func.count(MedicalRecord.id)).scalar() or 0
        total_clinics = db.query(func.count(Clinic.id)).scalar() or 0

        appointments_today = (
            db.query(func.count(Appointment.id))
            .filter(Appointment.appointment_date == date.today())
            .scalar()
            or 0
        )

        upcoming_appointments = (
            db.query(func.count(Appointment.id))
            .filter(
                Appointment.appointment_date >= date.today(),
                Appointment.status == "scheduled",
            )
            .scalar()
            or 0
        )

        completed_appointments = (
            db.query(func.count(Appointment.id))
            .filter(Appointment.status == "completed")
            .scalar()
            or 0
        )

        return DashboardStats(
            total_patients=total_patients,
            total_doctors=total_doctors,
            total_appointments=total_appointments,
            total_medical_records=total_medical_records,
            total_clinics=total_clinics,
            appointments_today=appointments_today,
            upcoming_appointments=upcoming_appointments,
            completed_appointments=completed_appointments,
        )


@router.get("/patient-stats", response_model=PatientDashboardStats)
async def get_patient_stats(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """
    Get statistics for patient dashboard
    """
    if current_user.role != "patient":
        return PatientDashboardStats()

    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        return PatientDashboardStats()

    upcoming_appointments = (
        db.query(func.count(Appointment.id))
        .filter(
            Appointment.patient_id == patient.id,
            Appointment.appointment_date >= date.today(),
            Appointment.status == "scheduled",
        )
        .scalar()
        or 0
    )

    completed_appointments = (
        db.query(func.count(Appointment.id))
        .filter(Appointment.patient_id == patient.id, Appointment.status == "completed")
        .scalar()
        or 0
    )

    total_medical_records = (
        db.query(func.count(MedicalRecord.id))
        .filter(MedicalRecord.patient_id == patient.id)
        .scalar()
        or 0
    )

    total_appointments = (
        db.query(func.count(Appointment.id))
        .filter(Appointment.patient_id == patient.id)
        .scalar()
        or 0
    )

    return PatientDashboardStats(
        upcoming_appointments=upcoming_appointments,
        completed_appointments=completed_appointments,
        total_medical_records=total_medical_records,
        total_appointments=total_appointments,
    )


@router.get("/doctor-stats", response_model=DoctorDashboardStats)
async def get_doctor_stats(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """
    Get statistics for doctor dashboard
    """
    if current_user.role != "doctor":
        return DoctorDashboardStats()

    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        return DoctorDashboardStats()

    total_patients = (
        db.query(func.count(func.distinct(Appointment.patient_id)))
        .filter(Appointment.doctor_id == doctor.id)
        .scalar()
        or 0
    )

    appointments_today = (
        db.query(func.count(Appointment.id))
        .filter(
            Appointment.doctor_id == doctor.id,
            Appointment.appointment_date == date.today(),
        )
        .scalar()
        or 0
    )

    upcoming_appointments = (
        db.query(func.count(Appointment.id))
        .filter(
            Appointment.doctor_id == doctor.id,
            Appointment.appointment_date >= date.today(),
            Appointment.status == "scheduled",
        )
        .scalar()
        or 0
    )

    total_medical_records = (
        db.query(func.count(MedicalRecord.id))
        .filter(MedicalRecord.doctor_id == doctor.id)
        .scalar()
        or 0
    )

    return DoctorDashboardStats(
        total_patients=total_patients,
        appointments_today=appointments_today,
        upcoming_appointments=upcoming_appointments,
        total_medical_records=total_medical_records,
    )
