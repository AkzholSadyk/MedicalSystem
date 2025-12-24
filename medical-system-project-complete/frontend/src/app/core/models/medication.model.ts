export interface Medication {
  id: number;
  name: string;
  generic_name?: string;
  description?: string;
  form?: string;
  image_url?: string;
  stored_image?: string;
  created_at: string;
}

