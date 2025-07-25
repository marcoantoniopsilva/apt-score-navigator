import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Search, Globe, Plus, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserProfileService } from '@/services/userProfileService';
import { extractPropertyFromUrl } from '@/services/propertyExtractionService';
import { useAuth } from '@/contexts/AuthContext';
import LoadingState from '@/components/LoadingState';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ManualPropertySearchProps {
  onAddProperty?: (propertyData: any) => void;
}

interface ExternalPortal {
  name: string;
  icon: string;
  baseUrl: string;
  searchParams: (profile: any) => string;
  description: string;
}

export const ManualPropertySearch = ({ onAddProperty }: ManualPropertySearchProps) => {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [urlInput, setUrlInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      loadUserProfile();
    }
  }, [user?.id]);

  const loadUserProfile = async () => {
    if (!user?.id) return;
    
    try {
      const profile = await UserProfileService.getUserProfile(user.id);
      const preferences = await UserProfileService.getUserCriteriaPreferences(user.id);
      
      setUserProfile({
        ...profile,
        preferences: preferences
      });
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const buildSearchUrl = (portal: ExternalPortal): string => {
    if (!userProfile) return portal.baseUrl;
    
    const params = portal.searchParams(userProfile);
    return `${portal.baseUrl}${params}`;
  };

  const externalPortals: ExternalPortal[] = [
    {
      name: 'Google Imóveis',
      icon: '🔍',
      baseUrl: 'https://www.google.com/search',
      description: 'Busca geral por imóveis em diversos sites',
      searchParams: (profile) => {
        const intent = profile?.intencao === 'alugar' ? 'aluguel' : 'venda';
        const region = profile?.regiao_referencia || 'Belo Horizonte';
        const priceRange = profile?.faixa_preco || '';
        
        let query = `${intent} imovel ${region}`;
        if (priceRange) query += ` ${priceRange}`;
        
        return `?q=${encodeURIComponent(query)}`;
      }
    },
    {
      name: 'ZAP Imóveis',
      icon: '🏠',
      baseUrl: 'https://www.zapimoveis.com.br',
      description: 'Portal especializado em imóveis residenciais',
      searchParams: (profile) => {
        const intent = profile?.intencao === 'alugar' ? 'aluguel' : 'venda';
        const region = profile?.regiao_referencia || 'belo-horizonte-mg';
        
        // Normalizar nome da região para URL
        const normalizedRegion = region.toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9\-]/g, '');
        
        return `/${intent}/imoveis/${normalizedRegion}/`;
      }
    },
    {
      name: 'Viva Real',
      icon: '🏡',
      baseUrl: 'https://www.vivareal.com.br',
      description: 'Portal líder em anúncios imobiliários',
      searchParams: (profile) => {
        const intent = profile?.intencao === 'alugar' ? 'aluguel' : 'venda';
        const region = profile?.regiao_referencia || 'belo-horizonte';
        
        const normalizedRegion = region.toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9\-]/g, '');
        
        return `/${intent}/minas-gerais/${normalizedRegion}/`;
      }
    },
    {
      name: 'OLX Imóveis',
      icon: '🔄',
      baseUrl: 'https://mg.olx.com.br',
      description: 'Marketplace com variedade de opções',
      searchParams: (profile) => {
        const intent = profile?.intencao === 'alugar' ? 'aluguel' : 'venda';
        const region = profile?.regiao_referencia || '';
        
        let searchUrl = '/imoveis';
        if (intent === 'aluguel') searchUrl += '/aluguel';
        if (region) {
          const normalizedRegion = region.toLowerCase().replace(/\s+/g, '-');
          searchUrl += `?q=${encodeURIComponent(region)}`;
        }
        
        return searchUrl;
      }
    }
  ];

  const handleExtractProperty = async () => {
    if (!urlInput.trim()) {
      toast({
        title: "URL necessária",
        description: "Por favor, insira uma URL válida de imóvel",
        variant: "destructive"
      });
      return;
    }

    setIsExtracting(true);
    
    try {
      console.log('Extraindo dados da URL:', urlInput);
      const propertyData = await extractPropertyFromUrl(urlInput);
      
      // Avaliar o imóvel com IA
      let evaluationData = null;
      try {
        const { data: aiEvaluation, error: evaluationError } = await supabase.functions.invoke('evaluate-property-scores', {
          body: { propertyData }
        });

        if (!evaluationError && aiEvaluation) {
          evaluationData = aiEvaluation;
        }
      } catch (error) {
        console.warn('Erro na avaliação IA:', error);
      }

      const formattedProperty = {
        id: `manual-${Date.now()}`,
        title: propertyData.title || 'Imóvel Extraído',
        address: propertyData.address || 'Endereço não informado',
        bedrooms: propertyData.bedrooms || 1,
        bathrooms: propertyData.bathrooms || 1,
        parkingSpaces: propertyData.parkingSpaces || 0,
        area: propertyData.area || 50,
        floor: propertyData.floor || '',
        rent: propertyData.rent || 0,
        condo: propertyData.condo || 0,
        iptu: propertyData.iptu || 0,
        fireInsurance: 50,
        otherFees: 0,
        totalMonthlyCost: (propertyData.rent || 0) + (propertyData.condo || 0) + (propertyData.iptu || 0) + 50,
        images: propertyData.images || [],
        sourceUrl: urlInput,
        scores: evaluationData?.scores || {},
        finalScore: evaluationData?.finalScore || 0
      };

      if (onAddProperty) {
        onAddProperty(formattedProperty);
      }

      setUrlInput('');
      
      toast({
        title: "Imóvel extraído com sucesso",
        description: evaluationData?.explanation || "Dados do imóvel foram extraídos e adicionados à comparação",
        duration: 5000
      });

    } catch (error: any) {
      console.error('Erro na extração:', error);
      
      let errorMessage = "Erro ao extrair dados do imóvel";
      if (error?.message?.includes('não atende aos critérios')) {
        errorMessage = "Imóvel não atende aos seus critérios de busca";
      } else if (error?.message?.includes('extrair dados')) {
        errorMessage = "Não foi possível extrair dados desta URL";
      }
      
      toast({
        title: "Erro na extração",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const renderProfileSummary = () => {
    if (!userProfile) return null;

    const preferences = userProfile.preferences || [];
    const topCriteria = preferences.slice(0, 3);

    return (
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p><strong>Seu perfil:</strong> {userProfile.intencao || 'Não definido'} • {userProfile.regiao_referencia || 'Região não definida'}</p>
            {userProfile.faixa_preco && (
              <p><strong>Faixa de preço:</strong> {userProfile.faixa_preco}</p>
            )}
            {topCriteria.length > 0 && (
              <p><strong>Critérios importantes:</strong> {topCriteria.map(c => c.criterio_nome).join(', ')}</p>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Busca Manual de Imóveis</h3>
        <p className="text-muted-foreground">
          Use os links personalizados abaixo para encontrar imóveis e depois extraia os dados colando a URL
        </p>
      </div>

      {renderProfileSummary()}

      {/* Links para portais externos */}
      <div className="grid gap-4 md:grid-cols-2">
        {externalPortals.map((portal) => (
          <Card key={portal.name} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-xl">{portal.icon}</span>
                {portal.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {portal.description}
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(buildSearchUrl(portal), '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Buscar no {portal.name}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Extração manual de URL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Imóvel por URL
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Encontrou um imóvel interessante? Cole a URL aqui para extrair automaticamente os dados
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="https://www.zapimoveis.com.br/imovel/..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={isExtracting}
            />
            <Button 
              onClick={handleExtractProperty}
              disabled={isExtracting || !urlInput.trim()}
            >
              {isExtracting ? (
                <>
                  <Search className="h-4 w-4 mr-2 animate-spin" />
                  Extraindo...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Extrair
                </>
              )}
            </Button>
          </div>
          
          {isExtracting && (
            <div className="space-y-2">
              <LoadingState />
              <p className="text-sm text-muted-foreground text-center">
                Extraindo dados do imóvel e avaliando com IA...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>💡 <strong>Dica:</strong> Os links acima são personalizados com base no seu perfil e preferências</p>
      </div>
    </div>
  );
};