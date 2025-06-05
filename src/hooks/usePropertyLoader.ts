
import { useState, useEffect } from 'react';
import { Property } from '@/types/property';
import { loadSavedProperties } from '@/services/propertyDatabaseService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const usePropertyLoader = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProperties = async () => {
    try {
      setIsLoading(true);
      console.log('=== INÍCIO LOAD PROPERTIES ===');
      console.log('PropertyLoader: Carregando propriedades do banco...');
      const savedProperties = await loadSavedProperties();
      console.log('PropertyLoader: Propriedades carregadas do banco:', savedProperties);
      
      const convertedProperties: Property[] = savedProperties.map(prop => {
        const converted = {
          id: prop.id,
          title: prop.title,
          address: prop.address,
          bedrooms: prop.bedrooms,
          bathrooms: prop.bathrooms,
          parkingSpaces: prop.parking_spaces,
          area: prop.area,
          floor: prop.floor || '',
          rent: prop.rent,
          condo: prop.condo,
          iptu: prop.iptu,
          fireInsurance: prop.fire_insurance,
          otherFees: prop.other_fees,
          totalMonthlyCost: prop.total_monthly_cost,
          images: prop.images || [],
          sourceUrl: prop.source_url || undefined,
          scores: {
            location: Number(prop.location_score),
            internalSpace: Number(prop.internal_space_score),
            furniture: Number(prop.furniture_score),
            accessibility: Number(prop.accessibility_score),
            finishing: Number(prop.finishing_score),
            price: Number(prop.price_score),
            condo: Number(prop.condo_score),
          },
          finalScore: Number(prop.final_score)
        };
        
        console.log(`PropertyLoader: Propriedade ${prop.id} convertida:`, {
          scores_do_banco: {
            location_score: prop.location_score,
            internal_space_score: prop.internal_space_score,
            furniture_score: prop.furniture_score,
            accessibility_score: prop.accessibility_score,
            finishing_score: prop.finishing_score,
            price_score: prop.price_score,
            condo_score: prop.condo_score,
          },
          scores_convertidos: converted.scores,
          final_score_banco: prop.final_score,
          final_score_convertido: converted.finalScore
        });
        
        return converted;
      });

      console.log('PropertyLoader: Propriedades convertidas:', convertedProperties);
      setProperties(convertedProperties);
      console.log('=== FIM LOAD PROPERTIES ===');
      
      if (convertedProperties.length > 0) {
        toast({
          title: "Propriedades carregadas",
          description: `${convertedProperties.length} propriedades carregadas do banco de dados.`,
        });
      }
    } catch (error) {
      console.error('PropertyLoader: Erro ao carregar propriedades:', error);
      toast({
        title: "Erro ao carregar propriedades",
        description: "Não foi possível carregar as propriedades salvas.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadProperties();
    }
  }, [user]);

  return {
    properties,
    setProperties,
    isLoading,
    loadProperties
  };
};
