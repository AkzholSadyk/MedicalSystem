export interface Patient {
  id: number;
  user_id: number;
  first_name?: string;
  last_name?: string;
  full_name: string;
  date_of_birth: string;
  phone_number: string;
  // Optional additional fields used in some templates
  patronymic?: string;
  city?: string;
  // Some templates reference `phone` instead of `phone_number`
  phone?: string;
  address: string;
  created_at: string;
}
