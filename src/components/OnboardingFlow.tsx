import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OnboardingAnswers, UserProfileType, PERFIL_PESOS_SUGERIDOS, CRITERIOS_DISPONÍVEIS } from '@/types/onboarding';
import { ProfileQuestions } from './onboarding/ProfileQuestions';
import { CriteriaSelection } from './onboarding/CriteriaSelection';
import { WeightsEditor } from './onboarding/WeightsEditor';
import { ProfileSummary } from './onboarding/ProfileSummary';
import { Progress } from '@/components/ui/progress';

interface OnboardingFlowProps {
  onComplete: (profile: UserProfileType, criteria: string[], weights: Record<string, number>) => void;
  onClose: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<OnboardingAnswers | null>(null);
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);
  const [weights, setWeights] = useState<Record<string, number>>({});

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  // Função para definir perfil automaticamente
  const defineProfile = (answers: OnboardingAnswers): UserProfileType => {
    if (answers.objetivo_principal === 'investir') {
      return 'investidor';
    }
    
    if ((answers.objetivo_principal === 'morar_conforto' || answers.objetivo_principal === 'primeiro_imovel') && 
        (answers.valor_principal === 'preco' || answers.situacao_moradia === 'sozinho')) {
      return 'primeira_compra';
    }
    
    if (answers.situacao_moradia === 'sozinho' && 
        (answers.valor_principal === 'localizacao' || answers.valor_principal === 'comodidade')) {
      return 'profissional_solteiro';
    }
    
    if (answers.situacao_moradia === 'com_filhos') {
      return 'familia_com_filhos';
    }
    
    if ((answers.situacao_moradia === 'com_familiares' || answers.situacao_moradia === 'nao_sei') && 
        (answers.valor_principal === 'silencio' || answers.valor_principal === 'comodidade')) {
      return 'aposentado_tranquilo';
    }
    
    // Fallback para primeira compra
    return 'primeira_compra';
  };

  // Função para sugerir pesos baseados no perfil
  const suggestWeights = (profileType: UserProfileType, selectedCriteria: string[]): Record<string, number> => {
    const profileWeights = PERFIL_PESOS_SUGERIDOS[profileType];
    const suggested: Record<string, number> = {};
    
    // Calcula o total dos pesos sugeridos para os critérios selecionados
    let totalSuggestedWeight = 0;
    selectedCriteria.forEach(criterion => {
      if (profileWeights[criterion]) {
        totalSuggestedWeight += profileWeights[criterion];
      }
    });
    
    // Se não há pesos sugeridos suficientes, distribui igualmente
    if (totalSuggestedWeight === 0) {
      const equalWeight = Math.floor(100 / selectedCriteria.length);
      selectedCriteria.forEach(criterion => {
        suggested[criterion] = equalWeight;
      });
      return suggested;
    }
    
    // Normaliza os pesos para totalizar 100%
    selectedCriteria.forEach(criterion => {
      if (profileWeights[criterion]) {
        suggested[criterion] = Math.round((profileWeights[criterion] / totalSuggestedWeight) * 100);
      } else {
        suggested[criterion] = 5; // Peso mínimo para critérios não sugeridos
      }
    });
    
    return suggested;
  };

  const handleAnswersComplete = (newAnswers: OnboardingAnswers) => {
    const definedProfile = defineProfile(newAnswers);
    setAnswers(newAnswers);
    setProfile(definedProfile);
    setCurrentStep(2);
  };

  const handleCriteriaComplete = (criteria: string[]) => {
    if (criteria.length < 5 || criteria.length > 10) {
      return; // Validação no componente
    }
    
    setSelectedCriteria(criteria);
    if (profile) {
      const suggestedWeights = suggestWeights(profile, criteria);
      setWeights(suggestedWeights);
    }
    setCurrentStep(3);
  };

  const handleWeightsComplete = (finalWeights: Record<string, number>) => {
    setWeights(finalWeights);
    setCurrentStep(4);
  };

  const handleFinalComplete = () => {
    if (profile && selectedCriteria.length > 0) {
      onComplete(profile, selectedCriteria, weights);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <ProfileQuestions onComplete={handleAnswersComplete} />;
      case 2:
        return (
          <CriteriaSelection 
            onComplete={handleCriteriaComplete}
            onBack={() => setCurrentStep(1)}
          />
        );
      case 3:
        return (
          <WeightsEditor
            criteria={selectedCriteria}
            initialWeights={weights}
            onComplete={handleWeightsComplete}
            onBack={() => setCurrentStep(2)}
          />
        );
      case 4:
        return (
          <ProfileSummary
            profile={profile!}
            answers={answers!}
            criteria={selectedCriteria}
            weights={weights}
            onComplete={handleFinalComplete}
            onBack={() => setCurrentStep(3)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Configuração do Seu Perfil</CardTitle>
              <CardDescription>
                Personalize sua experiência de busca de imóveis
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Etapa {currentStep} de {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {renderCurrentStep()}
        </CardContent>
      </Card>
    </div>
  );
};