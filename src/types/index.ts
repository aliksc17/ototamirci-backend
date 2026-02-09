export type Role = 'customer' | 'mechanic';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar_url?: string;
  phone?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  phone: string;
  image_url: string;
  rating: number;
  is_open: boolean;
  categories?: string[];
  distance?: number;
  created_at: Date;
  updated_at: Date;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'rejected' | 'completed';

export interface Appointment {
  id: string;
  shop_id: string;
  user_id: string;
  car_model: string;
  appointment_date: Date;
  service_type: string;
  status: AppointmentStatus;
  note?: string;
  created_at: Date;
  updated_at: Date;
  // For populated data
  user_name?: string;
  shop_name?: string;
}
