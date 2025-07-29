import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('=== EXTRACT-PROPERTY-DATA FUNCIONANDO ===');
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json();
    console.log('🔗 URL:', url);

    // Validar usuário
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let userId = 'anonymous';
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (user && !error) {
          userId = user.id;
          console.log('✅ Usuário:', userId);
        }
      } catch (e) {
        console.log('⚠️ Erro auth:', e.message);
      }
    }

    // Buscar critérios do usuário
    let userCriteria: any[] = [];
    
    if (userId !== 'anonymous') {
      console.log('🔍 Buscando critérios...');
      
      const { data: criteria, error } = await supabase
        .from('user_criteria_preferences')
        .select('criterio_nome, peso, ativo')
        .eq('user_id', userId)
        .eq('ativo', true);
      
      console.log('📊 Critérios:', criteria?.length || 0);
      
      if (!error && criteria) {
        userCriteria = criteria;
      }
    }

    // Extrair dados da página usando Firecrawl
    const propertyData = await extractFromPage(url);
    console.log('🏠 Dados extraídos:', propertyData.title || 'Título não encontrado');

    // Se não conseguiu extrair da página, usar dados da URL como fallback
    if (!propertyData.title && !propertyData.address) {
      const fallbackData = extractFromVivaRealUrl(url);
      Object.assign(propertyData, fallbackData);
    }

    // Avaliar com IA ou simulação
    const scores = await evaluateWithAI(propertyData, userCriteria);
    console.log('⭐ Scores:', Object.keys(scores));

    const result = {
      ...propertyData,
      scores: scores,
      sourceUrl: url
    };

    return new Response(JSON.stringify({
      success: true,
      data: result,
      message: 'Extração e avaliação completas'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Erro:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function extractFromPage(url: string): Promise<any> {
  console.log('🔍 Fazendo scraping da página:', url);
  
  const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
  
  if (!firecrawlApiKey) {
    console.log('⚠️ Firecrawl não configurado, usando extração da URL');
    return extractFromVivaRealUrl(url);
  }

  try {
    // Fazer scraping da página com Firecrawl
    const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown', 'html'],
        onlyMainContent: true
      }),
    });

    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.data?.markdown || data.data?.html || '';
    
    console.log('📄 Conteúdo extraído, tamanho:', content.length);

    // Extrair dados específicos do conteúdo
    const extractedData = parseVivaRealContent(content, url);
    
    return extractedData;
    
  } catch (error) {
    console.error('💥 Erro no scraping:', error);
    console.log('🔄 Fallback para extração da URL');
    return extractFromVivaRealUrl(url);
  }
}

