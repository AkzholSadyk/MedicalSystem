export interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  doctor_name?: string;
  patient_name: string;
  // backend uses `notes` to store appointment reason/details
  notes?: string;
  // optional nested patient object when backend doesn't include flattened name
  patient?: {
  id?: number;
  first_name?: string;
  last_name?: string;
  phone?: string;
  };
  // optional nested doctor object attached by frontend enrichment
  doctor?: {
  id?: number;
  first_name?: string;
  last_name?: string;
  specialization?: string;
  phone?: string;
  };
  appointment_date: string; // ISO 8601 string
  appointment_time?: string; // e.g. '09:30'
  duration?: number; // minutes
  // legacy `reason` kept for compatibility, prefer `notes`
  reason?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
}

export interface CreateAppointment {
  doctor_id: number;
  appointment_date: string;
  reason: string;
}
