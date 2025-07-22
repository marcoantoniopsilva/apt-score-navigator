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

const getObjetivoLabel = (objetivo: string) => {
  switch (objetivo) {
    case 'morar_conforto': return 'Morar com conforto';
    case 'investir': return 'Investir para valorizar';
    case 'alugar_depois': return 'Comprar para alugar';
    case 'primeiro_imovel': return 'Primeiro imóvel';
    case 'tranquilidade': return 'Quero mais tranquilidade';
    default: return objetivo;
  }
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

const getValorPrincipalLabel = (valor: string) => {
  switch (valor) {
    case 'preco': return 'Preço';
    case 'localizacao': return 'Localização';
    case 'comodidade': return 'Comodidade';
    case 'estilo': return 'Estilo';
    case 'tamanho': return 'Tamanho';
    case 'silencio': return 'Silêncio';
    case 'seguranca': return 'Segurança';
    default: return valor;
  }
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
            <p className="text-xs font-medium text-muted-foreground mb-1">PRIORIDADE</p>
            <p className="text-sm font-medium">
              {getValorPrincipalLabel(userProfile.valor_principal)}
            </p>
          </div>
          
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
      </CardContent>
    </Card>
  );
};