function parseVivaRealContent(content: string, url: string): any {
  console.log('🔍 Analisando conteúdo da página...');
  console.log('📝 Amostra do conteúdo (primeiros 500 chars):', content.substring(0, 500));
  
  const data: any = {
    images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400"]
  };

  try {
    // Limpar conteúdo removendo caracteres especiais que podem atrapalhar o parsing
    const cleanContent = content.replace(/[\[\]()]/g, '').replace(/\s+/g, ' ');
    
    // Extrair título do imóvel - melhorados os padrões
    const titlePatterns = [
      // Padrão específico: "Apartamento com X quartos" etc
      /(Apartamento|Casa|Cobertura|Studio|Kitnet)\s+(?:com\s+)?(\d+)\s+quarto[s]?[^.\n]{0,50}/i,
      // Padrão: "X quartos + localização"
      /(\d+)\s+quarto[s]?[^.\n]*?(?:em|no|na)\s+([A-Za-zÀ-ÿ\s]{3,30})/i,
      // Padrão geral de título de imóvel
      /(Apartamento|Casa|Cobertura|Studio|Kitnet)[^.\n]{10,80}(?:aluguel|alugar)/i,
      // Fallback: primeiro texto que menciona tipo + características
      /(Apartamento|Casa|Cobertura|Studio|Kitnet)[^.\n]{15,60}/i
    ];

    for (const pattern of titlePatterns) {
      const match = cleanContent.match(pattern);
      if (match && match[0] && match[0].length > 10 && match[0].length < 100) {
        // Limpar o título extraído
        let title = match[0].trim()
          .replace(/^\W+|\W+$/g, '') // Remove caracteres especiais do início/fim
          .replace(/\s+/g, ' '); // Normaliza espaços
        
        // Validar se não é um título genérico demais
        if (!title.toLowerCase().includes('apartamentos para alugar') && 
            !title.toLowerCase().includes('imóveis para') &&
            title.length > 15) {
          data.title = title;
          console.log('🏠 Título encontrado:', data.title);
          break;
        }
      }
    }

    // Extrair endereço - padrões melhorados
    const addressPatterns = [
      // Padrão com CEP
      /([A-ZÀ-ÿ][^,\n]*[A-Za-zÀ-ÿ][^,\n]*,\s*[^,\n]*\d{5}-?\d{3}[^,\n]*)/i,
      // Padrão: Rua/Avenida + nome + número + bairro + cidade
      /((?:Rua|Avenida|Alameda|Travessa)\s+[^,\n]+,\s*\d+[^,\n]*,\s*[A-ZÀ-ÿ][^,\n]*,\s*[A-ZÀ-ÿ][^,\n]*)/i,
      // Padrão: Nome da rua + número + bairro + cidade
      /([A-ZÀ-ÿ][^,\n]*,\s*\d+[^,\n]*,\s*[A-ZÀ-ÿ][^,\n]*,\s*[A-ZÀ-ÿ][^,\n]*)/i,
      // Padrão simplificado: bairro + cidade
      /([A-ZÀ-ÿ][A-Za-zÀ-ÿ\s]{3,25}),\s*([A-ZÀ-ÿ][A-Za-zÀ-ÿ\s]{3,25})/i
    ];

    for (const pattern of addressPatterns) {
      const match = cleanContent.match(pattern);
      if (match && match[1]) {
        let address = match[1].trim()
          .replace(/^\W+|\W+$/g, '')
          .replace(/\s+/g, ' ');
        
        // Validar se não é um endereço genérico
        if (address.length > 10 && 
            !address.toLowerCase().includes('apartamentos para') &&
            !address.toLowerCase().includes('imóveis para')) {
          data.address = address;
          console.log('📍 Endereço encontrado:', data.address);
          break;
        }
      }
    }

    // Extrair valores financeiros - melhorados
    const rentPatterns = [
      /(?:aluguel|valor)[:\s]*R\$\s*([\d.,]+)/i,
      /R\$\s*([\d.,]+)(?:\s*\/\s*mês|\s*por\s*mês|\s*mensais?)/i,
      /preço[:\s]*R\$\s*([\d.,]+)/i
    ];

    for (const pattern of rentPatterns) {
      const match = cleanContent.match(pattern);
      if (match && match[1]) {
        const value = parseInt(match[1].replace(/[.,]/g, ''));
        if (value > 500 && value < 50000) { // Validação de range razoável
          data.rent = value;
          console.log('💰 Aluguel encontrado:', data.rent);
          break;
        }
      }
    }

    const condoPatterns = [
      /condomínio[:\s]*R\$\s*([\d.,]+)/i,
      /taxa[:\s]*R\$\s*([\d.,]+)/i
    ];

    for (const pattern of condoPatterns) {
      const match = cleanContent.match(pattern);
      if (match && match[1]) {
        const value = parseInt(match[1].replace(/[.,]/g, ''));
        if (value > 0 && value < 5000) {
          data.condo = value;
          console.log('🏢 Condomínio encontrado:', data.condo);
          break;
        }
      }
    }

    // Extrair características - padrões melhorados
    const bedroomPatterns = [
      /(\d+)\s+(?:quarto[s]?|dormitório[s]?)/i,
      /(\d+)\s*q(?:to[s]?)?/i
    ];

    for (const pattern of bedroomPatterns) {
      const match = cleanContent.match(pattern);
      if (match && match[1]) {
        const bedrooms = parseInt(match[1]);
        if (bedrooms >= 0 && bedrooms <= 10) {
          data.bedrooms = bedrooms;
          console.log('🛏️ Quartos encontrados:', data.bedrooms);
          break;
        }
      }
    }

    const bathroomPatterns = [
      /(\d+)\s+banheiro[s]?/i,
      /(\d+)\s*bwc[s]?/i
    ];

    for (const pattern of bathroomPatterns) {
      const match = cleanContent.match(pattern);
      if (match && match[1]) {
        const bathrooms = parseInt(match[1]);
        if (bathrooms >= 1 && bathrooms <= 10) {
          data.bathrooms = bathrooms;
          console.log('🚿 Banheiros encontrados:', data.bathrooms);
          break;
        }
      }
    }

    const areaPatterns = [
      /(\d+)\s*m[²2](?:\s*(?:privativa|útil|total))?/i,
      /área[:\s]*(\d+)\s*m/i
    ];

    for (const pattern of areaPatterns) {
      const match = cleanContent.match(pattern);
      if (match && match[1]) {
        const area = parseInt(match[1]);
        if (area >= 20 && area <= 1000) {
          data.area = area;
          console.log('📐 Área encontrada:', data.area);
          break;
        }
      }
    }

    const parkingPatterns = [
      /(\d+)\s*vaga[s]?(?:\s*de\s*garagem)?/i,
      /garagem[:\s]*(\d+)/i
    ];

    for (const pattern of parkingPatterns) {
      const match = cleanContent.match(pattern);
      if (match && match[1]) {
        const parking = parseInt(match[1]);
        if (parking >= 0 && parking <= 5) {
          data.parkingSpaces = parking;
          console.log('🚗 Vagas encontradas:', data.parkingSpaces);
          break;
        }
      }
    }

    console.log('✅ Dados extraídos do conteúdo:', {
      hasTitle: !!data.title,
      hasAddress: !!data.address,
      hasRent: !!data.rent,
      bedrooms: data.bedrooms,
      area: data.area
    });

  } catch (error) {
    console.error('💥 Erro ao analisar conteúdo:', error);
  }

  // Validar qualidade dos dados extraídos
  const hasValidTitle = data.title && data.title.length > 10 && 
    !data.title.toLowerCase().includes('apartamentos para alugar');
  const hasValidAddress = data.address && data.address.length > 10 && 
    !data.address.toLowerCase().includes('apartamentos para');

  console.log('🔍 Validação:', { hasValidTitle, hasValidAddress });

  // Se não conseguiu extrair dados essenciais ou são dados genéricos, usar fallback da URL
  if (!hasValidTitle || !hasValidAddress) {
    console.log('🔄 Dados insuficientes ou genéricos, usando fallback da URL');
    const fallback = extractFromVivaRealUrl(url);
    
    // Mesclar dados mantendo os válidos do scraping
    return {
      ...fallback,
      ...(data.rent && { rent: data.rent }),
      ...(data.condo && { condo: data.condo }),
      ...(data.bedrooms && { bedrooms: data.bedrooms }),
      ...(data.bathrooms && { bathrooms: data.bathrooms }),
      ...(data.area && { area: data.area }),
      ...(data.parkingSpaces !== undefined && { parkingSpaces: data.parkingSpaces }),
      images: data.images
    };
  }

  // Completar dados padrão
  return {
    title: data.title,
    address: data.address,
    rent: data.rent || 3000,
    condo: data.condo || Math.floor((data.rent || 3000) * 0.15),
    iptu: Math.floor((data.rent || 3000) * 0.05),
    bedrooms: data.bedrooms || 2,
    bathrooms: data.bathrooms || 1,
    area: data.area || 70,
    parkingSpaces: data.parkingSpaces !== undefined ? data.parkingSpaces : (data.bedrooms >= 2 ? 1 : 0),
    fireInsurance: 50,
    otherFees: 0,
    description: data.title,
    images: data.images
  };
}

