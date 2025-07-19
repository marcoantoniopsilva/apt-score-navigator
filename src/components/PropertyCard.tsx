
import React, { useState } from 'react';
import { Property, CriteriaWeights } from '@/types/property';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { calculateFinalScore } from '@/utils/scoreCalculator';
import { PropertyHeader } from '@/components/PropertyHeader';
import { PropertyBasicInfo } from '@/components/PropertyBasicInfo';
import { PropertyCosts } from '@/components/PropertyCosts';
import { PropertyScores } from '@/components/PropertyScores';
import { PropertyImage } from '@/components/PropertyImage';
import { PropertyLocationSummary } from '@/components/PropertyLocationSummary';

interface PropertyCardProps {
  property: Property;
  rank: number;
  weights: CriteriaWeights;
  onUpdate: (property: Property) => void;
  onDelete: (id: string) => void;
  isSelected?: boolean;
  onToggleSelection?: () => void;
  showComparisonCheckbox?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
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

  console.log('PropertyCard: isEditing =', isEditing);

  const handleEditToggle = () => {
    console.log('PropertyCard: Toggling edit mode from', isEditing, 'to', !isEditing);
    if (!isEditing) {
      setEditedProperty(property);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    console.log('PropertyCard: Iniciando save das alterações');
    console.log('PropertyCard: Scores editados:', editedProperty.scores);
    
    const updatedProperty = {
      ...editedProperty,
      finalScore: calculateFinalScore(editedProperty.scores, weights)
    };
    
    console.log('PropertyCard: Propriedade com nova pontuação final:', updatedProperty);
    console.log('PropertyCard: Chamando onUpdate...');
    
    try {
      await onUpdate(updatedProperty);
      console.log('PropertyCard: onUpdate executado com sucesso');
      setIsEditing(false);
    } catch (error) {
      console.error('PropertyCard: Erro ao salvar alterações:', error);
    }
  };

  const handleCancel = () => {
    console.log('PropertyCard: Cancelando edição, resetando para:', property);
    setEditedProperty(property);
    setIsEditing(false);
  };

  const handleScoreChange = (criterion: keyof Property['scores'], value: number) => {
    console.log(`PropertyCard: Alterando ${criterion} de ${editedProperty.scores[criterion]} para ${value}`);
    
    setEditedProperty(prev => {
      const newScores = {
        ...prev.scores,
        [criterion]: value
      };
      console.log(`PropertyCard: Novos scores:`, newScores);
      return {
        ...prev,
        scores: newScores
      };
    });
  };

  const handleLocationSummaryUpdate = (propertyId: string, summary: string) => {
    const updatedProperty = {
      ...property,
      locationSummary: summary
    };
    onUpdate(updatedProperty);
  };

  return (
    <Card className={`p-4 sm:p-6 hover:shadow-lg transition-shadow relative ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      {/* Checkbox de comparação */}
      {showComparisonCheckbox && onToggleSelection && (
        <div className="absolute top-4 right-4 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelection}
            className="bg-white border-gray-300 shadow-sm"
          />
        </div>
      )}

      {/* Imagem da propriedade */}
      {property.images && property.images.length > 0 && (
        <div className="mb-4 rounded-lg overflow-hidden">
          <PropertyImage 
            property={property} 
            className="w-full h-48 sm:h-56 object-cover"
          />
        </div>
      )}

      <PropertyHeader
        property={property}
        rank={rank}
        isEditing={isEditing}
        onEditToggle={handleEditToggle}
        onDelete={onDelete}
      />

      <PropertyBasicInfo property={property} />

      <PropertyCosts property={property} />

      <PropertyScores
        property={property}
        editedProperty={editedProperty}
        weights={weights}
        isEditing={isEditing}
        onScoreChange={handleScoreChange}
        onSave={handleSave}
        onCancel={handleCancel}
      />

      <PropertyLocationSummary
        property={property}
        onSummaryUpdate={handleLocationSummaryUpdate}
      />

      {property.sourceUrl && (
        <div className="mt-4 pt-4 border-t">
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
    </Card>
  );
};
