from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional, Union

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ============= User Schemas =============
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    first_name: str
    last_name: str

    email: EmailStr
    role: str = Field(..., pattern="^(patient|doctor|admin)$")


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    patronymic: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    city: Optional[str] = None


class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None


class UserRead(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserInDB(UserRead):
    hashed_password: str


# ============= Token Schemas =============
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class TokenData(BaseModel):
    username: Optional[str] = None


# ============= Patient Schemas =============
class PatientBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    patronymic: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    blood_type: Optional[str] = Field(None, max_length=5)
    allergies: Optional[str] = None
    emergency_contact: Optional[str] = Field(None, max_length=100)
    emergency_phone: Optional[str] = Field(None, max_length=20)


class PatientCreate(PatientBase):
    user_id: Optional[int] = None


class PatientUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    patronymic: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    blood_type: Optional[str] = Field(None, max_length=5)
    allergies: Optional[str] = None
    emergency_contact: Optional[str] = Field(None, max_length=100)
    emergency_phone: Optional[str] = Field(None, max_length=20)


class PatientRead(PatientBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============= Clinic Schemas =============
class ClinicBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    address: str = Field(..., min_length=1)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    working_hours: Optional[str] = None
    description: Optional[str] = None


class ClinicCreate(ClinicBase):
    pass


class ClinicUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    address: Optional[str] = Field(None, min_length=1)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    working_hours: Optional[str] = None
    description: Optional[str] = None


class ClinicRead(ClinicBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============= Department Schemas =============
class DepartmentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    clinic_id: int
    floor: Optional[int] = None
    phone: Optional[str] = Field(None, max_length=20)


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    clinic_id: Optional[int] = None
    floor: Optional[int] = None
    phone: Optional[str] = Field(None, max_length=20)


class DepartmentRead(DepartmentBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============= Doctor Schemas =============
class DoctorBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    patronymic: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=100)
    specialization: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    license_number: Optional[str] = Field(None, max_length=50)
    years_of_experience: Optional[int] = Field(None, ge=0)
    education: Optional[str] = None
    bio: Optional[str] = None
    consultation_fee: Optional[Decimal] = Field(None, ge=0)


class DoctorCreate(DoctorBase):
    user_id: Optional[int] = None


class DoctorUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    patronymic: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=100)
    specialization: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    license_number: Optional[str] = Field(None, max_length=50)
    years_of_experience: Optional[int] = Field(None, ge=0)
    education: Optional[str] = None
    bio: Optional[str] = None
    consultation_fee: Optional[Decimal] = Field(None, ge=0)


class DoctorRead(DoctorBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    # Include related clinics and departments for convenience in responses
    clinics: List["ClinicRead"] = []
    departments: List["DepartmentRead"] = []

    model_config = ConfigDict(from_attributes=True)


# ============= Appointment Schemas =============
class AppointmentBase(BaseModel):
    # patient_id may be omitted when the authenticated patient creates the appointment
    patient_id: Optional[int] = None
    doctor_id: int
    clinic_id: Optional[int] = None
    # Accept either a date or a datetime from the client; router will convert datetime -> date/time
    appointment_date: Union[date, datetime]
    # appointment_time may be omitted if client sends a datetime
    appointment_time: Optional[str] = Field(
        None, pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
    )
    duration: int = Field(default=30, ge=15, le=180)
    status: str = Field(
        default="scheduled", pattern="^(scheduled|completed|cancelled|no_show)$"
    )
    appointment_type: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(BaseModel):
    appointment_date: Optional[date] = None
    appointment_time: Optional[str] = Field(
        None, pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
    )
    duration: Optional[int] = Field(None, ge=15, le=180)
    status: Optional[str] = Field(
        None, pattern="^(scheduled|completed|cancelled|no_show)$"
    )
    appointment_type: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None


class AppointmentRead(AppointmentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Calendar-specific read schema: includes nested patient and doctor summaries and iso datetimes
class CalendarParticipant(BaseModel):
    id: int
    first_name: str
    last_name: str
    phone: Optional[str] = None


class CalendarAppointment(BaseModel):
    id: int
    start_time: datetime
    end_time: datetime
    reason: Optional[str] = None
    status: str
    patient: Optional[CalendarParticipant] = None
    doctor: Optional[CalendarParticipant] = None

    model_config = ConfigDict(from_attributes=True)


# ============= Medical Record Schemas =============
class MedicalRecordBase(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_id: Optional[int] = None
    diagnosis: str = Field(..., min_length=1)
    symptoms: Optional[str] = None
    treatment: Optional[str] = None
    prescriptions: Optional[str] = None
    test_results: Optional[str] = None
    lab_results: Optional[str] = None  # Added for user request
    notes: Optional[str] = None
    record_date: date


class MedicalRecordCreate(MedicalRecordBase):
    pass


class MedicalRecordUpdate(BaseModel):
    diagnosis: Optional[str] = Field(None, min_length=1)
    symptoms: Optional[str] = None
    treatment: Optional[str] = None
    prescriptions: Optional[str] = None
    test_results: Optional[str] = None
    lab_results: Optional[str] = None  # Added for user request
    notes: Optional[str] = None
    record_date: Optional[date] = None


class MedicalRecordRead(MedicalRecordBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============= AI Chat Schemas =============


class AIChatMessageCreate(BaseModel):
    session_id: Optional[int] = None
    content: str = Field(..., min_length=1)


class AIChatMessageRead(BaseModel):
    id: int
    user_id: int
    session_id: int
    role: str
    content: str
    model: Optional[str] = None
    tokens_used: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AIChatSessionCreate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)


class AIChatSessionRead(BaseModel):
    id: int
    user_id: int
    title: Optional[str] = None
    started_at: datetime
    last_message_at: datetime
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class AIChatSessionWithMessagesRead(AIChatSessionRead):
    messages: List[AIChatMessageRead] = []
    model_config = ConfigDict(from_attributes=True)


# ============= Dashboard Schemas =============
class DashboardStats(BaseModel):
    total_patients: int = 0
    total_doctors: int = 0
    total_appointments: int = 0
    total_medical_records: int = 0
    total_clinics: int = 0
    appointments_today: int = 0
    upcoming_appointments: int = 0
    completed_appointments: int = 0


class PatientDashboardStats(BaseModel):
    upcoming_appointments: int = 0
    completed_appointments: int = 0
    total_medical_records: int = 0
    total_appointments: int = 0


class DoctorDashboardStats(BaseModel):
    total_patients: int = 0
    appointments_today: int = 0
    upcoming_appointments: int = 0
    total_medical_records: int = 0


# ============= Doctor-Patient Chat Schemas =============
class ChatMessageBase(BaseModel):
    content: str = Field(..., min_length=1)


class ChatMessageCreate2(ChatMessageBase):
    session_id: int


class ChatMessageResponse(ChatMessageBase):
    id: int
    session_id: int
    sender_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DoctorPatientChatSessionRead(BaseModel):
    patient_id: int
    doctor_id: int


class ChatSessionCreate(ChatMessageBase):
    pass


class ChatSession(ChatMessageBase):
    id: int
    created_at: datetime
    last_message_at: datetime
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class DoctorPatientChatMessageResponse(BaseModel):
    id: int
    session_id: int
    sender: str
    message: str
    timestamp: datetime


class DoctorPatientChatSessionWithMessagesRead(DoctorPatientChatSessionRead):
    messages: List[DoctorPatientChatMessageResponse] = []
    model_config = ConfigDict(from_attributes=True)


class ChatSessionWithMessages(ChatSession):
    messages: List[ChatMessageResponse] = []


class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ============= AI Chat Schemas (новые/исправленные) =============
# Pydantic-схема для чтения AI Chat Session


class AIChatSessionRead(BaseModel):
    id: int
    user_id: int
    title: Optional[str] = None
    started_at: datetime
    last_message_at: datetime
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class AIChatSessionWithMessagesRead(AIChatSessionRead):
    messages: List[AIChatMessageRead] = []
    model_config = ConfigDict(from_attributes=True)


# ============= Medication Schemas =============
class MedicationBase(BaseModel):
    """Base schema for medication data"""

    name: str = Field(..., min_length=1, max_length=200)
    generic_name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    form: Optional[str] = Field(None, max_length=100)
    image_url: Optional[str] = Field(None, max_length=500)


class MedicationCreate(MedicationBase):
    """Schema for creating a medication record"""

    pass


class MedicationUpdate(BaseModel):
    """Schema for updating medication data"""

    name: Optional[str] = Field(None, min_length=1, max_length=200)
    generic_name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    form: Optional[str] = Field(None, max_length=100)
    image_url: Optional[str] = Field(None, max_length=500)


class MedicationRead(MedicationBase):
    """Schema for reading medication data"""

    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
