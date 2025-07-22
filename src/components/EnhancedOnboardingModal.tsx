import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const result = await saveEnhancedOnboardingData(
          session.user.id,
          profile,
          answers,
          criteria,
          weights
        );
        
        if (result.success) {
          onOpenChange(false);
        }
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
        <EnhancedOnboardingFlow
          onComplete={handleOnboardingComplete}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};