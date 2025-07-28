import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Property } from '@/types/property';
import { loadSavedProperties } from '@/services/propertyDatabaseService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTabVisibility } from '@/hooks/useTabVisibility';

/**
 * Optimized property loader using React Query
 * Eliminates session callbacks and tab focus complications
 */
export const useOptimizedProperties = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { onTabReactivated } = useTabVisibility();

  const { data: properties = [], isLoading, error, refetch } = useQuery({
    queryKey: ['properties', user?.id],
    queryFn: async (): Promise<Property[]> => {
      if (!user?.id) {
        return [];
      }

      console.log('useOptimizedProperties: Loading properties for user', user.id);
      
      const savedProperties = await loadSavedProperties();
      if (!savedProperties || savedProperties.length === 0) {
        return [];
      }
      
      const convertedProperties: Property[] = savedProperties.map(prop => ({
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
      }));

      // Deduplicate
      const uniqueProperties = convertedProperties.filter((property, index, self) => 
        index === self.findIndex(p => p.id === property.id)
      );

      console.log('useOptimizedProperties: Loaded', uniqueProperties.length, 'unique properties');
      
      if (uniqueProperties.length > 0) {
        toast({
          title: "Propriedades carregadas",
          description: `${uniqueProperties.length} propriedades carregadas.`,
        });
      }

      return uniqueProperties;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos - evitar refetch excessivo
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false, // Não refazer ao focar janela
    refetchOnReconnect: false,   // Não refazer ao reconectar
    retry: (failureCount, error) => {
      console.log(`useOptimizedProperties: Retry ${failureCount} para propriedades`);
      return failureCount < 3;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Handle errors with useEffect instead of onError callback
  useEffect(() => {
    if (error) {
      console.error('useOptimizedProperties: Error loading properties:', error);
      toast({
        title: "Erro ao carregar propriedades",
        description: "Não foi possível carregar as propriedades salvas. Tentando novamente...",
        variant: "destructive"
      });
      
      // Fallback automático: tentar refetch após erro
      setTimeout(() => {
        console.log('useOptimizedProperties: Tentando refetch automático após erro...');
        refetch();
      }, 3000);
    }
  }, [error, toast, refetch]);

  // Reagir à reativação da aba
  useEffect(() => {
    const cleanup = onTabReactivated(() => {
      console.log('useOptimizedProperties: Aba reativada - refazendo query de propriedades');
      refetch();
    });

    return cleanup;
  }, [onTabReactivated, refetch]);

  // Real-time updates
  useEffect(() => {
    if (!user?.id) return;

    console.log('useOptimizedProperties: Setting up real-time updates for user', user.id);

    const channel = supabase
      .channel('properties-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'properties',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('useOptimizedProperties: Real-time update received:', payload);
          
          if (payload.eventType === 'INSERT') {
            console.log('useOptimizedProperties: New property inserted, refreshing...');
            refetch();
          } else if (payload.eventType === 'UPDATE') {
            console.log('useOptimizedProperties: Property updated, refreshing...');
            refetch();
          } else if (payload.eventType === 'DELETE') {
            console.log('useOptimizedProperties: Property deleted, refreshing...');
            refetch();
          }
        }
      )
      .subscribe();

    return () => {
      console.log('useOptimizedProperties: Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };

  }, [user?.id, refetch]);

  // Manual refresh function
  const refreshProperties = () => {
    console.log('useOptimizedProperties: Manual refresh triggered');
    refetch();
  };

  // Update properties cache after modifications
  const updateProperty = (updatedProperty: Property) => {
    queryClient.setQueryData(['properties', user?.id], (oldData: Property[] | undefined) => {
      if (!oldData) return [updatedProperty];
      return oldData.map(p => p.id === updatedProperty.id ? updatedProperty : p);
    });
  };

  // Remove property from cache
  const removeProperty = (propertyId: string) => {
    queryClient.setQueryData(['properties', user?.id], (oldData: Property[] | undefined) => {
      if (!oldData) return [];
      return oldData.filter(p => p.id !== propertyId);
    });
  };

  return {
    properties,
    isLoading,
    error,
    refreshProperties,
    updateProperty,
    removeProperty
  };
};