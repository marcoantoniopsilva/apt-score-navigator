import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  BarChart3, 
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { CRITERIOS_DISPONÍVEIS } from '@/types/onboarding';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface EnhancedWeightsEditorProps {
  criteria: string[];
  initialWeights: Record<string, number>;
  onComplete: (weights: Record<string, number>) => void;
  onBack: () => void;
}

export const EnhancedWeightsEditor: React.FC<EnhancedWeightsEditorProps> = ({
  criteria,
  initialWeights,
  onComplete,
  onBack
}) => {
  const [weights, setWeights] = useState<Record<string, number>>(initialWeights || {});

  // Ensure all criteria have weights
  useEffect(() => {
    const updatedWeights = { ...weights };
    let needsUpdate = false;

    criteria.forEach(criteriaId => {
      if (updatedWeights[criteriaId] === undefined) {
        updatedWeights[criteriaId] = 10;
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      setWeights(updatedWeights);
    }
  }, [criteria]);

  const handleWeightChange = (criteriaId: string, value: number) => {
    setWeights(prev => ({
      ...prev,
      [criteriaId]: Math.round(value)
    }));
  };

  const handleSliderChange = (criteriaId: string, values: number[]) => {
    if (values.length > 0) {
      handleWeightChange(criteriaId, values[0]);
    }
  };

  const normalizeWeights = () => {
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    
    if (totalWeight === 0) return;

    const normalizedWeights: Record<string, number> = {};
    
    for (const [criteriaId, weight] of Object.entries(weights)) {
      const normalizedWeight = Math.round((weight / totalWeight) * 100);
      normalizedWeights[criteriaId] = normalizedWeight;
    }
    
    setWeights(normalizedWeights);
  };

  const distributeEqually = () => {
    const equalWeight = Math.floor(100 / criteria.length);
    const newWeights: Record<string, number> = {};
    
    criteria.forEach(criteriaId => {
      newWeights[criteriaId] = equalWeight;
    });
    
    // Distribute any remaining points to the first criteria
    const remaining = 100 - (equalWeight * criteria.length);
    if (remaining > 0 && criteria.length > 0) {
      newWeights[criteria[0]] += remaining;
    }
    
    setWeights(newWeights);
  };

  const getCriteriaLabel = (criteriaId: string): string => {
    const criterio = CRITERIOS_DISPONÍVEIS.find(c => c.id === criteriaId);
    return criterio ? criterio.label : criteriaId;
  };

  const getCriteriaIcon = (criteriaId: string): string => {
    const iconMap: Record<string, string> = {
      'localizacao': '📍',
      'tamanho': '📏',
      'preco_total': '💵',
      'acabamento': '🏗️',
      'seguranca': '🛡️',
      'proximidade_metro': '🚇',
      'proximidade_servicos': '🏫',
      'facilidade_entorno': '🛒',
      'potencial_valorizacao': '📈',
      'silencio': '🤫',
      'estilo_design': '🧑‍🎨',
      'preco_por_m2': '💰'
    };
    
    return iconMap[criteriaId] || '✓';
  };

  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);

  const handleSubmit = () => {
    onComplete(weights);
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
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">🎯 Pesos personalizados</h2>
            
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={distributeEqually}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Distribuir pesos igualmente</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={normalizeWeights}
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Normalizar para 100%</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          
          <p className="text-muted-foreground mb-6 mt-2">
            Ajuste a importância de cada critério de acordo com suas prioridades.
          </p>

          <Alert className="mb-6">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Os pesos determinam quanto cada critério influencia na pontuação final dos imóveis.
              </AlertDescription>
            </div>
          </Alert>

          <div className="space-y-6">
            {criteria.map(criteriaId => (
              <div key={criteriaId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getCriteriaIcon(criteriaId)}</span>
                    <span className="font-medium">{getCriteriaLabel(criteriaId)}</span>
                  </div>
                  <Badge variant={weights[criteriaId] > 20 ? "default" : "outline"}>
                    {weights[criteriaId] || 0}%
                  </Badge>
                </div>
                <Slider
                  value={[weights[criteriaId] || 0]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(values) => handleSliderChange(criteriaId, values)}
                  className="pt-2"
                />
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium">Total:</span>{' '}
              <Badge variant={totalWeight === 100 ? "default" : "outline"} className={totalWeight === 100 ? "bg-green-500 hover:bg-green-500/80" : ""}>
                {totalWeight}%
              </Badge>
            </div>
            
            <div className="text-sm text-muted-foreground">
              {totalWeight === 100 ? 'Soma ideal: 100%' : 'Ideal: somar 100%'}
            </div>
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