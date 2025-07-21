import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CRITERIOS_DISPONÍVEIS } from '@/types/onboarding';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CriteriaSelectionProps {
  onComplete: (selectedCriteria: string[]) => void;
  onBack: () => void;
}

export const CriteriaSelection: React.FC<CriteriaSelectionProps> = ({ onComplete, onBack }) => {
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);

  const handleCriteriaToggle = (criteriaId: string, checked: boolean) => {
    if (checked) {
      if (selectedCriteria.length < 10) {
        setSelectedCriteria(prev => [...prev, criteriaId]);
      }
    } else {
      setSelectedCriteria(prev => prev.filter(id => id !== criteriaId));
    }
  };

  const isValid = selectedCriteria.length >= 5 && selectedCriteria.length <= 10;

  const handleSubmit = () => {
    if (isValid) {
      onComplete(selectedCriteria);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Escolha seus critérios</h2>
        <p className="text-muted-foreground">
          Selecione de 5 a 10 critérios mais importantes para você
        </p>
      </div>

      <Alert>
        <AlertDescription>
          {selectedCriteria.length < 5 && (
            <span className="text-orange-600">
              Selecione pelo menos 5 critérios ({selectedCriteria.length}/5)
            </span>
          )}
          {selectedCriteria.length >= 5 && selectedCriteria.length <= 10 && (
            <span className="text-green-600">
              Ótimo! {selectedCriteria.length} critérios selecionados
            </span>
          )}
          {selectedCriteria.length === 10 && (
            <span className="text-blue-600">
              Máximo de critérios atingido (10/10)
            </span>
          )}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Critérios disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CRITERIOS_DISPONÍVEIS.map((criterio) => (
              <div key={criterio.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                <Checkbox
                  id={criterio.id}
                  checked={selectedCriteria.includes(criterio.id)}
                  onCheckedChange={(checked) => handleCriteriaToggle(criterio.id, checked as boolean)}
                  disabled={!selectedCriteria.includes(criterio.id) && selectedCriteria.length >= 10}
                />
                <label 
                  htmlFor={criterio.id} 
                  className="flex-1 text-sm font-medium cursor-pointer"
                >
                  {criterio.label}
                  {criterio.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {criterio.description}
                    </p>
                  )}
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={!isValid}
          className="px-8"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};