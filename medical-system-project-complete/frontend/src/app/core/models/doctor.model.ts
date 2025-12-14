export interface Doctor {
  id: number;
  user_id: number;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  specialization?: string;
  phone_number?: string;
  // Backend may return `phone` instead of `phone_number`
  phone?: string;
  clinic_name?: string;
  department_name?: string;
  avatar_url?: string;
  // Backend includes clinics/departments arrays
  clinics?: Array<{ id?: number; name?: string }>;
  departments?: Array<{ id?: number; name?: string }>;
  created_at?: string;
}
