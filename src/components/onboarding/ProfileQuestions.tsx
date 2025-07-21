import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { OnboardingAnswers } from '@/types/onboarding';

interface ProfileQuestionsProps {
  onComplete: (answers: OnboardingAnswers) => void;
}

export const ProfileQuestions: React.FC<ProfileQuestionsProps> = ({ onComplete }) => {
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({});

  const handleAnswerChange = (question: keyof OnboardingAnswers, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [question]: value
    }));
  };

  const isComplete = () => {
    return answers.objetivo_principal && answers.situacao_moradia && answers.valor_principal;
  };

  const handleSubmit = () => {
    if (isComplete()) {
      onComplete(answers as OnboardingAnswers);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Vamos conhecer você melhor</h2>
        <p className="text-muted-foreground">
          Responda algumas perguntas para personalizarmos sua experiência
        </p>
      </div>

      {/* Pergunta 1 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Qual seu objetivo principal com o imóvel?</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers.objetivo_principal || ''}
            onValueChange={(value) => handleAnswerChange('objetivo_principal', value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="morar" id="morar" />
              <Label htmlFor="morar" className="font-normal cursor-pointer">
                Morar - Este será meu lar
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="investir" id="investir" />
              <Label htmlFor="investir" className="font-normal cursor-pointer">
                Investir - Busco rentabilidade financeira
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="alugar_depois" id="alugar_depois" />
              <Label htmlFor="alugar_depois" className="font-normal cursor-pointer">
                Alugar depois - Pretendo alugar futuramente
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Pergunta 2 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quem vai morar com você?</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers.situacao_moradia || ''}
            onValueChange={(value) => handleAnswerChange('situacao_moradia', value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sozinho" id="sozinho" />
              <Label htmlFor="sozinho" className="font-normal cursor-pointer">
                Sozinho(a)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="com_parceiro" id="com_parceiro" />
              <Label htmlFor="com_parceiro" className="font-normal cursor-pointer">
                Com parceiro(a)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="com_filhos" id="com_filhos" />
              <Label htmlFor="com_filhos" className="font-normal cursor-pointer">
                Com filhos
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="outro" id="outro" />
              <Label htmlFor="outro" className="font-normal cursor-pointer">
                Outro (família, amigos, etc.)
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Pergunta 3 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">O que você mais valoriza em um imóvel?</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers.valor_principal || ''}
            onValueChange={(value) => handleAnswerChange('valor_principal', value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="preco" id="preco" />
              <Label htmlFor="preco" className="font-normal cursor-pointer">
                Preço - O mais importante é economizar
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="localizacao" id="localizacao" />
              <Label htmlFor="localizacao" className="font-normal cursor-pointer">
                Localização - Preciso estar bem localizado
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="comodidade" id="comodidade" />
              <Label htmlFor="comodidade" className="font-normal cursor-pointer">
                Comodidade - Facilidade e praticidade
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="estilo" id="estilo" />
              <Label htmlFor="estilo" className="font-normal cursor-pointer">
                Estilo / design - Importo com a estética
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="tamanho" id="tamanho" />
              <Label htmlFor="tamanho" className="font-normal cursor-pointer">
                Tamanho - Preciso de espaço
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="silencio" id="silencio" />
              <Label htmlFor="silencio" className="font-normal cursor-pointer">
                Silêncio / vizinhança tranquila
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleSubmit}
          disabled={!isComplete()}
          className="px-8"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};