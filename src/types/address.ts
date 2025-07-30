export interface UserAddress {
  id: string;
  user_id: string;
  label: 'trabalho' | 'escola' | 'outro';
  custom_label?: string;
  address: string;
  cep?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface AddressFormData {
  label: 'trabalho' | 'escola' | 'outro';
  custom_label?: string;
  address: string;
  cep?: string;
}

export interface PropertyDistance {
  addressId: string;
  addressLabel: string;
  distance: number; // em metros
  travelTime?: number; // em minutos
}

export interface AddressSearchResult {
  place_name: string;
  center: [number, number]; // [longitude, latitude]
  place_type?: string[];
  address?: string;
  postcode?: string;
}