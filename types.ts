export interface Profile {
  id: string;
  name: string;
  price_per_m2: number;
  weight_per_m2: number;
}

export interface Motor {
  id: string;
  name: string;
  max_weight: number;
  price: number;
}

export interface Axle {
  id: string;
  name: string;
  max_width: number; // Limit width for this axle
  price: number;
}

export interface OptionalItem {
  id: string;
  name: string;
  price: number;
  unit_type: 'fixed' | 'per_m2';
}

export interface Client {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  created_at?: string;
}

export interface Quote {
  id?: string;
  client_id?: string; // Link to Client
  customer_name: string; // Keep for legacy/display if client obj not loaded
  width: number;
  height: number;
  roll: number; // New field for "Rolo"
  quantity: number; // New field
  profile_id: string;
  motor_id: string | null;
  axle_id: string | null; // New field
  auto_motor: boolean;
  selected_optionals: string[]; // array of OptionalItem IDs
  total_price?: number;
  status?: 'pending' | 'approved'; // New field
  created_at?: string;
  
  // Calculated/Joined fields
  client?: Client;
  total_area?: number;
  total_weight?: number;
  calculated_motor?: Motor | null;
  calculated_axle?: Axle | null;
}

export type ViewMode = 'quote' | 'admin';
export type AdminTab = 'quotes' | 'profiles' | 'motors' | 'axles' | 'optionals';

export interface UserSession {
  user: {
    email: string;
  } | null;
}