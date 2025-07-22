import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { CriterioOnboarding } from '@/types/onboarding';

interface EnhancedCriteriaSelectionProps {
  onComplete: (selectedCriteria: string[]) => void;
  onBack: () => void;
}

interface CriteriaOption {
  id: string;
  label: string;
  icon: string;
}

export const EnhancedCriteriaSelection: React.FC<EnhancedCriteriaSelectionProps> = ({ 
  onComplete, 
  onBack 
}) => {
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);

  const criteriaOptions: CriteriaOption[] = [
    { id: 'localizacao', label: 'Boa localização', icon: '📍' },
    { id: 'tamanho', label: 'Tamanho do imóvel', icon: '📏' },
    { id: 'preco_total', label: 'Preço total (aluguel + taxas)', icon: '💵' },
    { id: 'acabamento', label: 'Acabamento e estado de conservação', icon: '🏗️' },
    { id: 'seguranca', label: 'Região segura', icon: '🛡️' },
    { id: 'proximidade_metro', label: 'Perto do metrô/transporte', icon: '🚇' },
    { id: 'proximidade_servicos', label: 'Próximo a escolas/hospitais', icon: '🏫' },
    { id: 'facilidade_entorno', label: 'Comércios por perto', icon: '🛒' },
    { id: 'potencial_valorizacao', label: 'Potencial de valorização', icon: '📈' },
    { id: 'silencio', label: 'Silêncio e tranquilidade', icon: '🤫' },
    { id: 'estilo_design', label: 'Estilo e design', icon: '🧑‍🎨' },
  ];

  const handleCriteriaToggle = (criteriaId: string, checked: boolean) => {
    if (checked) {
      if (selectedCriteria.length < 10) {
        setSelectedCriteria([...selectedCriteria, criteriaId]);
      }
    } else {
      setSelectedCriteria(selectedCriteria.filter(id => id !== criteriaId));
    }
  };

  const isValid = selectedCriteria.length >= 5 && selectedCriteria.length <= 10;

  const handleSubmit = () => {
    if (isValid) {
      console.log("Submitting selected criteria:", selectedCriteria);
      onComplete(selectedCriteria);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-lg mx-auto"
    >
      <Card className="border-primary/20 shadow-lg">
        <CardContent className="pt-6 px-6 pb-8">
          <h2 className="text-2xl font-bold mb-2">✅ O que importa para você?</h2>
          <p className="text-muted-foreground mb-4">
            Escolha de 5 a 10 critérios que mais influenciam sua decisão.
          </p>

          <Alert 
            variant={isValid ? "default" : (selectedCriteria.length < 5 ? "destructive" : "destructive")}
            className="mb-6"
          >
            <div className="flex items-center gap-2">
              {isValid ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {isValid 
                  ? `Seleção válida: ${selectedCriteria.length} critérios escolhidos.` 
                  : selectedCriteria.length < 5 
                    ? `Selecione pelo menos 5 critérios (${selectedCriteria.length}/5).` 
                    : `Máximo de 10 critérios permitidos (${selectedCriteria.length}/10).`
                }
              </AlertDescription>
            </div>
          </Alert>

          <div className="grid grid-cols-1 gap-3">
            {criteriaOptions.map((criteria) => (
              <div
                key={criteria.id}
                className={`flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors ${
                  selectedCriteria.includes(criteria.id) ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <div className="text-xl mr-1">{criteria.icon}</div>
                <Checkbox
                  id={criteria.id}
                  checked={selectedCriteria.includes(criteria.id)}
                  onCheckedChange={(checked) => handleCriteriaToggle(criteria.id, checked === true)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <Label 
                  htmlFor={criteria.id} 
                  className="flex-1 cursor-pointer font-medium"
                >
                  {criteria.label}
                </Label>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-8">
            <Button 
              variant="outline" 
              onClick={onBack}
              className="flex items-center"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!isValid}
              className="flex items-center"
            >
              Continuar
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};