export interface MedicalRecord {
  id: number;
  patient_id: number;
  doctor_id: number;
  doctor_name: string;
  // Optional nested doctor object when backend includes related doctor data
  doctor?: {
    first_name?: string;
    last_name?: string;
    patronymic?: string;
  };
  diagnosis: string;
  treatment: string;
  notes: string;
  created_at: string;
}
