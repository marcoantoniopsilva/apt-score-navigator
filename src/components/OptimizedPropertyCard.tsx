import React, { useState, memo, useCallback } from 'react';
import { Property, CriteriaWeights } from '@/types/property';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { calculateFinalScore } from '@/utils/scoreCalculator';
import { PropertyHeader } from '@/components/PropertyHeader';
import { PropertyBasicInfo } from '@/components/PropertyBasicInfo';
import { PropertyCosts } from '@/components/PropertyCosts';
import { PropertyScores } from '@/components/PropertyScores';
import { PropertyImage } from '@/components/PropertyImage';
import { PropertyLocationSummary } from '@/components/PropertyLocationSummary';

interface OptimizedPropertyCardProps {
  property: Property;
  rank: number;
  weights: CriteriaWeights;
  onUpdate: (property: Property) => void;
  onDelete: (id: string) => void;
  isSelected?: boolean;
  onToggleSelection?: () => void;
  showComparisonCheckbox?: boolean;
}

/**
 * Optimized PropertyCard with React.memo and minimal re-renders
 */
export const OptimizedPropertyCard = memo<OptimizedPropertyCardProps>(({
  property,
  rank,
  weights,
  onUpdate,
  onDelete,
  isSelected = false,
  onToggleSelection,
  showComparisonCheckbox = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProperty, setEditedProperty] = useState(property);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleEditToggle = useCallback(() => {
    if (!isEditing) {
      setEditedProperty(property);
    }
    setIsEditing(!isEditing);
  }, [isEditing, property]);

  const handleSave = useCallback(async () => {
    const updatedProperty = {
      ...editedProperty,
      finalScore: calculateFinalScore(editedProperty.scores, weights)
    };
    
    try {
      await onUpdate(updatedProperty);
      setIsEditing(false);
    } catch (error) {
      console.error('OptimizedPropertyCard: Error saving changes:', error);
    }
  }, [editedProperty, weights, onUpdate]);

  const handleCancel = useCallback(() => {
    setEditedProperty(property);
    setIsEditing(false);
  }, [property]);

  const handleScoreChange = useCallback((criterion: keyof Property['scores'], value: number) => {
    setEditedProperty(prev => ({
      ...prev,
      scores: {
        ...prev.scores,
        [criterion]: value
      }
    }));
  }, []);

  const handleLocationSummaryUpdate = useCallback((propertyId: string, summary: string) => {
    const updatedProperty = {
      ...property,
      locationSummary: summary
    };
    onUpdate(updatedProperty);
  }, [property, onUpdate]);

  return (
    <Card 
      id={`property-${property.id}`} 
      className={`p-4 sm:p-6 hover:shadow-lg transition-shadow relative ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      }`}
    >
      {/* Checkbox de comparação */}
      {showComparisonCheckbox && onToggleSelection && (
        <div className="absolute top-2 right-2 z-20 bg-white rounded-full p-1 shadow-lg border">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelection}
            className="bg-white border-gray-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
        </div>
      )}

      {/* Imagem da propriedade */}
      {property.images?.length > 0 && (
        <div className="mb-4 rounded-lg overflow-hidden">
          <PropertyImage 
            property={property} 
            className={`w-full object-cover transition-all duration-300 ${
              isExpanded ? 'h-48 sm:h-56' : 'h-32 sm:h-40'
            }`}
          />
        </div>
      )}

      {/* Header */}
      <PropertyHeader
        property={property}
        rank={rank}
        isEditing={isEditing}
        onEditToggle={handleEditToggle}
        onDelete={onDelete}
      />

      {/* Informações básicas */}
      <PropertyBasicInfo property={property} />

      {/* Custo total resumido */}
      <div className="mb-4 p-3 bg-muted rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Custo Total</span>
          <span className="text-lg font-semibold text-primary">
            R$ {property.totalMonthlyCost.toLocaleString('pt-BR')}
          </span>
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          Pontuação: {property.finalScore.toFixed(1)}/10
        </div>
      </div>

      {/* Botão de expandir/colapsar */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full mb-4 flex items-center justify-center gap-2 hover:bg-muted"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Mostrar menos detalhes
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Mostrar mais detalhes
              </>
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-4">
          {/* Detalhes dos custos */}
          <PropertyCosts property={property} />

          {/* Pontuações detalhadas */}
          <PropertyScores
            property={property}
            editedProperty={editedProperty}
            weights={weights}
            isEditing={isEditing}
            onScoreChange={handleScoreChange}
            onSave={handleSave}
            onCancel={handleCancel}
          />

          {/* Resumo da localização */}
          <PropertyLocationSummary
            property={property}
            onSummaryUpdate={handleLocationSummaryUpdate}
          />

          {/* Link do anúncio original */}
          {property.sourceUrl && (
            <div className="pt-4 border-t">
              <a 
                href={property.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 text-sm underline break-all"
              >
                Ver anúncio original →
              </a>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
});

OptimizedPropertyCard.displayName = 'OptimizedPropertyCard';