
import React from 'react';
import { CriteriaWeights } from '@/types/property';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings, RotateCcw } from 'lucide-react';
import { ActiveCriterion } from '@/hooks/useCriteria';

interface CriteriaWeightsEditorProps {
  weights: CriteriaWeights;
  onWeightsChange: (weights: CriteriaWeights) => void;
  activeCriteria: ActiveCriterion[];
  onReset?: () => void;
}

export const CriteriaWeightsEditor: React.FC<CriteriaWeightsEditorProps> = ({
  weights,
  onWeightsChange,
  activeCriteria,
  onReset
}) => {
  const handleWeightChange = (criterion: string, value: number) => {
    onWeightsChange({
      ...weights,
      [criterion]: Math.max(1, Math.min(5, value))
    });
  };

  const resetToDefaults = () => {
    if (onReset) {
      onReset();
    } else {
      // Fallback para critérios padrão
      onWeightsChange({
        location: 3,
        internalSpace: 3,
        furniture: 3,
        accessibility: 2,
        finishing: 2,
        price: 3,
        condo: 2,
      });
    }
  };

  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);

  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
        <h3 className="text-lg font-semibold flex items-center">
          <Settings className="h-5 w-5 mr-2 flex-shrink-0" />
          <span className="truncate">Pesos dos Critérios</span>
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={resetToDefaults}
          className="flex-shrink-0"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Padrão
        </Button>
      </div>

      <div className="space-y-3">
        {activeCriteria.map((criterion) => (
          <div key={criterion.key} className="flex items-center justify-between gap-2">
            <Label className="text-sm font-medium flex-1 min-w-0 truncate">{criterion.label}</Label>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Input
                type="number"
                min="1"
                max="5"
                value={weights[criterion.key] || 1}
                onChange={(e) => handleWeightChange(
                  criterion.key,
                  parseInt(e.target.value) || 1
                )}
                className="w-14 sm:w-16 text-center"
              />
              <span className="text-xs text-gray-500 w-10 sm:w-12 text-right">
                {totalWeight > 0 ? (((weights[criterion.key] || 1) / totalWeight) * 100).toFixed(0) : 0}%
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
        <p className="text-xs text-gray-600 mt-1 break-words">
          Pesos maiores dão mais importância ao critério no ranking final.
        </p>
      </div>
    </Card>
  );
};
