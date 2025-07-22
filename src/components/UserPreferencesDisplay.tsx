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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              {getIntencaoLabel(userProfile.intencao)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {getObjetivoLabel(userProfile.objetivo_principal)}
            </span>
          </div>
          
          {userProfile.faixa_preco && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">
                {userProfile.faixa_preco}
              </span>
            </div>
          )}
          
          {userProfile.regiao_referencia && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">
                {userProfile.regiao_referencia}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};