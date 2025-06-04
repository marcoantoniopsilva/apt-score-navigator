
import React from 'react';
import { CriteriaWeights, CRITERIA_LABELS } from '@/types/property';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings, RotateCcw } from 'lucide-react';

interface CriteriaWeightsEditorProps {
  weights: CriteriaWeights;
  onWeightsChange: (weights: CriteriaWeights) => void;
}

export const CriteriaWeightsEditor: React.FC<CriteriaWeightsEditorProps> = ({
  weights,
  onWeightsChange
}) => {
  const handleWeightChange = (criterion: keyof CriteriaWeights, value: number) => {
    onWeightsChange({
      ...weights,
      [criterion]: Math.max(1, Math.min(5, value))
    });
  };

  const resetToDefaults = () => {
    onWeightsChange({
      location: 3,
      internalSpace: 3,
      furniture: 3,
      accessibility: 2,
      finishing: 2,
      price: 3,
    });
  };

  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Pesos dos Critérios
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={resetToDefaults}
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Padrão
        </Button>
      </div>

      <div className="space-y-3">
        {Object.entries(CRITERIA_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center justify-between">
            <Label className="text-sm font-medium">{label}</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                min="1"
                max="5"
                value={weights[key as keyof CriteriaWeights]}
                onChange={(e) => handleWeightChange(
                  key as keyof CriteriaWeights,
                  parseInt(e.target.value) || 1
                )}
                className="w-16 text-center"
              />
              <span className="text-xs text-gray-500 w-12">
                {((weights[key as keyof CriteriaWeights] / totalWeight) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Peso Total:</span>
          <span className="font-bold">{totalWeight}</span>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Pesos maiores dão mais importância ao critério no ranking final.
        </p>
      </div>
    </Card>
  );
};
