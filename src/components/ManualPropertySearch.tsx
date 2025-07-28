import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Search, Globe, Plus, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { UserProfileService } from '@/services/userProfileService';
import { useAuth } from '@/contexts/AuthContext';
import LoadingState from '@/components/LoadingState';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePropertyExtraction } from '@/hooks/usePropertyExtraction';
import { useDirectExtraction } from '@/hooks/useDirectExtraction';
import { useTestExtraction } from '@/hooks/useTestExtraction';

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

// Função para processar a região e extrair estado, município e bairro
const parseRegion = (region: string) => {
  const removeAccents = (text: string) => {
    return text
      .replace(/[áàâãä]/g, 'a')
      .replace(/[éèêë]/g, 'e')
      .replace(/[íìîï]/g, 'i')
      .replace(/[óòôõö]/g, 'o')
      .replace(/[úùûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[ñ]/g, 'n')
      .replace(/[ÁÀÂÃÄ]/g, 'A')
      .replace(/[ÉÈÊË]/g, 'E')
      .replace(/[ÍÌÎÏ]/g, 'I')
      .replace(/[ÓÒÔÕÖ]/g, 'O')
      .replace(/[ÚÙÛÜ]/g, 'U')
      .replace(/[Ç]/g, 'C')
      .replace(/[Ñ]/g, 'N');
  };

  const normalize = (text: string) => removeAccents(text).toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '');

  // Mapear estados para URLs
  const estadoMap: Record<string, string> = {
    'mg': 'minas-gerais',
    'sp': 'sao-paulo',
    'rj': 'rio-de-janeiro',
    'rs': 'rio-grande-do-sul',
    'pr': 'parana',
    'sc': 'santa-catarina',
    'go': 'goias',
    'mt': 'mato-grosso',
    'ms': 'mato-grosso-do-sul',
    'df': 'distrito-federal',
    'es': 'espirito-santo',
    'ba': 'bahia',
    'pe': 'pernambuco',
    'ce': 'ceara',
    'pb': 'paraiba',
    'rn': 'rio-grande-do-norte',
    'al': 'alagoas',
    'se': 'sergipe',
    'pi': 'piaui',
    'ma': 'maranhao',
    'to': 'tocantins',
    'pa': 'para',
    'ap': 'amapa',
    'am': 'amazonas',
    'rr': 'roraima',
    'ac': 'acre',
    'ro': 'rondonia'
  };

  // Separar por vírgulas e limpar espaços
  const parts = region.split(',').map(part => part.trim());
  
  let bairro = '';
  let municipio = 'belo-horizonte';
  let estado = 'minas-gerais';

  if (parts.length === 1) {
    // Apenas uma parte - pode ser bairro, município ou estado
    const part = normalize(parts[0]);
    if (estadoMap[parts[0].toLowerCase()]) {
      estado = estadoMap[parts[0].toLowerCase()];
    } else {
      // Assumir que é bairro se não for estado conhecido
      bairro = part;
    }
  } else if (parts.length === 2) {
    // Duas partes - município, estado OU bairro, município
    const [first, second] = parts;
    if (estadoMap[second.toLowerCase()]) {
      municipio = normalize(first);
      estado = estadoMap[second.toLowerCase()];
    } else {
      bairro = normalize(first);
      municipio = normalize(second);
    }
  } else if (parts.length >= 3) {
    // Três ou mais partes - bairro, município, estado
    bairro = normalize(parts[0]);
    municipio = normalize(parts[1]);
    const estadoKey = parts[2].toLowerCase();
    estado = estadoMap[estadoKey] || normalize(parts[2]);
  }

  return { estado, municipio, bairro };
};

