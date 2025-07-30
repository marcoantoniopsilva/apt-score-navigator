import { supabase } from '@/integrations/supabase/client';

export class PropertyGeocodingService {
  // Buscar coordenadas de um endereço usando Mapbox
  static async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      console.log('PropertyGeocodingService: Geocoding address:', address);
      
      const response = await supabase.functions.invoke('get-mapbox-token');
      
      if (!response.data?.token) {
        console.error('PropertyGeocodingService: Mapbox token not available');
        return null;
      }

      const mapboxResponse = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${response.data.token}&country=BR&types=address,place&limit=1`
      );

      if (!mapboxResponse.ok) {
        console.error('PropertyGeocodingService: Mapbox API error:', mapboxResponse.status);
        return null;
      }

      const data = await mapboxResponse.json();
      const feature = data.features?.[0];
      
      if (feature?.center) {
        const coordinates = {
          lat: feature.center[1],
          lng: feature.center[0]
        };
        console.log('PropertyGeocodingService: Successfully geocoded:', coordinates);
        return coordinates;
      }

      console.log('PropertyGeocodingService: No coordinates found for address');
      return null;
    } catch (error) {
      console.error('PropertyGeocodingService: Error geocoding address:', error);
      return null;
    }
  }

  // Cache de coordenadas em memória para evitar múltiplas consultas
  private static coordsCache = new Map<string, { lat: number; lng: number } | null>();

  static async getCachedCoordinates(address: string): Promise<{ lat: number; lng: number } | null> {
    if (this.coordsCache.has(address)) {
      return this.coordsCache.get(address) || null;
    }

    const coords = await this.geocodeAddress(address);
    this.coordsCache.set(address, coords);
    return coords;
  }

  // Limpar cache
  static clearCache(): void {
    this.coordsCache.clear();
  }
}