function extractDifferentData(url: string): any {
  console.log('🔍 Processando URL:', url);
  
  // Extrair dados reais da URL do VivaReal
  const propertyData = extractFromVivaRealUrl(url);
  
  if (propertyData.title && propertyData.address) {
    console.log('🏠 Dados extraídos da URL:', propertyData.title);
    return propertyData;
  }
  
  // Fallback - gerar dados únicos baseados na URL se não conseguir extrair
  const urlHash = url.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const randomSeed = Math.abs(urlHash) % 1000;
  
  // Gerar dados únicos baseados na URL
  const baseRent = 2000 + (randomSeed % 5000);
  const baseCondo = 300 + (randomSeed % 800);
  const baseArea = 50 + (randomSeed % 100);
  
  return {
    title: `Propriedade ${randomSeed}`,
    address: `Endereço não extraído - ID ${randomSeed}`,
    rent: baseRent,
    condo: baseCondo,
    iptu: Math.floor(baseRent * 0.1),
    bedrooms: 1 + (randomSeed % 4),
    bathrooms: 1 + (randomSeed % 3),
    area: baseArea,
    parkingSpaces: randomSeed % 3,
    fireInsurance: 50,
    otherFees: 0,
    description: `Propriedade gerada para URL ${randomSeed}`,
    images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400"]
  };
}

