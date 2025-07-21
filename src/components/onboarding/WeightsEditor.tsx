import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CRITERIOS_DISPONÍVEIS } from '@/types/onboarding';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WeightsEditorProps {
  criteria: string[];
  initialWeights: Record<string, number>;
  onComplete: (weights: Record<string, number>) => void;
  onBack: () => void;
}

export const WeightsEditor: React.FC<WeightsEditorProps> = ({ 
  criteria, 
  initialWeights, 
  onComplete, 
  onBack 
}) => {
  const [weights, setWeights] = useState<Record<string, number>>(initialWeights);

  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);

  const handleWeightChange = (criteriaId: string, value: number) => {
    setWeights(prev => ({
      ...prev,
      [criteriaId]: Math.max(0, Math.min(100, value))
    }));
  };

  const handleSliderChange = (criteriaId: string, values: number[]) => {
    handleWeightChange(criteriaId, values[0]);
  };

  const normalizeWeights = () => {
    const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    if (total === 0) return;
    
    const normalized: Record<string, number> = {};
    Object.entries(weights).forEach(([key, weight]) => {
      normalized[key] = Math.round((weight / total) * 100);
    });
    
    setWeights(normalized);
  };

  const distributeEqually = () => {
    const equalWeight = Math.floor(100 / criteria.length);
    const newWeights: Record<string, number> = {};
    criteria.forEach(criteriaId => {
      newWeights[criteriaId] = equalWeight;
    });
    setWeights(newWeights);
  };

  const getCriteriaLabel = (criteriaId: string) => {
    return CRITERIOS_DISPONÍVEIS.find(c => c.id === criteriaId)?.label || criteriaId;
  };

  const handleSubmit = () => {
    onComplete(weights);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Ajuste os pesos</h2>
        <p className="text-muted-foreground">
          Defina a importância de cada critério (os pesos não precisam somar 100%)
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={normalizeWeights}>
          Normalizar para 100%
        </Button>
        <Button variant="outline" size="sm" onClick={distributeEqually}>
          Distribuir igualmente
        </Button>
      </div>

      <Alert>
        <AlertDescription>
          Total atual: {totalWeight}%
          {totalWeight !== 100 && (
            <span className="ml-2 text-orange-600">
              (Será normalizado automaticamente)
            </span>
          )}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pesos dos critérios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {criteria.map((criteriaId) => (
            <div key={criteriaId} className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">
                  {getCriteriaLabel(criteriaId)}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={weights[criteriaId] || 0}
                    onChange={(e) => handleWeightChange(criteriaId, parseInt(e.target.value) || 0)}
                    className="w-16 h-8 text-center"
                    min="0"
                    max="100"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
              <Slider
                value={[weights[criteriaId] || 0]}
                onValueChange={(values) => handleSliderChange(criteriaId, values)}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground text-right">
                {Math.round(((weights[criteriaId] || 0) / Math.max(totalWeight, 1)) * 100)}% do total
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <Button 
          onClick={handleSubmit}
          className="px-8"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};