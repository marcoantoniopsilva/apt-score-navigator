import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EnhancedOnboardingFlow } from '@/components/onboarding/EnhancedOnboardingFlow';
import { ImoblyHeader } from '@/components/ImoblyHeader';
import { OnboardingAnswers, UserProfileType } from '@/types/onboarding';

const Onboarding = () => {
  const navigate = useNavigate();

  const handleOnboardingComplete = (
    profile: UserProfileType, 
    answers: OnboardingAnswers,
    criteria: string[], 
    weights: Record<string, number>
  ) => {
    console.log('Onboarding completed:', { profile, answers, criteria, weights });
    
    // Salvar dados no localStorage para usar após o cadastro
    localStorage.setItem('onboarding_data', JSON.stringify({
      profile,
      answers,
      criteria,
      weights
    }));
    
    // Redirecionar para a página de cadastro
    navigate('/auth?mode=signup');
  };

  const handleClose = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
      {/* Header com logo e título */}
      <div className="bg-blue-600 px-6 py-4 shadow-lg">
        <ImoblyHeader />
      </div>
      
      {/* Conteúdo do onboarding */}
      <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 min-h-[calc(100vh-80px)]">
        <div className="container mx-auto px-4 py-8">
          <EnhancedOnboardingFlow 
            onComplete={handleOnboardingComplete}
            onClose={handleClose}
          />
        </div>
      </div>
    </div>
  );
};

export default Onboarding;