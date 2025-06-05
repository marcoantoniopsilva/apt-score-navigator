
import React from 'react';
import { Property, CriteriaWeights, CRITERIA_LABELS } from '@/types/property';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';

interface PropertyScoresProps {
  property: Property;
  editedProperty: Property;
  weights: CriteriaWeights;
  isEditing: boolean;
  onScoreChange: (criterion: keyof Property['scores'], value: number) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const PropertyScores: React.FC<PropertyScoresProps> = ({
  property,
  editedProperty,
  weights,
  isEditing,
  onScoreChange,
  onSave,
  onCancel
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50';
    if (score >= 6) return 'text-yellow-600 bg-yellow-50';
    if (score >= 4) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div>
      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
        <Star className="h-4 w-4 mr-2" />
        Avaliação por Critérios
      </h4>
      
      {isEditing ? (
        <div className="space-y-3">
          {Object.entries(CRITERIA_LABELS).map(([key, label]) => (
            <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <Label className="text-sm font-medium w-full sm:w-32 flex-shrink-0">{label}:</Label>
              <div className="flex items-center space-x-2 flex-1">
                <Input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={editedProperty.scores[key as keyof Property['scores']]}
                  onChange={(e) => onScoreChange(
                    key as keyof Property['scores'], 
                    parseFloat(e.target.value) || 0
                  )}
                  className="w-20 text-center"
                />
                <span className="text-sm text-gray-500 flex-shrink-0">
                  (peso: {weights[key as keyof CriteriaWeights]})
                </span>
              </div>
            </div>
          ))}
          <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t">
            <Button onClick={onSave} size="sm" className="flex-1 sm:flex-none">
              Salvar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onCancel}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(CRITERIA_LABELS).map(([key, label]) => {
            const score = property.scores[key as keyof Property['scores']];
            const weight = weights[key as keyof CriteriaWeights];
            const weightedScore = score * weight;
            
            return (
              <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium truncate">{label}</span>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <Badge variant="outline" className={getScoreColor(score)}>
                    {score.toFixed(1)}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    ×{weight} = {weightedScore.toFixed(1)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