function extractFromVivaRealUrl(url: string): any {
  console.log('🔍 Extraindo dados da URL do VivaReal:', url);
  
  try {
    // Extrair informações da URL do VivaReal
    const urlParts = url.split('/');
    const imovelPart = urlParts.find(part => part.includes('apartamento') || part.includes('casa') || part.includes('imovel'));
    
    if (!imovelPart) {
      console.log('⚠️ Não é uma URL válida do VivaReal');
      return {};
    }
    
    // Parse da URL do VivaReal para extrair informações
    const matches = url.match(/\/imovel\/([^\/]+)/);
    if (!matches || !matches[1]) {
      console.log('⚠️ Não conseguiu fazer parse da URL');
      return {};
    }
    
    const urlInfo = matches[1];
    const parts = urlInfo.split('-');
    
    // Extrair tipo do imóvel
    let propertyType = 'Imóvel';
    if (urlInfo.includes('apartamento')) propertyType = 'Apartamento';
    else if (urlInfo.includes('casa')) propertyType = 'Casa';
    else if (urlInfo.includes('cobertura')) propertyType = 'Cobertura';
    
    // Extrair número de quartos
    let bedrooms = 1;
    const bedroomMatch = urlInfo.match(/(\d+)-quartos?/);
    if (bedroomMatch) {
      bedrooms = parseInt(bedroomMatch[1]);
    }
    
    // Extrair bairro/localização de forma mais precisa
    let neighborhood = '';
    let city = '';
    
    // Método 1: Procurar padrão específico do VivaReal
    // Exemplo: "apartamento-2-quartos-vila-da-serra-bairros-nova-lima"
    const vivaRealPattern = /quartos-([^-]+-[^-]+(?:-[^-]+)*)-bairros?-([^-]+(?:-[^-]+)*)/i;
    const vivaRealMatch = urlInfo.match(vivaRealPattern);
    
    if (vivaRealMatch) {
      neighborhood = vivaRealMatch[1].replace(/-/g, ' ').split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      city = vivaRealMatch[2].replace(/-/g, ' ').split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      console.log('🏘️ Extraído via padrão VivaReal:', { neighborhood, city });
    } else {
      // Método 2: Fallback para outros padrões
      const locationPatterns = [
        /-([a-z-]+)-com-(?:garagem|elevador|area)/i,
        /-([a-z-]+)-bairros?/i,
        /bairros?-([a-z-]+)(?:-com-|-\d)/i
      ];
      
      for (const pattern of locationPatterns) {
        const match = urlInfo.match(pattern);
        if (match && match[1]) {
          neighborhood = match[1].replace(/-/g, ' ').split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          break;
        }
      }
    }
    
    // Detectar cidade se não foi extraída no padrão VivaReal
    if (!city) {
      if (urlInfo.includes('nova-lima')) {
        city = 'Nova Lima';
      } else if (urlInfo.includes('belo-horizonte')) {
        city = 'Belo Horizonte';
      } else if (urlInfo.includes('-bh-') || urlInfo.includes('-mg')) {
        city = 'Belo Horizonte';
      } else {
        city = 'MG';
      }
    }
    
    // Extrair área se presente
    let area = 70; // valor padrão
    const areaMatch = urlInfo.match(/(\d+)m2/);
    if (areaMatch) {
      area = parseInt(areaMatch[1]);
    }
    
    // Extrair valor do aluguel se presente
    let rent = 3000; // valor padrão
    const rentMatch = urlInfo.match(/(?:aluguel-)?RS?(\d+)/i);
    if (rentMatch) {
      rent = parseInt(rentMatch[1]);
    }
    
    // Montar título descritivo mais limpo
    const title = `${propertyType} ${bedrooms} quarto${bedrooms > 1 ? 's' : ''} - ${neighborhood || city}`;
    
    // Montar endereço mais limpo
    const address = neighborhood && city && neighborhood !== city
      ? `${neighborhood}, ${city}` 
      : city || 'Localização não especificada';
    
    const result = {
      title: title,
      address: address,
      rent: rent,
      condo: Math.floor(rent * 0.15), // Estimativa de condomínio (15% do aluguel)
      iptu: Math.floor(rent * 0.05), // Estimativa de IPTU (5% do aluguel)
      bedrooms: bedrooms,
      bathrooms: Math.max(1, bedrooms - 1), // Estimativa de banheiros
      area: area,
      parkingSpaces: bedrooms >= 2 ? 1 : 0, // Estimativa de vagas
      fireInsurance: 50,
      otherFees: 0,
      description: `${propertyType} localizado em ${neighborhood || city}`,
      images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400"]
    };
    
    console.log('✅ Dados extraídos:', { title: result.title, address: result.address });
    return result;
    
  } catch (error) {
    console.error('💥 Erro ao extrair dados da URL:', error);
    return {};
  }
}

