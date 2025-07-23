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
    console.log('=== INÍCIO FINALIZAÇÃO ONBOARDING ===');
    console.log('EnhancedOnboardingModal: handleOnboardingComplete chamada');
    console.log('EnhancedOnboardingModal: profile:', profile);
    console.log('EnhancedOnboardingModal: answers:', answers);
    console.log('EnhancedOnboardingModal: criteria:', criteria);
    console.log('EnhancedOnboardingModal: weights:', weights);
    
    if (isSubmitting) {
      console.log('EnhancedOnboardingModal: Já está enviando, ignorando...');
      return;
    }
    
    setIsSubmitting(true);
    try {
      console.log('EnhancedOnboardingModal: Verificando sessão...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('EnhancedOnboardingModal: Erro na sessão:', sessionError);
        throw new Error(`Erro de sessão: ${sessionError.message}`);
      }
      
      if (session?.user) {
        console.log('EnhancedOnboardingModal: Sessão válida, usuário:', session.user.id);
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
          console.log('EnhancedOnboardingModal: Dados salvos com sucesso, fechando modal...');
          onOpenChange(false);
          console.log('EnhancedOnboardingModal: Modal fechado');
        } else {
          console.error('EnhancedOnboardingModal: Erro ao salvar dados:', result.error);
          throw new Error(result.error || 'Erro ao salvar dados do onboarding');
        }
      } else {
        console.error('EnhancedOnboardingModal: Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }
    } catch (error) {
      console.error('EnhancedOnboardingModal: Erro completo:', error);
      // Não fechar o modal em caso de erro, para o usuário tentar novamente
    } finally {
      console.log('EnhancedOnboardingModal: Finalizando processo...');
      setIsSubmitting(false);
      console.log('=== FIM FINALIZAÇÃO ONBOARDING ===');
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