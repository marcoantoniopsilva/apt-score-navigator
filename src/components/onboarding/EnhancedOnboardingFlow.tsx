import React, { useState, useEffect } from 'react';
import { OnboardingIntro } from './OnboardingIntro';
import { EnhancedProfileForm } from './EnhancedProfileForm';
import { EnhancedCriteriaSelection } from './EnhancedCriteriaSelection';
import { EnhancedWeightsEditor } from './EnhancedWeightsEditor';
import { PreferencesForm } from './PreferencesForm';
import { OnboardingSuccess } from './OnboardingSuccess';
import { 
  OnboardingAnswers, 
  UserProfileType, 
  PERFIL_PESOS_SUGERIDOS 
} from '@/types/onboarding';

interface EnhancedOnboardingFlowProps {
  onComplete: (
    profile: UserProfileType, 
    answers: OnboardingAnswers,
    criteria: string[], 
    weights: Record<string, number>
  ) => void;
  onClose: () => void;
}

export enum OnboardingStep {
  INTRO,
  PROFILE,
  CRITERIA,
  WEIGHTS,
  PREFERENCES,
  SUCCESS
}

export const EnhancedOnboardingFlow: React.FC<EnhancedOnboardingFlowProps> = ({
  onComplete,
  onClose
}) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(OnboardingStep.INTRO);
  const [answers, setAnswers] = useState<OnboardingAnswers | null>(null);
  const [profileType, setProfileType] = useState<UserProfileType | null>(null);
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);
  const [weights, setWeights] = useState<Record<string, number>>({});
  
  const progress = ((currentStep + 1) / (Object.keys(OnboardingStep).length / 2)) * 100;

  // Define o perfil com base nas respostas
  const defineProfile = (answers: OnboardingAnswers): UserProfileType => {
    // Lógica para definir o perfil com base nas respostas
    console.log("Defining profile based on answers:", answers);
    
    if (answers.objetivo_principal === 'investir') {
      return 'investidor';
    } else if (answers.situacao_moradia === 'com_filhos') {
      return 'familia_com_filhos';
    } else if (answers.valor_principal === 'silencio') {
      return 'aposentado_tranquilo';
    } else if ((answers.objetivo_principal === 'morar_conforto' || answers.objetivo_principal === 'primeiro_imovel') 
              && answers.situacao_moradia === 'sozinho') {
      return 'profissional_solteiro';
    } else {
      return 'primeira_compra';
    }
  };

  // Sugere pesos com base no perfil e critérios selecionados
  const suggestWeights = (
    profileType: UserProfileType, 
    selectedCriteria: string[]
  ): Record<string, number> => {
    // Obter os pesos sugeridos para o perfil
    const profileWeights = PERFIL_PESOS_SUGERIDOS[profileType] || {};
    
    // Filtrar apenas os critérios selecionados
    const filteredWeights: Record<string, number> = {};
    
    for (const criterio of selectedCriteria) {
      filteredWeights[criterio] = profileWeights[criterio] || 10;
    }
    
    // Normalizar os pesos para somarem 100
    const total = Object.values(filteredWeights).reduce((sum, weight) => sum + weight, 0);
    
    if (total === 0) {
      // Distribuir igualmente se não houver pesos sugeridos
      const equalWeight = Math.floor(100 / selectedCriteria.length);
      
      selectedCriteria.forEach(criterio => {
        filteredWeights[criterio] = equalWeight;
      });
      
      // Distribuir o restante para o primeiro critério
      if (selectedCriteria.length > 0) {
        const remainder = 100 - (equalWeight * selectedCriteria.length);
        filteredWeights[selectedCriteria[0]] += remainder;
      }
    } else {
      // Normalizar para 100
      for (const criterio of Object.keys(filteredWeights)) {
        filteredWeights[criterio] = Math.round((filteredWeights[criterio] / total) * 100);
      }
    }
    
    return filteredWeights;
  };

  // Manipuladores para concluir cada etapa
  const handleIntroComplete = () => {
    setCurrentStep(OnboardingStep.PROFILE);
  };

  const handleAnswersComplete = (newAnswers: OnboardingAnswers) => {
    setAnswers(newAnswers);
    const newProfileType = defineProfile(newAnswers);
    setProfileType(newProfileType);
    setCurrentStep(OnboardingStep.CRITERIA);
  };

  const handleCriteriaComplete = (criteria: string[]) => {
    console.log("Selected criteria:", criteria);
    setSelectedCriteria(criteria);
    
    if (profileType) {
      const suggestedWeights = suggestWeights(profileType, criteria);
      setWeights(suggestedWeights);
      console.log("Suggested weights:", suggestedWeights);
    }
    
    setCurrentStep(OnboardingStep.WEIGHTS);
  };

  const handleWeightsComplete = (finalWeights: Record<string, number>) => {
    setWeights(finalWeights);
    setCurrentStep(OnboardingStep.PREFERENCES);
  };

  const handlePreferencesComplete = (faixaPreco: string, regiaoReferencia: string) => {
    if (answers) {
      const updatedAnswers = {
        ...answers,
        faixa_preco: faixaPreco,
        regiao_referencia: regiaoReferencia
      };
      setAnswers(updatedAnswers);
    }
    setCurrentStep(OnboardingStep.SUCCESS);
  };

  const handleFinalComplete = () => {
    console.log('EnhancedOnboardingFlow: handleFinalComplete chamada');
    console.log('EnhancedOnboardingFlow: profileType:', profileType);
    console.log('EnhancedOnboardingFlow: answers:', answers);
    console.log('EnhancedOnboardingFlow: selectedCriteria:', selectedCriteria);
    console.log('EnhancedOnboardingFlow: weights:', weights);
    
    if (profileType && answers && selectedCriteria.length > 0) {
      console.log('EnhancedOnboardingFlow: Chamando onComplete');
      onComplete(profileType, answers, selectedCriteria, weights);
    } else {
      console.error('EnhancedOnboardingFlow: Dados incompletos para finalizar onboarding');
    }
  };

  const handleBack = () => {
    if (currentStep === OnboardingStep.INTRO) {
      onClose();
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  // Renderiza a etapa atual
  const renderCurrentStep = () => {
    switch (currentStep) {
      case OnboardingStep.INTRO:
        return <OnboardingIntro onContinue={handleIntroComplete} />;
      
      case OnboardingStep.PROFILE:
        return (
          <EnhancedProfileForm 
            onComplete={handleAnswersComplete} 
            onBack={handleBack} 
          />
        );
      
      case OnboardingStep.CRITERIA:
        return (
          <EnhancedCriteriaSelection 
            onComplete={handleCriteriaComplete} 
            onBack={handleBack} 
          />
        );
      
      case OnboardingStep.WEIGHTS:
        return (
          <EnhancedWeightsEditor 
            criteria={selectedCriteria}
            initialWeights={weights}
            onComplete={handleWeightsComplete}
            onBack={handleBack}
          />
        );
      
      case OnboardingStep.PREFERENCES:
        return (
          <PreferencesForm
            intencao={answers?.intencao as 'alugar' | 'comprar'}
            onComplete={handlePreferencesComplete}
            onBack={handleBack}
          />
        );
      
      case OnboardingStep.SUCCESS:
        return (
          <OnboardingSuccess 
            onComplete={handleFinalComplete} 
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-4">
      {renderCurrentStep()}
    </div>
  );
};