async function evaluateWithAI(propertyData: any, userCriteria: any[]): Promise<any> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    console.log('🤖 OpenAI não configurado, usando simulação');
    return evaluateWithUserCriteria(propertyData, userCriteria);
  }

  if (userCriteria.length === 0) {
    console.log('🤖 Sem critérios do usuário, usando simulação');
    return evaluateWithUserCriteria(propertyData, userCriteria);
  }

  try {
    console.log('🤖 Chamando OpenAI para avaliação...');
    
    const prompt = buildPrompt(propertyData, userCriteria);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em avaliação de imóveis. Analise propriedades e retorne APENAS um JSON válido com scores de 0 a 10 para cada critério.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || '{}';
    
    console.log('🤖 Resposta da IA:', aiResponse);

    try {
      // Extrair JSON da resposta usando a lógica que funcionou
      let cleanContent = aiResponse.trim();
      
      // Remover formatação markdown se presente
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      // Procurar por JSON válido
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const scores = JSON.parse(jsonMatch[0]);
        
        // Validar e limitar scores entre 0 e 10
        const validatedScores: Record<string, number> = {};
        for (const [key, value] of Object.entries(scores)) {
          if (typeof value === 'number' && !isNaN(value)) {
            validatedScores[key] = Math.max(0, Math.min(10, value));
          }
        }
        
        console.log('✅ IA avaliou e validou:', Object.keys(validatedScores));
        return validatedScores;
      } else {
        console.error('Não foi possível extrair JSON dos scores');
        throw new Error('JSON inválido');
      }
    } catch (parseError) {
      console.error('Erro ao fazer parse dos scores:', parseError);
      throw parseError;
    }

  } catch (error) {
    console.error('💥 Erro na IA:', error);
    console.log('🔄 Fallback para simulação');
    return evaluateWithUserCriteria(propertyData, userCriteria);
  }
}

