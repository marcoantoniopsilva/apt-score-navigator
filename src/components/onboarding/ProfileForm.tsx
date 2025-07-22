import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { OnboardingAnswers } from '@/types/onboarding';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface ProfileFormProps {
  onComplete: (answers: OnboardingAnswers) => void;
  onBack: () => void;
}

interface Question {
  title: string;
  name: keyof OnboardingAnswers;
  options: Array<{ value: string; label: string }>;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ onComplete, onBack }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({});

  const getQuestions = (): Question[] => {
    const baseQuestions: Question[] = [
      {
        title: 'Você está interessado em alugar ou comprar?',
        name: 'intencao',
        options: [
          { value: 'alugar', label: 'Alugar um imóvel' },
          { value: 'comprar', label: 'Comprar um imóvel' }
        ]
      }
    ];

    // Pergunta sobre objetivo varia baseado na intenção
    const intencao = answers.intencao as 'alugar' | 'comprar';
    
    let objetivoOptions;
    if (intencao === 'alugar') {
      objetivoOptions = [
        { value: 'morar_conforto', label: 'Morar com conforto' },
        { value: 'tranquilidade', label: 'Quero mais tranquilidade' }
      ];
    } else {
      objetivoOptions = [
        { value: 'morar_conforto', label: 'Morar com conforto' },
        { value: 'investir', label: 'Investir para valorizar' },
        { value: 'alugar_depois', label: 'Comprar para alugar' },
        { value: 'primeiro_imovel', label: 'Primeiro imóvel' },
        { value: 'tranquilidade', label: 'Quero mais tranquilidade' }
      ];
    }

    const dynamicQuestions: Question[] = [
      {
        title: 'Qual é seu objetivo principal com o imóvel?',
        name: 'objetivo_principal',
        options: objetivoOptions
      },
      {
        title: 'Você vai morar com...',
        name: 'situacao_moradia',
        options: [
          { value: 'sozinho', label: 'Sozinho' },
          { value: 'com_parceiro', label: 'Parceiro(a)' },
          { value: 'com_filhos', label: 'Filhos' },
          { value: 'com_familiares', label: 'Familiares' },
          { value: 'nao_sei', label: 'Ainda não sei' }
        ]
      },
      {
        title: 'O que mais te incomoda em um imóvel?',
        name: 'valor_principal',
        options: [
          { value: 'silencio', label: 'Muito barulho' },
          { value: 'seguranca', label: 'Região perigosa' },
          { value: 'tamanho', label: 'Pouco espaço' },
          { value: 'localizacao', label: 'Longe de tudo' },
          { value: 'preco', label: 'Preço alto' }
        ]
      }
    ];

    return [...baseQuestions, ...dynamicQuestions];
  };

  const questions = getQuestions();

  const currentQuestion = questions[currentStep];

  const handleAnswerChange = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.name]: value as any
    }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Ensure all required fields are filled
      if (isComplete()) {
        onComplete(answers as OnboardingAnswers);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const isComplete = () => {
    return Object.keys(answers).length === questions.length;
  };

  const isCurrentQuestionAnswered = () => {
    return answers[currentQuestion.name] !== undefined;
  };

  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <motion.div
      key={currentStep}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-lg mx-auto"
    >
      <Card className="border-primary/20 shadow-lg">
        <CardContent className="pt-6 px-6 pb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold">🧠 Seu perfil de busca</h2>
            <span className="text-sm text-muted-foreground">
              {currentStep + 1}/{questions.length}
            </span>
          </div>

          <div className="w-full bg-secondary h-2 rounded-full mb-8 overflow-hidden">
            <div 
              className="bg-primary h-2 transition-all duration-300 ease-in-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <h3 className="text-xl font-medium mb-6">{currentQuestion.title}</h3>

          <RadioGroup
            value={answers[currentQuestion.name] as string}
            onValueChange={handleAnswerChange}
            className="space-y-4"
          >
            {currentQuestion.options.map((option) => (
              <div
                key={option.value}
                className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => handleAnswerChange(option.value)}
              >
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="flex justify-between mt-10">
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="flex items-center"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button 
              onClick={handleNext}
              disabled={!isCurrentQuestionAnswered()}
              className="flex items-center"
            >
              {currentStep < questions.length - 1 ? 'Próximo' : 'Continuar'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};