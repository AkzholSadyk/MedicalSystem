export interface MedicalRecord {
  id: number;
  patient_id: number;
  doctor_id: number;
  doctor_name: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  created_at: string;
}
