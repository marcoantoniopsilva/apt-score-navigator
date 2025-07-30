import { Property } from '@/types/property';
import { UserAddress, PropertyDistance } from '@/types/address';
import { AddressService } from '@/services/addressService';

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
  static calculateProximityData(
    property: Property, 
    userAddresses: UserAddress[]
  ): Pick<PropertyWithProximity, 'proximityDistances' | 'proximityBonuses' | 'adjustedScore'> {
    // Extrair coordenadas do endereço do imóvel (seria necessário geocodificar o endereço)
    // Por enquanto, vamos simular coordenadas baseadas no endereço
    const propertyCoords = this.extractCoordinatesFromAddress(property.address);
    
    if (!propertyCoords) {
      return {
        proximityDistances: [],
        proximityBonuses: [],
        adjustedScore: property.finalScore
      };
    }

    // Calcular distâncias para todos os endereços
    const distances = userAddresses
      .filter(addr => addr.latitude && addr.longitude)
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

        return {
          addressId: address.id,
          addressLabel: label,
          distance: Math.round(distance),
          travelTime: Math.round(distance / 1000 * 3)
        };
      })
      .sort((a, b) => a.distance - b.distance);

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
  static calculateProximityBonuses(
    properties: Property[],
    userAddresses: UserAddress[]
  ): Map<string, ProximityBonus[]> {
    const bonusMap = new Map<string, ProximityBonus[]>();

    // Agrupar endereços por tipo
    const addressGroups = {
      trabalho: userAddresses.filter(addr => addr.label === 'trabalho'),
      escola: userAddresses.filter(addr => addr.label === 'escola'),
      outro: userAddresses.filter(addr => addr.label === 'outro')
    };

    // Para cada tipo de endereço, encontrar o imóvel mais próximo
    (['trabalho', 'escola', 'outro'] as const).forEach(addressType => {
      const addresses = addressGroups[addressType].filter(addr => addr.latitude && addr.longitude);
      
      addresses.forEach(address => {
        let closestProperty: { property: Property; distance: number } | null = null;
        
        properties.forEach(property => {
          const propertyCoords = this.extractCoordinatesFromAddress(property.address);
          if (!propertyCoords) return;

          const distance = AddressService.calculateDistance(
            propertyCoords.lat,
            propertyCoords.lng,
            address.latitude!,
            address.longitude!
          );

          if (!closestProperty || distance < closestProperty.distance) {
            closestProperty = { property, distance };
          }
        });

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
      });
    });

    return bonusMap;
  }

  // Aplicar bônus de proximidade aos scores dos imóveis
  static applyProximityBonuses(
    properties: Property[],
    bonusMap: Map<string, ProximityBonus[]>
  ): PropertyWithProximity[] {
    return properties.map(property => {
      const bonuses = bonusMap.get(property.id) || [];
      const bonusPoints = bonuses.length; // +1 ponto por cada endereço onde é o mais próximo
      
      const proximityData = this.calculateProximityData(property, []);
      
      return {
        ...property,
        proximityDistances: proximityData.proximityDistances,
        proximityBonuses: bonuses,
        adjustedScore: property.finalScore + bonusPoints
      };
    });
  }

  // Extrair coordenadas do endereço (seria implementado com geocoding real)
  private static extractCoordinatesFromAddress(address: string): { lat: number; lng: number } | null {
    // Simulação - em produção, usaria geocoding do Mapbox
    // Por enquanto, vamos retornar coordenadas aleatórias de São Paulo
    const saoPaulo = {
      lat: -23.5505 + (Math.random() - 0.5) * 0.1,
      lng: -46.6333 + (Math.random() - 0.5) * 0.1
    };
    
    return saoPaulo;
  }

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