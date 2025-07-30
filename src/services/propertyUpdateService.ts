import { supabase } from '@/integrations/supabase/client';
import { Property } from '@/types/property';
import { PropertyGeocodingService } from '@/services/propertyGeocoding';

export class PropertyUpdateService {
  // Atualizar uma propriedade específica com suas coordenadas geocodificadas
  static async updatePropertyWithCoordinates(property: Property): Promise<Property> {
    try {
      console.log('PropertyUpdateService: Updating property with coordinates:', property.id);
      
      // Tentar obter coordenadas para o endereço da propriedade
      const coordinates = await PropertyGeocodingService.geocodeAddress(property.address);
      
      if (coordinates) {
        console.log('PropertyUpdateService: Coordinates found:', coordinates);
        
        // Atualizar a propriedade com as coordenadas (adicionando campos se necessário)
        const updatedProperty = {
          ...property,
          // Pode adicionar campos de latitude/longitude na tabela se necessário futuramente
          // Por enquanto, apenas armazenamos em cache
        };
        
        return updatedProperty;
      } else {
        console.log('PropertyUpdateService: No coordinates found for property');
        return property;
      }
    } catch (error) {
      console.error('PropertyUpdateService: Error updating property with coordinates:', error);
      return property;
    }
  }

  // Batch update de múltiplas propriedades
  static async batchUpdatePropertiesWithCoordinates(properties: Property[]): Promise<Property[]> {
    console.log('PropertyUpdateService: Batch updating properties with coordinates:', properties.length);
    
    const updatedProperties = await Promise.all(
      properties.map(property => this.updatePropertyWithCoordinates(property))
    );
    
    return updatedProperties;
  }

  // Pré-carregar coordenadas para todas as propriedades (útil na inicialização)
  static async preloadPropertyCoordinates(properties: Property[]): Promise<void> {
    console.log('PropertyUpdateService: Preloading coordinates for', properties.length, 'properties');
    
    await Promise.all(
      properties.map(async (property) => {
        try {
          await PropertyGeocodingService.getCachedCoordinates(property.address);
        } catch (error) {
          console.error('PropertyUpdateService: Error preloading coordinates for property:', property.id, error);
        }
      })
    );
    
    console.log('PropertyUpdateService: Finished preloading coordinates');
  }
}