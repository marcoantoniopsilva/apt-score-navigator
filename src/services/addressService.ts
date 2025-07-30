import { supabase } from '@/integrations/supabase/client';
import { UserAddress, AddressFormData, AddressSearchResult } from '@/types/address';

export class AddressService {
  // Buscar endereços do usuário
  static async getUserAddresses(userId: string): Promise<UserAddress[]> {
    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar endereços:', error);
      throw error;
    }

    return (data || []) as UserAddress[];
  }

  // Salvar novo endereço
  static async saveAddress(userId: string, addressData: AddressFormData & { latitude?: number; longitude?: number }): Promise<UserAddress> {
    const { data, error } = await supabase
      .from('user_addresses')
      .insert({
        user_id: userId,
        ...addressData
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar endereço:', error);
      throw error;
    }

    return data as UserAddress;
  }

  // Atualizar endereço
  static async updateAddress(addressId: string, addressData: Partial<AddressFormData> & { latitude?: number; longitude?: number }): Promise<UserAddress> {
    const { data, error } = await supabase
      .from('user_addresses')
      .update(addressData)
      .eq('id', addressId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar endereço:', error);
      throw error;
    }

    return data as UserAddress;
  }

  // Deletar endereço
  static async deleteAddress(addressId: string): Promise<void> {
    const { error } = await supabase
      .from('user_addresses')
      .delete()
      .eq('id', addressId);

    if (error) {
      console.error('Erro ao deletar endereço:', error);
      throw error;
    }
  }

  // Buscar endereços via API do Mapbox
  static async searchAddresses(query: string): Promise<AddressSearchResult[]> {
    try {
      const response = await supabase.functions.invoke('get-mapbox-token');
      if (!response.data?.token) {
        throw new Error('Token do Mapbox não disponível');
      }

      const mapboxResponse = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${response.data.token}&country=BR&types=address,place&limit=5`
      );

      if (!mapboxResponse.ok) {
        throw new Error('Erro na busca de endereços');
      }

      const data = await mapboxResponse.json();
      return data.features?.map((feature: any) => ({
        place_name: feature.place_name,
        center: feature.center,
        place_type: feature.place_type,
        address: feature.properties?.address,
        postcode: feature.properties?.postcode
      })) || [];
    } catch (error) {
      console.error('Erro ao buscar endereços:', error);
      return [];
    }
  }

  // Calcular distância entre dois pontos usando Haversine
  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Raio da Terra em metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distância em metros
  }
}