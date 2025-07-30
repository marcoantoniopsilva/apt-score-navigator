import { useState, useEffect } from 'react';
import { Property } from '@/types/property';
import { UserAddress } from '@/types/address';
import { ProximityCalculator, PropertyWithProximity } from '@/utils/proximityCalculator';

export const useProximityCalculation = (
  properties: Property[],
  userAddresses: UserAddress[]
) => {
  const [enrichedProperties, setEnrichedProperties] = useState<PropertyWithProximity[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const enrichPropertiesWithProximity = async () => {
      if (properties.length === 0 || userAddresses.length === 0) {
        // Se não há endereços, apenas converter para o tipo esperado
        setEnrichedProperties(properties.map(property => ({
          ...property,
          proximityDistances: [],
          proximityBonuses: [],
          adjustedScore: property.finalScore
        })));
        return;
      }

      setIsProcessing(true);
      
      try {
        // Calcular dados de proximidade para cada propriedade
        const enriched = await Promise.all(
          properties.map(async (property) => {
            const proximityData = await ProximityCalculator.calculateProximityData(property, userAddresses);
            
            return {
              ...property,
              proximityDistances: proximityData.proximityDistances,
              proximityBonuses: proximityData.proximityBonuses,
              adjustedScore: proximityData.adjustedScore
            };
          })
        );

        // Calcular bônus de proximidade comparando todas as propriedades
        const bonusMap = await ProximityCalculator.calculateProximityBonuses(properties, userAddresses);
        
        // Aplicar bônus às propriedades
        const withBonuses = enriched.map(property => {
          const bonuses = bonusMap.get(property.id) || [];
          const bonusPoints = bonuses.length; // +1 ponto por cada endereço onde é o mais próximo
          
          return {
            ...property,
            proximityBonuses: bonuses,
            adjustedScore: property.finalScore + bonusPoints
          };
        });

        setEnrichedProperties(withBonuses);
      } catch (error) {
        console.error('Erro ao calcular proximidade:', error);
        // Em caso de erro, retornar propriedades sem dados de proximidade
        setEnrichedProperties(properties.map(property => ({
          ...property,
          proximityDistances: [],
          proximityBonuses: [],
          adjustedScore: property.finalScore
        })));
      } finally {
        setIsProcessing(false);
      }
    };

    enrichPropertiesWithProximity();
  }, [properties, userAddresses]);

  return {
    enrichedProperties,
    isProcessing
  };
};