export const ManualPropertySearch = ({ onAddProperty }: ManualPropertySearchProps) => {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [urlInput, setUrlInput] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const { extractPropertyData } = usePropertyExtraction();
  const { extractDirectly } = useDirectExtraction();
  const { testExtract } = useTestExtraction();

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
        
        // Processar região para extrair estado, município e bairro
        const { estado, municipio, bairro } = parseRegion(region);
        
        // Converter estado completo para sigla
        const estadoReverseMap: Record<string, string> = {
          'minas-gerais': 'mg',
          'sao-paulo': 'sp',
          'rio-de-janeiro': 'rj',
          'rio-grande-do-sul': 'rs',
          'parana': 'pr',
          'santa-catarina': 'sc',
          'goias': 'go',
          'mato-grosso': 'mt',
          'mato-grosso-do-sul': 'ms',
          'distrito-federal': 'df',
          'espirito-santo': 'es',
          'bahia': 'ba',
          'pernambuco': 'pe',
          'ceara': 'ce',
          'paraiba': 'pb',
          'rio-grande-do-norte': 'rn',
          'alagoas': 'al',
          'sergipe': 'se',
          'piaui': 'pi',
          'maranhao': 'ma',
          'tocantins': 'to',
          'para': 'pa',
          'amapa': 'ap',
          'amazonas': 'am',
          'roraima': 'rr',
          'acre': 'ac',
          'rondonia': 'ro'
        };
        
        const estadoSigla = estadoReverseMap[estado] || 'mg';
        
        // Formato: /aluguel/imoveis/estado+cidade++bairro/
        // Se não há bairro, usar apenas estado+cidade
        if (bairro) {
          return `/${intent}/imoveis/${estadoSigla}+${municipio}++${bairro}/`;
        } else {
          return `/${intent}/imoveis/${estadoSigla}+${municipio}/`;
        }
      }
    },
    {
      name: 'Viva Real',
      icon: '🏡',
      baseUrl: 'https://www.vivareal.com.br',
      description: 'Portal líder em anúncios imobiliários',
      searchParams: (profile) => {
        const intent = profile?.intencao === 'alugar' ? 'aluguel' : 'venda';
        const region = profile?.regiao_referencia || 'santo-agostinho, belo-horizonte, mg';
        
        // Processar região para extrair bairro, município e estado
        const { estado, municipio, bairro } = parseRegion(region);
        
        if (bairro) {
          return `/${intent}/${estado}/${municipio}/bairros/${bairro}/`;
        } else {
          return `/${intent}/${estado}/${municipio}/`;
        }
      }
    },
    {
      name: 'OLX Imóveis',
      icon: '🔄',
      baseUrl: 'https://www.olx.com.br',
      description: 'Marketplace com variedade de opções',
      searchParams: (profile) => {
        const intent = profile?.intencao === 'alugar' ? 'aluguel' : 'venda';
        const region = profile?.regiao_referencia || 'belo horizonte';
        
        // Processar região para extrair apenas o município
        const { municipio } = parseRegion(region);
        
        // Converter hífens em espaços para o nome da cidade
        const cityName = municipio.replace(/-/g, ' ');
        
        // Formato: /imoveis/intent?q=cidade
        return `/imoveis/${intent}?q=${encodeURIComponent(cityName)}`;
      }
    },
    {
      name: 'QuintoAndar',
      icon: '🏢',
      baseUrl: 'https://www.quintoandar.com.br',
      description: 'Plataforma moderna de aluguel de imóveis',
      searchParams: (profile) => {
        const intent = profile?.intencao === 'alugar' ? 'alugar' : 'comprar';
        const region = profile?.regiao_referencia || 'belo horizonte, mg';
        
        // Processar região para extrair estado, município e bairro
        const { estado, municipio, bairro } = parseRegion(region);
        
        // Converter estado completo para sigla
        const estadoReverseMap: Record<string, string> = {
          'minas-gerais': 'mg',
          'sao-paulo': 'sp',
          'rio-de-janeiro': 'rj',
          'rio-grande-do-sul': 'rs',
          'parana': 'pr',
          'santa-catarina': 'sc',
          'goias': 'go',
          'mato-grosso': 'mt',
          'mato-grosso-do-sul': 'ms',
          'distrito-federal': 'df',
          'espirito-santo': 'es',
          'bahia': 'ba',
          'pernambuco': 'pe',
          'ceara': 'ce',
          'paraiba': 'pb',
          'rio-grande-do-norte': 'rn',
          'alagoas': 'al',
          'sergipe': 'se',
          'piaui': 'pi',
          'maranhao': 'ma',
          'tocantins': 'to',
          'para': 'pa',
          'amapa': 'ap',
          'amazonas': 'am',
          'roraima': 'rr',
          'acre': 'ac',
          'rondonia': 'ro'
        };
        
        const estadoSigla = estadoReverseMap[estado] || 'mg';
        
        // Formato: /intent/imovel/bairro-cidade-estado-brasil ou /intent/imovel/cidade-estado-brasil
        if (bairro) {
          return `/${intent}/imovel/${bairro}-${municipio}-${estadoSigla}-brasil`;
        } else {
          return `/${intent}/imovel/${municipio}-${estadoSigla}-brasil`;
        }
      }
    }
  ];

  const [isExtracting, setIsExtracting] = useState(false);

  const handleTestFunction = async () => {
    if (isExtracting) return;
    
    setIsExtracting(true);
    try {
      const result = await testExtract(urlInput || 'https://test.com');
      if (result && onAddProperty) {
        onAddProperty(result);
        setUrlInput('');
      }
    } finally {
      setIsExtracting(false);
    }
  };

  const handleExtractProperty = async () => {
    if (isExtracting) {
      console.log('⚠️ Extração já em andamento, ignorando clique');
      return;
    }

    setIsExtracting(true);
    console.log('🚀 Iniciando extração de propriedade');
    
    try {
      const directResult = await extractDirectly(urlInput);
      
      if (directResult && onAddProperty) {
        console.log('✅ Dados extraídos com sucesso, adicionando propriedade');
        onAddProperty(directResult);
        setUrlInput('');
        toast({
          title: "Propriedade adicionada!",
          description: "Os dados foram extraídos e a propriedade foi adicionada com sucesso.",
        });
      } else {
        console.log('❌ Falha na extração de dados');
      }
    } catch (error) {
      console.error('❌ Erro durante extração:', error);
      toast({
        title: "Erro na extração",
        description: "Não foi possível extrair os dados da propriedade.",
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
            <Button 
              onClick={handleTestFunction}
              disabled={isExtracting}
              variant="outline"
              size="sm"
            >
              🧪 Teste
            </Button>
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