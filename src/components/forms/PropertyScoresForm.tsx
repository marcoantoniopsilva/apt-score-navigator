
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActiveCriterion } from '@/hooks/useCriteria';

interface PropertyScoresFormProps {
  scores: Record<string, number>;
  onScoreChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  activeCriteria: ActiveCriterion[];
  suggestedScores: Record<string, number>;
  getCriteriaLabel: (criteriaKey: string) => string;
}

export const PropertyScoresForm: React.FC<PropertyScoresFormProps> = ({
  scores,
  onScoreChange,
  activeCriteria,
  suggestedScores,
  getCriteriaLabel
}) => {
  if (activeCriteria.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-4">Avaliação por Critérios (0-10)</h3>
        <p className="text-muted-foreground">Carregando critérios baseados no seu perfil...</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">
        Avaliação por Critérios (0-10)
        <span className="block text-sm font-normal text-muted-foreground mt-1">
          Baseado no seu perfil. Sugestões da IA já foram aplicadas automaticamente.
        </span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeCriteria.map((criterio) => {
          const currentScore = scores[criterio.key] || 5;
          const suggestedScore = suggestedScores[criterio.key];
          const hasSuggestion = suggestedScore !== undefined && suggestedScore > 0;
          
          return (
            <Card key={criterio.key} className={`p-4 ${hasSuggestion ? 'border-blue-200 bg-blue-50/30' : ''}`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={criterio.key} className="text-sm font-medium">
                    {getCriteriaLabel(criterio.key)}
                  </Label>
                  <Badge variant="secondary" className="text-xs">
                    Peso: {criterio.weight}
                  </Badge>
                </div>
                
                {hasSuggestion && (
                  <div className="flex items-center justify-between text-xs text-blue-600 mb-2">
                    <span>Sugestão da IA:</span>
                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                      {suggestedScore.toFixed(1)}
                    </Badge>
                  </div>
                )}
                
                <Input
                  id={criterio.key}
                  name={criterio.key}
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={currentScore}
                  onChange={onScoreChange}
                  className={hasSuggestion ? 'border-blue-200 focus:border-blue-400' : ''}
                  required
                />
                
                {hasSuggestion && (
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                    onClick={() => {
                      const event = {
                        target: {
                          name: criterio.key,
                          value: suggestedScore.toString()
                        }
                      } as React.ChangeEvent<HTMLInputElement>;
                      onScoreChange(event);
                    }}
                  >
                    Usar sugestão
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      
      {Object.keys(suggestedScores).length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 Dica:</strong> As sugestões da IA foram aplicadas automaticamente com base na análise do anúncio e no seu perfil. 
            Você pode ajustar as notas manualmente conforme seu gosto.
          </p>
        </div>
      )}
    </div>
  );
};
