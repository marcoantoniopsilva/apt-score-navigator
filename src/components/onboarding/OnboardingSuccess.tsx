import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface OnboardingSuccessProps {
  onComplete: () => void;
}

export const OnboardingSuccess: React.FC<OnboardingSuccessProps> = ({ onComplete }) => {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    if (isCompleting) {
      console.log('OnboardingSuccess: Já está processando, ignorando...');
      return; // Evita múltiplos cliques
    }
    
    console.log('OnboardingSuccess: Iniciando finalização...');
    setIsCompleting(true);
    try {
      console.log('OnboardingSuccess: Chamando onComplete...');
      await onComplete();
      console.log('OnboardingSuccess: onComplete executado com sucesso');
    } catch (error) {
      console.error('OnboardingSuccess: Erro ao executar onComplete:', error);
    } finally {
      console.log('OnboardingSuccess: Finalizando processo...');
      setIsCompleting(false);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-lg mx-auto"
    >
      <Card className="border-primary/20 shadow-lg">
        <CardContent className="pt-6 px-6 pb-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">🚀 Tudo pronto!</h2>
          <p className="text-muted-foreground mb-8">
            Agora vamos mostrar os imóveis mais compatíveis com seu perfil. Você pode ajustar 
            os critérios e pesos a qualquer momento.
          </p>
          
          <Button 
            size="lg" 
            onClick={handleComplete}
            disabled={isCompleting}
            className="w-full max-w-xs"
          >
            {isCompleting ? 'Finalizando...' : 'Começar a explorar'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};