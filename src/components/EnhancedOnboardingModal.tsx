import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { EnhancedOnboardingFlow } from './onboarding/EnhancedOnboardingFlow';
import { useOnboarding } from '@/hooks/useOnboarding';
import { supabase } from '@/integrations/supabase/client';
import { 
  OnboardingAnswers,
  UserProfileType
} from '@/types/onboarding';

interface EnhancedOnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EnhancedOnboardingModal: React.FC<EnhancedOnboardingModalProps> = ({
  open,
  onOpenChange
}) => {
  const { saveEnhancedOnboardingData } = useOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOnboardingComplete = async (
    profile: UserProfileType,
    answers: OnboardingAnswers,
    criteria: string[],
    weights: Record<string, number>
  ) => {
    console.log('EnhancedOnboardingModal: handleOnboardingComplete chamada');
    console.log('EnhancedOnboardingModal: profile:', profile);
    console.log('EnhancedOnboardingModal: answers:', answers);
    console.log('EnhancedOnboardingModal: criteria:', criteria);
    console.log('EnhancedOnboardingModal: weights:', weights);
    
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('EnhancedOnboardingModal: Salvando dados do onboarding...');
        const result = await saveEnhancedOnboardingData(
          session.user.id,
          profile,
          answers,
          criteria,
          weights
        );
        
        console.log('EnhancedOnboardingModal: Resultado do salvamento:', result);
        
        if (result.success) {
          console.log('EnhancedOnboardingModal: Fechando modal...');
          onOpenChange(false);
        } else {
          console.error('EnhancedOnboardingModal: Erro ao salvar dados:', result.error);
        }
      } else {
        console.error('EnhancedOnboardingModal: Usuário não autenticado');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 h-[90vh] overflow-y-auto bg-background">
        <VisuallyHidden>
          <DialogTitle>Configuração do Perfil de Usuário</DialogTitle>
        </VisuallyHidden>
        <EnhancedOnboardingFlow
          onComplete={handleOnboardingComplete}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};