function buildPrompt(propertyData: any, userCriteria: any[]): string {
  const criteriosList = userCriteria
    .map(c => `${c.criterio_nome} (peso: ${c.peso})`)
    .join('\n- ');

  const custoTotal = (propertyData.rent || 0) + (propertyData.condo || 0) + (propertyData.iptu || 0);

  return `Analise este imóvel e atribua notas de 0 a 10 para cada critério solicitado.

DADOS DO IMÓVEL:
- Título: ${propertyData.title}
- Endereço: ${propertyData.address}
- Aluguel: R$ ${propertyData.rent}
- Condomínio: R$ ${propertyData.condo}
- IPTU: R$ ${propertyData.iptu}
- Custo Total Mensal: R$ ${custoTotal}
- Quartos: ${propertyData.bedrooms}
- Banheiros: ${propertyData.bathrooms}
- Área: ${propertyData.area}m²
- Vagas: ${propertyData.parkingSpaces}

CRITÉRIOS PARA AVALIAR (notas de 0 a 10):
- ${criteriosList}

INSTRUÇÕES ESPECÍFICAS:
1. Para "localizacao" ou "proximidade_metro": Analise a qualidade da localização baseada no endereço
2. Para "preco_total" ou "preco_por_m2": Compare o custo total mensal (R$ ${custoTotal}) com valores de mercado
   - Se custo muito alto para a região: nota baixa (2-4)
   - Se custo justo para a região: nota alta (7-9)
   - Se custo abaixo do mercado: nota muito alta (8-10)
3. Para "tamanho": Avalie se a área (${propertyData.area}m²) é adequada para ${propertyData.bedrooms} quartos
4. Para outros critérios: Analise com base na descrição e características do imóvel

DESCRIÇÃO DO IMÓVEL:
${propertyData.description || 'Descrição não disponível'}

Retorne APENAS um objeto JSON com os critérios e suas notas (use o nome exato dos critérios):
{"criterio1": nota, "criterio2": nota, ...}`;
}

function evaluateWithUserCriteria(propertyData: any, userCriteria: any[]): any {
  console.log('⭐ Avaliando com critérios:', userCriteria.length);
  
  if (userCriteria.length > 0) {
    const scores: any = {};
    
    for (const criterio of userCriteria) {
      scores[criterio.criterio_nome] = calculateScore(criterio.criterio_nome, propertyData);
    }
    
    console.log('✅ Usando critérios do usuário:', Object.keys(scores));
    return scores;
  }
  
  console.log('⚠️ Usando critérios padrão');
  return {
    "location": 7,
    "price": 6,
    "space": 8
  };
}

function calculateScore(criteriaName: string, property: any): number {
  switch (criteriaName.toLowerCase()) {
    case 'preco_total':
      const total = (property.rent || 0) + (property.condo || 0) + (property.iptu || 0);
      return total < 3000 ? 9 : total < 5000 ? 7 : 5;
    case 'preco_por_m2':
      const pricePerSqm = (property.rent || 0) / (property.area || 1);
      return pricePerSqm < 30 ? 9 : pricePerSqm < 50 ? 7 : 5;
    case 'tamanho':
      return property.area > 100 ? 9 : property.area > 80 ? 7 : 5;
    case 'localizacao':
      return 8; // Score fixo para localização
    default:
      return Math.floor(Math.random() * 4) + 6; // 6-9
  }
}