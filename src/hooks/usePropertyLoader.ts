
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Property } from '@/types/property';
import { loadSavedProperties } from '@/services/propertyDatabaseService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const usePropertyLoader = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isLoadingRef = useRef(false);
  const lastUserRef = useRef<string | null>(null);

  const loadProperties = useCallback(async () => {
    // Evitar múltiplas chamadas simultâneas
    if (isLoadingRef.current) {
      console.log('PropertyLoader: Carregamento já em andamento, ignorando...');
      return;
    }

    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      console.log('=== INÍCIO LOAD PROPERTIES ===');
      console.log('PropertyLoader: Limpando estado atual...');
      
      // Limpar estado primeiro para evitar duplicação
      setProperties([]);
      
      console.log('PropertyLoader: Carregando propriedades do banco...');
      const savedProperties = await loadSavedProperties();
      console.log('PropertyLoader: Propriedades carregadas do banco:', savedProperties);
      
      if (!savedProperties || savedProperties.length === 0) {
        console.log('PropertyLoader: Nenhuma propriedade encontrada');
        setProperties([]);
        console.log('=== FIM LOAD PROPERTIES ===');
        return;
      }
      
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
          locationSummary: prop.location_summary || undefined,
          scores: (prop.scores as any) || {
            location: 5,
            internalSpace: 5,
            furniture: 5,
            accessibility: 5,
            finishing: 5,
            price: 5,
            condo: 5,
          },
          finalScore: Number(prop.final_score)
        };
        
        return converted;
      });

      // Deduplicar por ID para evitar propriedades duplicadas
      const uniqueProperties = convertedProperties.filter((property, index, self) => 
        index === self.findIndex(p => p.id === property.id)
      );

      console.log('PropertyLoader: Propriedades convertidas:', uniqueProperties);
      console.log('PropertyLoader: Total de propriedades únicas:', uniqueProperties.length);
      
      setProperties(uniqueProperties);
      console.log('=== FIM LOAD PROPERTIES ===');
      
      if (convertedProperties.length > 0) {
        toast({
          title: "Propriedades carregadas",
          description: `${convertedProperties.length} propriedades carregadas do banco de dados.`,
        });
      }
    } catch (error) {
      console.error('PropertyLoader: Erro ao carregar propriedades:', error);
      setProperties([]); // Limpar estado em caso de erro
      toast({
        title: "Erro ao carregar propriedades",
        description: "Não foi possível carregar as propriedades salvas.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [toast]);

  useEffect(() => {
    // Verificar se o usuário mudou
    const currentUserId = user?.id || null;
    
    if (currentUserId && currentUserId !== lastUserRef.current) {
      console.log('PropertyLoader: Novo usuário detectado, carregando propriedades...');
      lastUserRef.current = currentUserId;
      
      // Limpar propriedades antes de carregar para evitar duplicação
      setProperties([]);
      
      loadProperties();
    } else if (!currentUserId && lastUserRef.current) {
      console.log('PropertyLoader: Usuário deslogado, limpando propriedades...');
      lastUserRef.current = null;
      setProperties([]);
      setIsLoading(false);
    }
  }, [user?.id, loadProperties]);

  // Escutar eventos de reconexão de sessão
  useEffect(() => {
    const handleSessionReconnect = () => {
      if (user?.id) {
        console.log('PropertyLoader: Session reconnected, reloading properties...');
        loadProperties();
      }
    };

    window.addEventListener('session-reconnected', handleSessionReconnect);
    
    return () => {
      window.removeEventListener('session-reconnected', handleSessionReconnect);
    };
  }, [user?.id, loadProperties]);

  return {
    properties,
    setProperties,
    isLoading,
    loadProperties
  };
};
