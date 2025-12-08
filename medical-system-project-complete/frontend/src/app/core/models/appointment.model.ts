export interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  doctor_name: string;
  patient_name: string;
  appointment_date: string; // ISO 8601 string
  reason: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
}

export interface CreateAppointment {
  doctor_id: number;
  appointment_date: string;
  reason: string;
}
