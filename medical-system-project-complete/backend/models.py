from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class User(Base):
    """User model for authentication"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # patient, doctor, admin
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    patient = relationship(
        "Patient", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    doctor = relationship(
        "Doctor", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    ai_chat_sessions = relationship(
        "AIChatSession", back_populates="user", cascade="all, delete-orphan"
    )
    ai_chat_messages = relationship(
        "AIChatMessage", back_populates="user", cascade="all, delete-orphan"
    )


class Patient(Base):
    """Patient model"""

    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    patronymic = Column(String(100))
    city = Column(String(100))
    phone = Column(String(20))
    date_of_birth = Column(Date)
    address = Column(Text)
    blood_type = Column(String(5))
    allergies = Column(Text)
    emergency_contact = Column(String(100))
    emergency_phone = Column(String(20))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="patient")
    medical_records = relationship(
        "MedicalRecord", back_populates="patient", cascade="all, delete-orphan"
    )
    appointments = relationship(
        "Appointment", back_populates="patient", cascade="all, delete-orphan"
    )


class Doctor(Base):
    """Doctor model"""

    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    patronymic = Column(String(100))
    city = Column(String(100))
    specialization = Column(String(100), index=True)
    phone = Column(String(20))
    license_number = Column(String(50))
    years_of_experience = Column(Integer)
    education = Column(Text)
    bio = Column(Text)
    consultation_fee = Column(Numeric(10, 2))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="doctor")
    appointments = relationship(
        "Appointment", back_populates="doctor", cascade="all, delete-orphan"
    )
    medical_records = relationship("MedicalRecord", back_populates="doctor")
    clinics = relationship(
        "DoctorClinic", back_populates="doctor", cascade="all, delete-orphan"
    )


class Clinic(Base):
    """Clinic model"""

    __tablename__ = "clinics"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    address = Column(Text, nullable=False)
    phone = Column(String(20))
    email = Column(String(100))
    working_hours = Column(Text)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    departments = relationship(
        "Department", back_populates="clinic", cascade="all, delete-orphan"
    )
    doctors = relationship(
        "DoctorClinic", back_populates="clinic", cascade="all, delete-orphan"
    )
    appointments = relationship("Appointment", back_populates="clinic")


class Department(Base):
    """Department model"""

    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    clinic_id = Column(
        Integer, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False
    )
    floor = Column(Integer)
    phone = Column(String(20))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    clinic = relationship("Clinic", back_populates="departments")
    doctors = relationship("DoctorClinic", back_populates="department")


class DoctorClinic(Base):
    """Many-to-many relationship between doctors and clinics"""

    __tablename__ = "doctor_clinics"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(
        Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False
    )
    clinic_id = Column(
        Integer, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False
    )
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"))
    schedule = Column(Text)  # JSON string with schedule
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    doctor = relationship("Doctor", back_populates="clinics")
    clinic = relationship("Clinic", back_populates="doctors")
    department = relationship("Department", back_populates="doctors")


class Appointment(Base):
    """Appointment model"""

    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(
        Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False
    )
    doctor_id = Column(
        Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False
    )
    clinic_id = Column(Integer, ForeignKey("clinics.id", ondelete="SET NULL"))
    appointment_date = Column(Date, nullable=False, index=True)
    appointment_time = Column(String(10), nullable=False)
    duration = Column(Integer, default=30)  # minutes
    status = Column(
        String(20), default="scheduled", index=True
    )  # scheduled, completed, cancelled, no_show
    appointment_type = Column(String(50))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    clinic = relationship("Clinic", back_populates="appointments")
    medical_record = relationship(
        "MedicalRecord", back_populates="appointment", uselist=False
    )


class MedicalRecord(Base):
    """Medical record model"""

    __tablename__ = "medical_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(
        Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False
    )
    doctor_id = Column(
        Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False
    )
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="SET NULL"))
    diagnosis = Column(Text, nullable=False)
    symptoms = Column(Text)
    treatment = Column(Text)
    prescriptions = Column(Text)
    test_results = Column(Text)
    lab_results = Column(Text)  # Added for user request: "результат анализов"
    notes = Column(Text)
    record_date = Column(Date, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    patient = relationship("Patient", back_populates="medical_records")
    doctor = relationship("Doctor", back_populates="medical_records")
    appointment = relationship("Appointment", back_populates="medical_record")


class AIChatSession(Base):
    """AI Chat session model"""

    __tablename__ = "ai_chat_sessions"
    id = Column(Integer, primary_key=True, index=True)  # Это будет ID сессии
    # Legacy/compatibility session identifier (UUID string). Some DBs may have this column.
    session_id = Column(String(64), unique=True, nullable=False)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title = Column(String(200))
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    last_message_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    is_active = Column(Boolean, default=True)

    # Relationships
    user = relationship("User", back_populates="ai_chat_sessions")
    messages = relationship(
        "AIChatMessage", back_populates="session", cascade="all, delete-orphan"
    )


class AIChatMessage(Base):
    """AI Chat message model"""

    __tablename__ = "ai_chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    session_id = Column(
        Integer, ForeignKey("ai_chat_sessions.id", ondelete="CASCADE"), nullable=False
    )
    role = Column(String(20), nullable=False)  # 'user' или 'assistant'
    content = Column(Text, nullable=False)
    model = Column(String(50))
    tokens_used = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="ai_chat_messages")
    session = relationship("AIChatSession", back_populates="messages")


class ChatSession(Base):
    """Doctor-Patient Chat session model"""

    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(
        Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False
    )
    doctor_id = Column(
        Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_message_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    is_active = Column(Boolean, default=True)

    # Relationships
    patient = relationship("Patient", backref="chat_sessions")
    doctor = relationship("Doctor", backref="chat_sessions")
    messages = relationship(
        "ChatMessage", back_populates="session", cascade="all, delete-orphan"
    )


class ChatMessage(Base):
    """Doctor-Patient Chat message model"""

    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(
        Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False
    )
    sender_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )  # Sender can be doctor or patient (via user_id)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    session = relationship("ChatSession", back_populates="messages")
    sender = relationship("User", backref="sent_chat_messages")


# class AIChatMessage(Base):
#             __tablename__ = "ai_chat_messages"
#             id = Column(Integer, primary_key=True, index=True)
#             user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
#             session_id = Column(Integer, ForeignKey("ai_chat_sessions.id", ondelete="CASCADE"), nullable=False) # int
#             role = Column(String(20), nullable=False)
#             content = Column(Text, nullable=False)
#             model = Column(String(50))
#             tokens_used = Column(Integer)
#             created_at = Column(DateTime(timezone=True), server_default=func.now())
#             # НЕТ sender_id
