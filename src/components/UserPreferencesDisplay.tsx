import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, DollarSign, Target, Settings } from 'lucide-react';
import { UserProfile } from '@/types/onboarding';

interface UserPreferencesDisplayProps {
  userProfile: UserProfile;
  onEdit: () => void;
}

const getIntencaoLabel = (intencao: string) => {
  switch (intencao) {
    case 'alugar': return 'Alugar';
    case 'comprar': return 'Comprar';
    default: return intencao;
  }
};

const getObjetivoLabel = (objetivo: string | string[]) => {
  const getLabel = (obj: string) => {
    switch (obj) {
      case 'morar_conforto': return 'Morar com conforto';
      case 'investir': return 'Investir para valorizar';
      case 'alugar_depois': return 'Comprar para alugar';
      case 'primeiro_imovel': return 'Primeiro imóvel';
      case 'tranquilidade': return 'Quero mais tranquilidade';
      case 'bastante_espaco': return 'Bastante espaço';
      case 'morar_perto_trabalho': return 'Morar perto do trabalho';
      case 'ficar_perto_familia': return 'Ficar perto da família';
      default: return obj;
    }
  };
  
  if (Array.isArray(objetivo)) {
    return objetivo.map(getLabel).join(', ');
  }
  return getLabel(objetivo);
};

const getProfileTypeLabel = (profileType: string) => {
  switch (profileType) {
    case 'investidor': return 'Investidor';
    case 'primeira_compra': return 'Primeira compra';
    case 'profissional_solteiro': return 'Profissional solteiro';
    case 'familia_com_filhos': return 'Família com filhos';
    case 'aposentado_tranquilo': return 'Aposentado tranquilo';
    default: return profileType;
  }
};

const getValorPrincipalLabel = (valor: string | string[]) => {
  const getLabel = (val: string) => {
    switch (val) {
      case 'preco': return 'Preço alto';
      case 'localizacao': return 'Longe de tudo';
      case 'comodidade': return 'Falta de comodidade';
      case 'estilo': return 'Estilo / design ruim';
      case 'tamanho': return 'Pouco espaço';
      case 'silencio': return 'Muito barulho';
      case 'seguranca': return 'Região perigosa';
      default: return val;
    }
  };
  
  if (Array.isArray(valor)) {
    return valor.map(getLabel).join(', ');
  }
  return getLabel(valor);
};

const getSituacaoMoradiaLabel = (situacao: string | string[]) => {
  const getLabel = (sit: string) => {
    switch (sit) {
      case 'sozinho': return 'Sozinho';
      case 'com_parceiro': return 'Parceiro(a)';
      case 'com_filhos': return 'Filhos';
      case 'filhos_e_companheiro': return 'Filhos e companheiro(a)';
      case 'com_familiares': return 'Familiares';
      case 'amigos': return 'Amigos';
      case 'nao_sei': return 'Ainda não sei';
      default: return sit;
    }
  };
  
  if (Array.isArray(situacao)) {
    return situacao.map(getLabel).join(', ');
  }
  return getLabel(situacao);
};

export const UserPreferencesDisplay: React.FC<UserPreferencesDisplayProps> = ({
  userProfile,
  onEdit
}) => {
  return (
    <Card className="mb-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Suas Preferências
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onEdit}
            className="text-primary border-primary/30 hover:bg-primary/10"
          >
            <Settings className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">PERFIL</p>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                {getProfileTypeLabel(userProfile.profile_type)}
              </Badge>
            </div>
            
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">INTENÇÃO</p>
              <p className="text-sm font-medium">
                {getIntencaoLabel(userProfile.intencao)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">OBJETIVOS</p>
              <p className="text-sm font-medium">
                {getObjetivoLabel(userProfile.objetivo_principal_multi || userProfile.objetivo_principal)}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">SITUAÇÃO DE MORADIA</p>
              <p className="text-sm font-medium">
                {getSituacaoMoradiaLabel(userProfile.situacao_moradia_multi || userProfile.situacao_moradia)}
              </p>
            </div>
            
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">O QUE INCOMODA</p>
              <p className="text-sm font-medium">
                {getValorPrincipalLabel(userProfile.valor_principal_multi || userProfile.valor_principal)}
              </p>
            </div>
          </div>
        </div>
        
        {(userProfile.faixa_preco || userProfile.regiao_referencia) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-primary/10">
            {userProfile.faixa_preco && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">ORÇAMENTO</p>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-green-600" />
                  <span className="text-sm font-medium">
                    {userProfile.faixa_preco}
                  </span>
                </div>
              </div>
            )}
            
            {userProfile.regiao_referencia && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">REGIÃO</p>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-blue-600" />
                  <span className="text-sm font-medium">
                    {userProfile.regiao_referencia}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};