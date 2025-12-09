export interface User {
  id: number;
  first_name?: string;
  last_name?: string;
  username: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  is_active: boolean;
  created_at: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role: 'patient' | 'doctor';
  patronymic?: string;
  gender?: string;
  phone?: string;
  date_of_birth?: string;
  city?: string;
}

export interface Token {
  access_token: string;
  token_type: string;
  user: User;
}
