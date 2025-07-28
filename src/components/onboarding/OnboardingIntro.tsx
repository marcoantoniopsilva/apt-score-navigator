import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface OnboardingIntroProps {
  onContinue: () => void;
}

export const OnboardingIntro: React.FC<OnboardingIntroProps> = ({ onContinue }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-lg mx-auto"
    >
      <Card className="border-primary/20 shadow-lg">
        <CardContent className="pt-6 px-6 pb-8 flex flex-col items-center text-center">
          <div className="text-5xl mb-4">👋</div>
          <h2 className="text-2xl font-bold mb-4">Bem-vindo ao Imobly!</h2>
          <p className="text-muted-foreground mb-8">
            Em poucos passos, vamos entender o que importa para você e encontrar o imóvel ideal com base no seu perfil.
          </p>
          <Button 
            size="lg" 
            onClick={onContinue} 
            className="w-full max-w-xs"
          >
            Vamos começar!
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};