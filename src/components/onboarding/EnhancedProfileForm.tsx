import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { OnboardingAnswers } from '@/types/onboarding';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface EnhancedProfileFormProps {
  onComplete: (answers: OnboardingAnswers) => void;
  onBack: () => void;
}

interface Question {
  title: string;
  name: keyof OnboardingAnswers;
  options: Array<{ value: string; label: string }>;
  multiSelect?: boolean;
  maxSelections?: number;
}

export const EnhancedProfileForm: React.FC<EnhancedProfileFormProps> = ({ onComplete, onBack }) => {
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

    // Se ainda não temos a intenção selecionada, retorna apenas a primeira pergunta
    if (!answers.intencao) {
      return baseQuestions;
    }

    // Pergunta sobre objetivo varia baseado na intenção
    const intencao = answers.intencao as 'alugar' | 'comprar';
    
    let objetivoOptions;
    if (intencao === 'alugar') {
      objetivoOptions = [
        { value: 'morar_conforto', label: 'Morar com conforto' },
        { value: 'tranquilidade', label: 'Quero mais tranquilidade' },
        { value: 'bastante_espaco', label: 'Bastante espaço' },
        { value: 'morar_perto_trabalho', label: 'Morar perto do trabalho' },
        { value: 'ficar_perto_familia', label: 'Ficar perto da família' }
      ];
    } else {
      objetivoOptions = [
        { value: 'morar_conforto', label: 'Morar com conforto' },
        { value: 'investir', label: 'Investir para valorizar' },
        { value: 'alugar_depois', label: 'Comprar para alugar' },
        { value: 'primeiro_imovel', label: 'Primeiro imóvel' },
        { value: 'tranquilidade', label: 'Quero mais tranquilidade' },
        { value: 'bastante_espaco', label: 'Bastante espaço' },
        { value: 'morar_perto_trabalho', label: 'Morar perto do trabalho' },
        { value: 'ficar_perto_familia', label: 'Ficar perto da família' }
      ];
    }

    const dynamicQuestions: Question[] = [
      {
        title: 'Qual é seu objetivo principal com o imóvel? (escolha até 2)',
        name: 'objetivo_principal',
        options: objetivoOptions,
        multiSelect: true,
        maxSelections: 2
      },
      {
        title: 'Você vai morar com... (escolha até 2)',
        name: 'situacao_moradia',
        options: [
          { value: 'sozinho', label: 'Sozinho' },
          { value: 'com_parceiro', label: 'Parceiro(a)' },
          { value: 'com_filhos', label: 'Filhos' },
          { value: 'filhos_e_companheiro', label: 'Filhos e companheiro(a)' },
          { value: 'com_familiares', label: 'Familiares' },
          { value: 'amigos', label: 'Amigos' },
          { value: 'nao_sei', label: 'Ainda não sei' }
        ],
        multiSelect: true,
        maxSelections: 2
      },
      {
        title: 'O que mais te incomoda em um imóvel? (escolha quantas quiser)',
        name: 'valor_principal',
        options: [
          { value: 'silencio', label: 'Muito barulho' },
          { value: 'seguranca', label: 'Região perigosa' },
          { value: 'tamanho', label: 'Pouco espaço' },
          { value: 'localizacao', label: 'Longe de tudo' },
          { value: 'preco', label: 'Preço alto' },
          { value: 'comodidade', label: 'Falta de comodidade' },
          { value: 'estilo', label: 'Estilo / design ruim' }
        ],
        multiSelect: true
      }
    ];

    return [...baseQuestions, ...dynamicQuestions];
  };

  const questions = getQuestions();
  const currentQuestion = questions[currentStep];

  const handleSingleAnswerChange = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.name]: value
    }));
  };

  const handleMultiAnswerChange = (value: string, checked: boolean) => {
    setAnswers(prev => {
      const currentValues = (prev[currentQuestion.name] as string[]) || [];
      const alreadySelected = currentValues.includes(value);
      let newValues = currentValues;
      
      if (checked) {
        // Evita duplicidade ao tocar no container e no checkbox
        if (alreadySelected) {
          return prev; // não altera se já estava selecionado
        }
        // Adiciona respeitando o limite
        if (!currentQuestion.maxSelections || currentValues.length < currentQuestion.maxSelections) {
          newValues = [...currentValues, value];
        } else {
          return prev; // não adiciona se exceder o limite
        }
      } else {
        // Remover valor
        newValues = currentValues.filter(v => v !== value);
      }
      
      // Garantir unicidade por segurança
      newValues = Array.from(new Set(newValues));
      
      return {
        ...prev,
        [currentQuestion.name]: newValues
      };
    });
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
    const allQuestions = getQuestions();
    const requiredFields = ['intencao', 'objetivo_principal', 'situacao_moradia', 'valor_principal'];
    return requiredFields.every(field => {
      const value = answers[field as keyof OnboardingAnswers];
      return value !== undefined && (
        typeof value === 'string' ? value.length > 0 : 
        Array.isArray(value) ? value.length > 0 : 
        false
      );
    });
  };

  const isCurrentQuestionAnswered = () => {
    const value = answers[currentQuestion.name];
    if (currentQuestion.multiSelect) {
      return Array.isArray(value) && value.length > 0;
    }
    return value !== undefined;
  };

  const getCurrentSelectionCount = () => {
    const value = answers[currentQuestion.name];
    return Array.isArray(value) ? value.length : 0;
  };

  const isMaxSelectionsReached = () => {
    if (!currentQuestion.multiSelect || !currentQuestion.maxSelections) return false;
    return getCurrentSelectionCount() >= currentQuestion.maxSelections;
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

          {currentQuestion.multiSelect ? (
            <div className="space-y-4">
              {currentQuestion.maxSelections && (
                <p className="text-sm text-muted-foreground mb-4">
                  Selecionados: {getCurrentSelectionCount()}/{currentQuestion.maxSelections}
                </p>
              )}
              {currentQuestion.options.map((option) => {
                const currentValues = (answers[currentQuestion.name] as string[]) || [];
                const isChecked = currentValues.includes(option.value);
                const isDisabled = !isChecked && isMaxSelectionsReached();
                
                return (
                  <div
                    key={option.value}
                    className={`flex items-center space-x-3 rounded-lg border p-4 transition-colors ${
                      isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent/50 cursor-pointer'
                    }`}
                    onClick={() => !isDisabled && handleMultiAnswerChange(option.value, !isChecked)}
                  >
                    <Checkbox 
                      checked={isChecked}
                      disabled={isDisabled}
                      onCheckedChange={(checked) => !isDisabled && handleMultiAnswerChange(option.value, checked as boolean)}
                    />
                    <Label className={`flex-1 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                      {option.label}
                    </Label>
                  </div>
                );
              })}
            </div>
          ) : (
            <RadioGroup
              value={answers[currentQuestion.name] as string}
              onValueChange={handleSingleAnswerChange}
              className="space-y-4"
            >
              {currentQuestion.options.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => handleSingleAnswerChange(option.value)}
                >
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

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