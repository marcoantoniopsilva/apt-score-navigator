import React, { useState, memo, useMemo } from 'react';
import { Property, CriteriaWeights } from '@/types/property';
import { OptimizedPropertyCard } from '@/components/OptimizedPropertyCard';
import LoadingState from '@/components/LoadingState';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MapView from '@/components/MapView';
import { BarChart3, X, List, Map } from 'lucide-react';

interface OptimizedPropertyListProps {
  properties: Property[];
  weights: CriteriaWeights;
  isLoading: boolean;
  onUpdate: (property: Property) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAddProperty: () => void;
  sortBy: 'finalScore' | keyof Property['scores'];
  sortOrder: 'asc' | 'desc';
  selectedProperties?: Property[];
  onToggleSelection?: (property: Property) => void;
  isPropertySelected?: (propertyId: string) => boolean;
  selectedCount?: number;
  canCompare?: boolean;
  onCompare?: () => void;
  onClearSelection?: () => void;
  onActivateComparison?: () => void;
  onDeactivateComparison?: () => void;
  comparisonMode?: boolean;
}

/**
 * Optimized PropertyList with memoized sorting and reduced re-renders
 */
export const OptimizedPropertyList = memo<OptimizedPropertyListProps>(({
  properties,
  weights,
  isLoading,
  onUpdate,
  onDelete,
  onAddProperty,
  sortBy,
  sortOrder,
  selectedProperties = [],
  onToggleSelection,
  isPropertySelected,
  selectedCount = 0,
  canCompare = false,
  onCompare,
  onClearSelection,
  onActivateComparison,
  onDeactivateComparison,
  comparisonMode = false
}) => {
  const [activeTab, setActiveTab] = useState('list');

  // Memoized sorted properties to prevent unnecessary re-sorting
  const sortedProperties = useMemo(() => {
    return [...properties].sort((a, b) => {
      let aValue: number;
      let bValue: number;

      if (sortBy === 'finalScore') {
        aValue = a.finalScore;
        bValue = b.finalScore;
      } else {
        aValue = a.scores[sortBy];
        bValue = b.scores[sortBy];
      }

      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });
  }, [properties, sortBy, sortOrder]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (properties.length === 0) {
    return <EmptyState onAddProperty={onAddProperty} />;
  }

  return (
    <div className="space-y-6">
      {/* Comparison activation button */}
      {!comparisonMode && properties.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-gray-700" />
              <span className="font-medium text-gray-900">Modo Comparação</span>
              <span className="text-sm text-gray-600">
                Compare até 3 imóveis lado a lado
              </span>
            </div>
            <Button
              onClick={onActivateComparison}
              size="sm"
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Ativar Comparação
            </Button>
          </div>
        </div>
      )}

      {/* Active comparison bar */}
      {comparisonMode && (
        <div className="sticky top-4 z-30 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-gray-700" />
              <span className="font-medium text-gray-900">Comparar Imóveis</span>
              <Badge variant="secondary">{selectedCount}/3 selecionados</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onClearSelection?.();
                  onDeactivateComparison?.();
                }}
                className="flex items-center gap-2 text-gray-500"
              >
                <X className="h-4 w-4" />
                Sair do Modo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClearSelection}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Limpar
              </Button>
              <Button
                onClick={onCompare}
                disabled={!canCompare}
                size="sm"
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Comparar {selectedCount > 0 ? `(${selectedCount})` : ''}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs for list and map */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Map className="w-4 h-4" />
            Mapa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <div className="space-y-6">
            {sortedProperties.map((property, index) => (
              <OptimizedPropertyCard
                key={property.id}
                property={property}
                rank={index + 1}
                weights={weights}
                onUpdate={onUpdate}
                onDelete={onDelete}
                isSelected={isPropertySelected ? isPropertySelected(property.id) : false}
                onToggleSelection={onToggleSelection ? () => onToggleSelection(property) : undefined}
                showComparisonCheckbox={!!onToggleSelection}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="map" className="mt-6">
          <MapView 
            properties={sortedProperties}
            onPropertySelect={(property) => {
              setActiveTab('list');
              setTimeout(() => {
                const propertyElement = document.getElementById(`property-${property.id}`);
                propertyElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
});

OptimizedPropertyList.displayName = 'OptimizedPropertyList';