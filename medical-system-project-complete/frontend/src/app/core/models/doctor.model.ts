export interface Doctor {
  id: number;
  user_id: number;
  first_name?: string;
  last_name?: string;
  full_name: string;
  specialization: string;
  phone_number: string;
  clinic_name: string;
  department_name: string;
  created_at: string;
}
