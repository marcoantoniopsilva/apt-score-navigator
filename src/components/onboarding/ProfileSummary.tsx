import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OnboardingAnswers, UserProfileType, CRITERIOS_DISPONÍVEIS } from '@/types/onboarding';

interface ProfileSummaryProps {
  profile: UserProfileType;
  answers: OnboardingAnswers;
  criteria: string[];
  weights: Record<string, number>;
  onComplete: () => void;
  onBack: () => void;
}

const PROFILE_LABELS: Record<UserProfileType, string> = {
  investidor: 'Investidor',
  compra_segura: 'Compra Segura',
  profissional_solteiro: 'Profissional Solteiro',
  familia_com_filhos: 'Família com Filhos',
  aposentado_tranquilo: 'Aposentado/Tranquilo'
};

const PROFILE_DESCRIPTIONS: Record<UserProfileType, string> = {
  investidor: 'Focado em rentabilidade e potencial de valorização',
  compra_segura: 'Buscando o melhor custo-benefício para compra segura',
  profissional_solteiro: 'Priorizando localização e mobilidade urbana',
  familia_com_filhos: 'Focado em segurança, espaço e infraestrutura familiar',
  aposentado_tranquilo: 'Valorizando tranquilidade e comodidade'
};

const ANSWER_LABELS: Record<string, Record<string, string>> = {
  objetivo_principal: {
    'morar_conforto': 'Morar com conforto',
    'investir': 'Investir para valorizar',
    'alugar_depois': 'Comprar para alugar',
    'primeiro_imovel': 'Primeiro imóvel',
    'tranquilidade': 'Quero mais tranquilidade',
    'bastante_espaco': 'Bastante espaço',
    'morar_perto_trabalho': 'Morar perto do trabalho',
    'ficar_perto_familia': 'Ficar perto da família'
  },
  situacao_moradia: {
    'sozinho': 'Sozinho',
    'com_parceiro': 'Parceiro(a)',
    'com_filhos': 'Filhos',
    'filhos_e_companheiro': 'Filhos e companheiro(a)',
    'com_familiares': 'Familiares',
    'amigos': 'Amigos',
    'nao_sei': 'Ainda não sei'
  },
  valor_principal: {
    'preco': 'Preço alto',
    'localizacao': 'Longe de tudo',
    'comodidade': 'Falta de comodidade',
    'estilo': 'Estilo / design ruim',
    'tamanho': 'Pouco espaço',
    'silencio': 'Muito barulho',
    'seguranca': 'Região perigosa'
  }
};

export const ProfileSummary: React.FC<ProfileSummaryProps> = ({ 
  profile, 
  answers, 
  criteria, 
  weights, 
  onComplete, 
  onBack 
}) => {
  const getCriteriaLabel = (criteriaId: string) => {
    return CRITERIOS_DISPONÍVEIS.find(c => c.id === criteriaId)?.label || criteriaId;
  };

  const getAnswerLabels = (key: keyof OnboardingAnswers, value: string | string[]) => {
    if (Array.isArray(value)) {
      return value.map(v => ANSWER_LABELS[key]?.[v] || v).join(', ');
    }
    return ANSWER_LABELS[key]?.[value] || value;
  };

  const sortedCriteria = criteria
    .map(id => ({ id, weight: weights[id] || 0 }))
    .sort((a, b) => b.weight - a.weight);

  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Seu perfil está pronto!</h2>
        <p className="text-muted-foreground">
          Revise suas configurações antes de finalizar
        </p>
      </div>

      {/* Perfil identificado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Perfil identificado:
            <Badge variant="secondary" className="text-sm">
              {PROFILE_LABELS[profile]}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            {PROFILE_DESCRIPTIONS[profile]}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Objetivo:</span>
              <p className="text-muted-foreground">
                {getAnswerLabels('objetivo_principal', answers.objetivo_principal)}
              </p>
            </div>
            <div>
              <span className="font-medium">Situação:</span>
              <p className="text-muted-foreground">
                {getAnswerLabels('situacao_moradia', answers.situacao_moradia)}
              </p>
            </div>
            <div>
              <span className="font-medium">Mais valoriza:</span>
              <p className="text-muted-foreground">
                {getAnswerLabels('valor_principal', answers.valor_principal)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critérios e pesos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Critérios selecionados ({criteria.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedCriteria.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="min-w-8 justify-center">
                    {index + 1}º
                  </Badge>
                  <span className="font-medium">
                    {getCriteriaLabel(item.id)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {item.weight}%
                  </span>
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${(item.weight / Math.max(totalWeight, 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Próximos passos */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">O que acontece agora?</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✅ Suas preferências serão salvas no seu perfil</li>
            <li>✅ Os imóveis serão avaliados com base nos seus critérios</li>
            <li>✅ Você verá um "score personalizado" em cada resultado</li>
            <li>✅ Poderá editar essas configurações a qualquer momento</li>
          </ul>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <Button onClick={onComplete} className="px-8">
          Finalizar configuração
        </Button>
      </div>
    </div>
  );
};