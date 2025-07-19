import { useState, useCallback } from 'react';
import { Property } from '@/types/property';
import { useToast } from '@/hooks/use-toast';

export const usePropertyComparison = () => {
  const [selectedProperties, setSelectedProperties] = useState<Property[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const { toast } = useToast();

  const togglePropertySelection = useCallback((property: Property) => {
    setSelectedProperties(prev => {
      const isSelected = prev.some(p => p.id === property.id);
      
      if (isSelected) {
        // Remove property
        return prev.filter(p => p.id !== property.id);
      } else {
        // Add property
        if (prev.length >= 3) {
          toast({
            title: "Limite atingido",
            description: "Você pode comparar no máximo 3 imóveis por vez.",
            variant: "destructive"
          });
          return prev;
        }
        return [...prev, property];
      }
    });
  }, [toast]);

  const removeProperty = useCallback((propertyId: string) => {
    setSelectedProperties(prev => prev.filter(p => p.id !== propertyId));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedProperties([]);
  }, []);

  const openComparison = useCallback(() => {
    if (selectedProperties.length < 2) {
      toast({
        title: "Seleção insuficiente",
        description: "Selecione pelo menos 2 imóveis para comparar.",
        variant: "destructive"
      });
      return;
    }
    setIsComparisonOpen(true);
  }, [selectedProperties.length, toast]);

  const closeComparison = useCallback(() => {
    setIsComparisonOpen(false);
  }, []);

  const isPropertySelected = useCallback((propertyId: string) => {
    return selectedProperties.some(p => p.id === propertyId);
  }, [selectedProperties]);

  return {
    selectedProperties,
    isComparisonOpen,
    togglePropertySelection,
    removeProperty,
    clearSelection,
    openComparison,
    closeComparison,
    isPropertySelected,
    selectedCount: selectedProperties.length,
    canCompare: selectedProperties.length >= 2,
    hasMaxSelection: selectedProperties.length >= 3
  };
};