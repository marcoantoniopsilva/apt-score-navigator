import { Property } from '@/types/property';
import { UserAddress, PropertyDistance } from '@/types/address';
import { AddressService } from '@/services/addressService';
import { PropertyGeocodingService } from '@/services/propertyGeocoding';

export interface ProximityBonus {
  addressId: string;
  addressLabel: string;
  addressType: 'trabalho' | 'escola' | 'outro';
  isClosest: boolean;
  distance: number;
}

export interface PropertyWithProximity extends Property {
  proximityDistances: PropertyDistance[];
  proximityBonuses: ProximityBonus[];
  adjustedScore: number;
}

export class ProximityCalculator {
  // Calcular distâncias e bônus de proximidade para um imóvel
  static async calculateProximityData(
    property: Property, 
    userAddresses: UserAddress[]
  ): Promise<Pick<PropertyWithProximity, 'proximityDistances' | 'proximityBonuses' | 'adjustedScore'>> {
    console.log('ProximityCalculator: Calculating proximity for property:', property.id, property.address);
    console.log('ProximityCalculator: User addresses count:', userAddresses.length);
    
    // Tentar obter coordenadas reais do imóvel
    const propertyCoords = await PropertyGeocodingService.getCachedCoordinates(property.address);
    
    if (!propertyCoords) {
      console.log('ProximityCalculator: Could not geocode property address:', property.address);
      return {
        proximityDistances: [],
        proximityBonuses: [],
        adjustedScore: property.finalScore
      };
    }

    console.log('ProximityCalculator: Property coordinates:', propertyCoords);

    // Calcular distâncias para todos os endereços que possuem coordenadas
    const distances = userAddresses
      .filter(addr => {
        const hasCoords = addr.latitude && addr.longitude;
        if (!hasCoords) {
          console.log('ProximityCalculator: Address without coordinates:', addr.address);
        }
        return hasCoords;
      })
      .map(address => {
        const distance = AddressService.calculateDistance(
          propertyCoords.lat,
          propertyCoords.lng,
          address.latitude!,
          address.longitude!
        );

        const label = address.label === 'outro' && address.custom_label 
          ? address.custom_label 
          : this.getAddressDisplayLabel(address.label);

        console.log(`ProximityCalculator: Distance to ${label}: ${Math.round(distance)}m`);

        return {
          addressId: address.id,
          addressLabel: label,
          distance: Math.round(distance),
          travelTime: Math.round(distance / 1000 * 3)
        };
      })
      .sort((a, b) => a.distance - b.distance);

    console.log('ProximityCalculator: Calculated distances:', distances);

    // Calcular bônus de proximidade (assumindo que temos outros imóveis para comparar)
    const bonuses: ProximityBonus[] = [];
    // Esta lógica seria implementada quando comparando com outros imóveis
    
    return {
      proximityDistances: distances,
      proximityBonuses: bonuses,
      adjustedScore: property.finalScore
    };
  }

  // Calcular bônus de proximidade comparando múltiplos imóveis
  static async calculateProximityBonuses(
    properties: Property[],
    userAddresses: UserAddress[]
  ): Promise<Map<string, ProximityBonus[]>> {
    const bonusMap = new Map<string, ProximityBonus[]>();

    // Agrupar endereços por tipo
    const addressGroups = {
      trabalho: userAddresses.filter(addr => addr.label === 'trabalho'),
      escola: userAddresses.filter(addr => addr.label === 'escola'),
      outro: userAddresses.filter(addr => addr.label === 'outro')
    };

    // Para cada tipo de endereço, encontrar o imóvel mais próximo
    for (const addressType of ['trabalho', 'escola', 'outro'] as const) {
      const addresses = addressGroups[addressType].filter(addr => addr.latitude && addr.longitude);
      
      for (const address of addresses) {
        let closestProperty: { property: Property; distance: number } | null = null;
        
        for (const property of properties) {
          const propertyCoords = await PropertyGeocodingService.getCachedCoordinates(property.address);
          if (!propertyCoords) continue;

          const distance = AddressService.calculateDistance(
            propertyCoords.lat,
            propertyCoords.lng,
            address.latitude!,
            address.longitude!
          );

          if (!closestProperty || distance < closestProperty.distance) {
            closestProperty = { property, distance };
          }
        }

        // Adicionar bônus ao imóvel mais próximo
        if (closestProperty) {
          const existingBonuses = bonusMap.get(closestProperty.property.id) || [];
          const label = address.label === 'outro' && address.custom_label 
            ? address.custom_label 
            : this.getAddressDisplayLabel(address.label);

          existingBonuses.push({
            addressId: address.id,
            addressLabel: label,
            addressType: address.label,
            isClosest: true,
            distance: Math.round(closestProperty.distance)
          });

          bonusMap.set(closestProperty.property.id, existingBonuses);
        }
      }
    }

    return bonusMap;
  }

  // Aplicar bônus de proximidade aos scores dos imóveis
  static async applyProximityBonuses(
    properties: Property[],
    bonusMap: Map<string, ProximityBonus[]>
  ): Promise<PropertyWithProximity[]> {
    const enrichedProperties: PropertyWithProximity[] = [];
    
    for (const property of properties) {
      const bonuses = bonusMap.get(property.id) || [];
      const bonusPoints = bonuses.length; // +1 ponto por cada endereço onde é o mais próximo
      
      const proximityData = await this.calculateProximityData(property, []);
      
      enrichedProperties.push({
        ...property,
        proximityDistances: proximityData.proximityDistances,
        proximityBonuses: bonuses,
        adjustedScore: property.finalScore + bonusPoints
      });
    }
    
    return enrichedProperties;
  }

  // Método removido - agora usamos geocoding real via PropertyGeocodingService

  private static getAddressDisplayLabel(label: 'trabalho' | 'escola' | 'outro'): string {
    const labels = {
      trabalho: 'Trabalho',
      escola: 'Escola',
      outro: 'Outro'
    };
    return labels[label];
  }

  // Formatar distância para exibição
  static formatDistance(distanceInMeters: number): string {
    if (distanceInMeters < 1000) {
      return `${distanceInMeters}m`;
    } else {
      return `${(distanceInMeters / 1000).toFixed(1)}km`;
    }
  }

  // Formatar tempo de viagem para exibição
  static formatTravelTime(timeInMinutes: number): string {
    if (timeInMinutes < 60) {
      return `${timeInMinutes} min`;
    } else {
      const hours = Math.floor(timeInMinutes / 60);
      const minutes = timeInMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
    }
  }
}