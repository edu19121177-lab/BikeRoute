export type LocationCategory = 'tienda' | 'taller' | 'estacion';

export interface LocationRecord {
  id: string;
  name: string;
  category: LocationCategory;
  address: string;
  phone: string;
  email: string;
  hours: string;
  latitude: number;
  longitude: number;
  description: string;
  available: boolean;
  bike_types_supported: string[];
  services_summary: string[];
  created_at: string;
}

export type ProductItemType = 'bicicleta' | 'accesorio';

export interface ProductRecord {
  id: string;
  location_id: string;
  item_type: ProductItemType;
  name: string;
  brand: string;
  bike_type: string;
  price: number;
  stock: number;
  available: boolean;
  specs: string;
  image_url: string;
  created_at: string;
}

export interface RepairRecord {
  id: string;
  location_id: string;
  service_name: string;
  service_category: string;
  bike_type: string;
  price: number;
  estimated_minutes: number;
  available: boolean;
  description: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: string[];
}
