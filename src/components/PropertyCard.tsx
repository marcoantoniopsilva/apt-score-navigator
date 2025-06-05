
import React, { useState } from 'react';
import { Property, CriteriaWeights } from '@/types/property';
import { Card } from '@/components/ui/card';
import { calculateFinalScore } from '@/utils/scoreCalculator';
import { PropertyHeader } from '@/components/PropertyHeader';
import { PropertyBasicInfo } from '@/components/PropertyBasicInfo';
import { PropertyCosts } from '@/components/PropertyCosts';
import { PropertyScores } from '@/components/PropertyScores';

interface PropertyCardProps {
  property: Property;
  rank: number;
  weights: CriteriaWeights;
  onUpdate: (property: Property) => void;
  onDelete: (id: string) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  rank,
  weights,
  onUpdate,
  onDelete
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
    console.log(`PropertyCard: Alterando ${criterion} para ${value}`);
    setEditedProperty(prev => ({
      ...prev,
      scores: {
        ...prev.scores,
        [criterion]: Math.max(0, Math.min(10, value))
      }
    }));
  };

  return (
    <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
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
