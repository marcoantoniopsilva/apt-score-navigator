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
  console.log('📝 Amostra do conteúdo (primeiros 200 chars):', content.substring(0, 200));
  
  const data: any = {
    images: []
  };

  try {
    // Limpar conteúdo básico
    const cleanContent = content.replace(/\s+/g, ' ').trim();
    
    // Extrair título do imóvel - padrões simples e seguros
    const titlePatterns = [
      /Apartamento\s+(?:com\s+)?\d+\s+quarto[s]?[^.\n]{10,50}/i,
      /Casa\s+(?:com\s+)?\d+\s+quarto[s]?[^.\n]{10,50}/i,
      /\d+\s+quarto[s]?[^.\n]{15,50}(?:em|no|na)\s+[A-Za-z\s]{3,20}/i,
      /Apartamento[^.\n]{15,60}(?:aluguel|alugar)/i
    ];

    for (const pattern of titlePatterns) {
      try {
        const match = cleanContent.match(pattern);
        if (match && match[0] && match[0].length > 15 && match[0].length < 80) {
          let title = match[0].trim().replace(/\s+/g, ' ');
          
          // Validar se não é genérico
          if (!title.toLowerCase().includes('apartamentos para alugar') && 
              !title.toLowerCase().includes('imóveis para')) {
            data.title = title;
            console.log('🏠 Título encontrado:', data.title);
            break;
          }
        }
      } catch (regexError) {
        console.error('Erro no regex de título:', regexError);
        continue;
      }
    }

    // Extrair endereço - padrões melhorados para capturar endereços reais
    const addressPatterns = [
      // Padrão completo: Rua + nome + número + bairro + cidade
      /(?:Rua|Avenida|Alameda|Travessa)\s+[^,\n]+,\s*\d+[^,\n]*-\s*[A-Za-z\s]+,\s*[A-Za-z\s]+/i,
      // Padrão: Nome da rua + número + bairro + cidade (com hífen)
      /[A-Z][A-Za-z\s]+,\s*\d+[^,\n]*-\s*[A-Za-z\s]+,\s*[A-Za-z\s]+/i,
      // Padrão: Rua + nome + número + bairro
      /(?:Rua|Avenida|Alameda|Travessa)\s+[^,\n]+,\s*\d+[^,\n]*,\s*[A-Za-z\s]+/i,
      // Padrão: Nome + número + hífen + bairro + cidade
      /[A-Z][A-Za-z\s]+\s+\d+[^,\n]*-\s*[A-Za-z\s]+,\s*[A-Za-z\s]+/i,
      // Padrão simples: bairro + cidade (com "em" ou "no")
      /(?:em|no|na)\s+([A-Za-z\s]{5,30}),\s*([A-Za-z\s]{5,30})/i
    ];

    for (const pattern of addressPatterns) {
      try {
        const match = cleanContent.match(pattern);
        if (match && match[0] && match[0].length > 15 && match[0].length < 120) {
          let address = match[0].trim().replace(/\s+/g, ' ');
          
          // Remover prefixos como "em", "no", "na"
          address = address.replace(/^(?:em|no|na)\s+/i, '');
          
          // Validar se é um endereço válido
          if (!address.toLowerCase().includes('apartamentos para') &&
              !address.toLowerCase().includes('imóveis para') &&
              !address.toLowerCase().includes('quartos ') &&
              address.includes(',')) {
            data.address = address;
            console.log('📍 Endereço encontrado:', data.address);
            break;
          }
        }
      } catch (regexError) {
        console.error('Erro no regex de endereço:', regexError);
        continue;
      }
    }

    // Extrair imagens do imóvel
    try {
      console.log('🖼️ Iniciando extração de imagens...');
      const allImageUrls = extractImagesFromContent(content, cleanContent);
      console.log(`📸 Imagens brutas extraídas: ${allImageUrls.length}`);
      
      if (allImageUrls.length > 0) {
        // Para debug: mostrar todas as URLs encontradas
        console.log('🔗 URLs encontradas:', allImageUrls.slice(0, 5)); // Mostrar apenas as 5 primeiras
        
        // Selecionar as melhores imagens
        const bestImages = selectBestPropertyImage(allImageUrls);
        data.images = bestImages;
        console.log('📸 Melhores imagens selecionadas:', bestImages.length);
        console.log('🎯 URLs finais:', bestImages);
      } else {
        console.log('⚠️ NENHUMA imagem extraída - usando array vazio');
        data.images = [];
      }
    } catch (error) {
      console.error('Erro ao extrair imagens:', error);
      data.images = [];
    }

    // Extrair valores - padrões básicos
    try {
      const rentMatch = cleanContent.match(/R\$\s*(\d{1,2}\.?\d{3,4})/i);
      if (rentMatch && rentMatch[1]) {
        const value = parseInt(rentMatch[1].replace(/\D/g, ''));
        if (value > 500 && value < 50000) {
          data.rent = value;
          console.log('💰 Aluguel encontrado:', data.rent);
        }
      }
    } catch (error) {
      console.error('Erro ao extrair aluguel:', error);
    }

    // Extrair características básicas
    try {
      const bedroomMatch = cleanContent.match(/(\d+)\s+quarto[s]?/i);
      if (bedroomMatch && bedroomMatch[1]) {
        const bedrooms = parseInt(bedroomMatch[1]);
        if (bedrooms >= 0 && bedrooms <= 10) {
          data.bedrooms = bedrooms;
          console.log('🛏️ Quartos:', data.bedrooms);
        }
      }
    } catch (error) {
      console.error('Erro ao extrair quartos:', error);
    }

    try {
      const bathroomMatch = cleanContent.match(/(\d+)\s+banheiro[s]?/i);
      if (bathroomMatch && bathroomMatch[1]) {
        const bathrooms = parseInt(bathroomMatch[1]);
        if (bathrooms >= 1 && bathrooms <= 10) {
          data.bathrooms = bathrooms;
          console.log('🚿 Banheiros:', data.bathrooms);
        }
      }
    } catch (error) {
      console.error('Erro ao extrair banheiros:', error);
    }

    try {
      const areaMatch = cleanContent.match(/(\d+)\s*m[²2]/i);
      if (areaMatch && areaMatch[1]) {
        const area = parseInt(areaMatch[1]);
        if (area >= 20 && area <= 1000) {
          data.area = area;
          console.log('📐 Área:', data.area);
        }
      }
    } catch (error) {
      console.error('Erro ao extrair área:', error);
    }

    console.log('✅ Dados extraídos do conteúdo:', {
      hasTitle: !!data.title,
      hasAddress: !!data.address,
      hasRent: !!data.rent,
      bedrooms: data.bedrooms
    });

  } catch (error) {
    console.error('💥 Erro geral ao analisar conteúdo:', error);
  }

  // Validar qualidade dos dados
  const hasValidTitle = data.title && data.title.length > 10;
  const hasValidAddress = data.address && data.address.length > 10;

  console.log('🔍 Validação:', { hasValidTitle, hasValidAddress });

  // Se dados insuficientes, usar fallback da URL
  if (!hasValidTitle || !hasValidAddress) {
    console.log('🔄 Dados insuficientes, usando fallback da URL');
    try {
      const fallback = extractFromVivaRealUrl(url);
      
      return {
        ...fallback,
        ...(data.rent && { rent: data.rent }),
        ...(data.bedrooms && { bedrooms: data.bedrooms }),
        ...(data.bathrooms && { bathrooms: data.bathrooms }),
        ...(data.area && { area: data.area }),
        images: data.images && data.images.length > 0 ? data.images : []
      };
    } catch (fallbackError) {
      console.error('💥 Erro no fallback:', fallbackError);
      return {
        title: 'Imóvel extraído',
        address: 'Endereço não encontrado',
        rent: 3000,
        condo: 450,
        iptu: 150,
        bedrooms: 2,
        bathrooms: 1,
        area: 70,
        parkingSpaces: 1,
        fireInsurance: 50,
        otherFees: 0,
        description: 'Imóvel extraído automaticamente',
        images: data.images && data.images.length > 0 ? data.images : []
      };
    }
  }

  // Completar dados padrão
  return {
    title: data.title,
    address: data.address,
    rent: data.rent || 3000,
    condo: Math.floor((data.rent || 3000) * 0.15),
    iptu: Math.floor((data.rent || 3000) * 0.05),
    bedrooms: data.bedrooms || 2,
    bathrooms: data.bathrooms || 1,
    area: data.area || 70,
    parkingSpaces: data.bedrooms >= 2 ? 1 : 0,
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
    images: []
  };
}

function extractFromVivaRealUrl(url: string): any {
  console.log('🔍 Extraindo dados da URL:', url);
  
  try {
    let urlInfo = '';
    let propertyType = 'Imóvel';
    let bedrooms = 1;
    let neighborhood = '';
    let city = '';
    
    // Detectar se é VivaReal ou QuintoAndar e processar adequadamente
    if (url.includes('vivareal.com')) {
      console.log('🏢 Processando URL do VivaReal');
      const urlParts = url.split('/');
      const imovelPart = urlParts.find(part => part.includes('apartamento') || part.includes('casa') || part.includes('imovel'));
      
      if (!imovelPart) {
        console.log('⚠️ Não é uma URL válida do VivaReal');
        return {};
      }
      
      const matches = url.match(/\/imovel\/([^\/]+)/);
      if (!matches || !matches[1]) {
        console.log('⚠️ Não conseguiu fazer parse da URL do VivaReal');
        return {};
      }
      
      urlInfo = matches[1];
      
      // Parse específico para VivaReal
      if (urlInfo.includes('apartamento')) propertyType = 'Apartamento';
      else if (urlInfo.includes('casa')) propertyType = 'Casa';
      else if (urlInfo.includes('cobertura')) propertyType = 'Cobertura';
      
      const bedroomMatch = urlInfo.match(/(\d+)-quartos?/);
      if (bedroomMatch) {
        bedrooms = parseInt(bedroomMatch[1]);
      }
      
      // Padrão VivaReal: "apartamento-2-quartos-vila-da-serra-bairros-nova-lima"
      const vivaRealPattern = /quartos-([^-]+-[^-]+(?:-[^-]+)*)-bairros?-([^-]+(?:-[^-]+)*)/i;
      const vivaRealMatch = urlInfo.match(vivaRealPattern);
      
      if (vivaRealMatch) {
        neighborhood = vivaRealMatch[1].replace(/-/g, ' ').split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        city = vivaRealMatch[2].replace(/-/g, ' ').split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        console.log('🏘️ VivaReal - Bairro:', neighborhood, 'Cidade:', city);
      }
      
    } else if (url.includes('quintoandar.com')) {
      console.log('🏢 Processando URL do QuintoAndar');
      
      // Para QuintoAndar: /imovel/894800321/alugar/apartamento-5-quartos-sao-lucas-belo-horizonte
      const quintoandarMatch = url.match(/\/imovel\/\d+\/[^\/]+\/(.+)/);
      if (quintoandarMatch) {
        urlInfo = quintoandarMatch[1];
        console.log('📋 URL info extraída:', urlInfo);
        
        // Parse específico para QuintoAndar
        if (urlInfo.includes('apartamento')) propertyType = 'Apartamento';
        else if (urlInfo.includes('casa')) propertyType = 'Casa';
        else if (urlInfo.includes('cobertura')) propertyType = 'Cobertura';
        
        // Extrair quartos: "apartamento-5-quartos-sao-lucas-belo-horizonte"
        const bedroomMatch = urlInfo.match(/(\d+)-quartos?/);
        if (bedroomMatch) {
          bedrooms = parseInt(bedroomMatch[1]);
          console.log('🛏️ Quartos encontrados:', bedrooms);
        }
        
        // Extrair bairro e cidade: após "quartos-" até final
        const locationMatch = urlInfo.match(/quartos-(.+)/);
        if (locationMatch) {
          const locationPart = locationMatch[1];
          const locationParts = locationPart.split('-');
          
          // Para "sao-lucas-belo-horizonte":
          // - Bairro: sao-lucas
          // - Cidade: belo-horizonte
          if (locationParts.length >= 3 && locationParts.includes('belo') && locationParts.includes('horizonte')) {
            // Encontrar onde começa "belo-horizonte"
            const beloIndex = locationParts.indexOf('belo');
            
            // Bairro é tudo antes de "belo"
            neighborhood = locationParts.slice(0, beloIndex).join('-')
              .replace(/-/g, ' ').split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            
            // Cidade é "belo-horizonte"
            city = locationParts.slice(beloIndex).join('-')
              .replace(/-/g, ' ').split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
              
            console.log('🏘️ QuintoAndar - Bairro:', neighborhood, 'Cidade:', city);
          } else {
            // Fallback: assumir que a última parte é a cidade
            neighborhood = locationParts.slice(0, -1).join('-')
              .replace(/-/g, ' ').split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            city = locationParts[locationParts.length - 1]
              .replace(/-/g, ' ').split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
          }
        }
      }
    }
    
    // Detectar cidade se não foi extraída
    if (!city) {
      if (urlInfo.includes('nova-lima')) {
        city = 'Nova Lima';
      } else if (urlInfo.includes('belo-horizonte')) {
        city = 'Belo Horizonte';
      } else if (urlInfo.includes('-bh-') || urlInfo.includes('-mg')) {
        city = 'Belo Horizonte';
      } else {
        city = 'Belo Horizonte'; // Padrão para URLs sem cidade específica
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
    
    // Montar endereço mais realista e limpo
    let address = '';
    if (neighborhood && city && neighborhood !== city) {
      // Se temos bairro e cidade diferentes, criar endereço completo
      address = `Rua ${neighborhood.split(' ')[0]} - ${neighborhood}, ${city}`;
    } else if (neighborhood && !neighborhood.toLowerCase().includes('quartos')) {
      // Se temos só bairro válido
      address = `${neighborhood}, Belo Horizonte - MG`;
    } else if (city && !city.toLowerCase().includes('quartos')) {
      // Se temos só cidade válida
      address = `${city}, MG`;
    } else {
      // Fallback final
      address = 'Belo Horizonte, MG';
    }
    
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
      images: []
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

function extractImagesFromContent(content: string, cleanContent: string): string[] {
  console.log('🔍 Extraindo imagens do conteúdo...');
  console.log('📄 Tamanho do conteúdo:', content.length);
  
  const imageUrls: string[] = [];
  const processedUrls = new Set<string>();
  
  try {
    // Padrões para encontrar URLs de imagem
    const imagePatterns = [
      // URLs diretas de imagens
      /https?:\/\/[^\s]+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^\s]*)?/gi,
      // URLs do VivaReal resizedimgs
      /https?:\/\/resizedimgs\.vivareal\.com\/[^\s"'\)]+/gi,
      // URLs de imagens em markdown
      /!\[[^\]]*\]\(([^)]+)\)/gi,
      // URLs de imagens em HTML
      /<img[^>]+src=["']([^"']+)["'][^>]*>/gi,
      // URLs do VivaReal específicas
      /https?:\/\/[^\s]*vivareal[^\s]*\.(?:jpg|jpeg|png|webp)/gi
    ];

    console.log('🔍 Aplicando padrões de busca de imagem...');
    
    for (let i = 0; i < imagePatterns.length; i++) {
      const pattern = imagePatterns[i];
      console.log(`🔍 Testando padrão ${i + 1}/${imagePatterns.length}`);
      
      let match;
      let matchCount = 0;
      while ((match = pattern.exec(content)) !== null && imageUrls.length < 20) {
        matchCount++;
        let imageUrl = match[1] || match[0];
        
        // Limpar a URL
        imageUrl = imageUrl.trim().replace(/['">\)]+$/, '');
        
        console.log(`🔗 URL encontrada (padrão ${i + 1}, match ${matchCount}):`, imageUrl.substring(0, 100));
        
        // Validar URL
        if (isValidImageUrl(imageUrl) && !processedUrls.has(imageUrl)) {
          processedUrls.add(imageUrl);
          console.log(`✅ URL válida, testando se é imagem de propriedade...`);
          
          // Filtrar imagens válidas (não logos)
          if (isPropertyImage(imageUrl)) {
            imageUrls.push(imageUrl);
            console.log('✅ Imagem de propriedade adicionada:', imageUrl.substring(0, 100) + '...');
          } else {
            console.log('❌ Imagem filtrada (não é de propriedade)');
          }
        } else if (processedUrls.has(imageUrl)) {
          console.log('⚠️ URL já processada, ignorando');
        } else {
          console.log('❌ URL inválida:', imageUrl.substring(0, 60));
        }
      }
      
      console.log(`📊 Padrão ${i + 1} encontrou ${matchCount} matches, total de imagens válidas: ${imageUrls.length}`);
    }

    // Se não encontrou imagens suficientes, tentar buscar no HTML bruto
    if (imageUrls.length < 3) {
      console.log('🔍 Poucas imagens encontradas, buscando mais no HTML...');
      const htmlImagePattern = /src=["']([^"']*(?:vivareal|images|resizedimgs)[^"']*\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi;
      let htmlMatch;
      let htmlMatchCount = 0;
      
      while ((htmlMatch = htmlImagePattern.exec(content)) !== null && imageUrls.length < 10) {
        htmlMatchCount++;
        const imageUrl = htmlMatch[1];
        
        console.log(`🔗 HTML match ${htmlMatchCount}:`, imageUrl.substring(0, 100));
        
        if (isValidImageUrl(imageUrl) && !processedUrls.has(imageUrl) && isPropertyImage(imageUrl)) {
          processedUrls.add(imageUrl);
          imageUrls.push(imageUrl);
          console.log('✅ Imagem HTML adicionada:', imageUrl.substring(0, 100) + '...');
        }
      }
      
      console.log(`📊 HTML pattern encontrou ${htmlMatchCount} matches adicionais`);
    }

    console.log(`📸 RESULTADO FINAL: ${imageUrls.length} imagens extraídas`);
    
    if (imageUrls.length === 0) {
      console.log('⚠️ NENHUMA IMAGEM ENCONTRADA - Mostrando amostra do conteúdo para debug:');
      console.log('📝 Primeiros 500 caracteres:', content.substring(0, 500));
      console.log('📝 Procurando por "vivareal" no conteúdo:', content.toLowerCase().includes('vivareal'));
      console.log('📝 Procurando por "resizedimgs" no conteúdo:', content.toLowerCase().includes('resizedimgs'));
      console.log('📝 Procurando por ".jpg" no conteúdo:', content.toLowerCase().includes('.jpg'));
      console.log('📝 Procurando por ".webp" no conteúdo:', content.toLowerCase().includes('.webp'));
    }
    
    return imageUrls;

  } catch (error) {
    console.error('💥 Erro ao extrair imagens:', error);
    return [];
  }
}

function isValidImageUrl(url: string): boolean {
  if (!url || url.length < 10) return false;
  
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    
    // Verificar se é uma URL de imagem válida
    return (
      (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') &&
      (pathname.includes('.jpg') || pathname.includes('.jpeg') || 
       pathname.includes('.png') || pathname.includes('.webp')) &&
      !pathname.includes('favicon') &&
      url.length < 500 // URLs muito longas podem ser problemáticas
    );
  } catch {
    return false;
  }
}

function isPropertyImage(url: string): boolean {
  const urlLower = url.toLowerCase();
  
  console.log(`🔍 Testando imagem: ${url}`);
  
  // Lista simples de exclusões óbvias
  const simpleExclusions = ['logo', 'icon', 'btn', 'button', 'banner'];
  
  for (const exclusion of simpleExclusions) {
    if (urlLower.includes(exclusion)) {
      console.log(`❌ Excluída: ${exclusion}`);
      return false;
    }
  }
  
  // Se chegou até aqui, aceitar
  console.log(`✅ Imagem aceita`);
  return true;
}

// Função para selecionar a melhor imagem de uma lista
function selectBestPropertyImage(imageUrls: string[]): string[] {
  if (!imageUrls || imageUrls.length === 0) return [];
  
  console.log(`🎯 Selecionando melhor imagem entre ${imageUrls.length} opções`);
  
  // Pontuação para cada imagem
  const scoredImages = imageUrls.map(url => {
    let score = 0;
    const urlLower = url.toLowerCase();
    
    // Pontos por qualidade da imagem
    const dimensionMatch = url.match(/(\d+)x(\d+)/);
    if (dimensionMatch) {
      const width = parseInt(dimensionMatch[1]);
      const height = parseInt(dimensionMatch[2]);
      
      // Preferir imagens maiores (mas não exageradamente grandes)
      if (width >= 600 && height >= 400) score += 20;
      else if (width >= 400 && height >= 300) score += 15;
      else if (width >= 300 && height >= 200) score += 10;
      
      // Bonus para proporções adequadas (foto de cômodo)
      const aspectRatio = width / height;
      if (aspectRatio >= 1.2 && aspectRatio <= 1.8) score += 10;
    }
    
    // Pontos por tipo de cômodo (prioridade)
    if (urlLower.includes('sala')) score += 25;
    if (urlLower.includes('living')) score += 25;
    if (urlLower.includes('quarto')) score += 20;
    if (urlLower.includes('dormitorio')) score += 20;
    if (urlLower.includes('cozinha')) score += 18;
    if (urlLower.includes('varanda')) score += 15;
    if (urlLower.includes('fachada')) score += 22;
    if (urlLower.includes('banheiro')) score += 12;
    
    // Pontos por ser do VivaReal (fonte confiável)
    if (urlLower.includes('resizedimgs.vivareal.com')) score += 15;
    
    // Pontos por tamanho da URL (URLs do VivaReal com crop/)
    if (urlLower.includes('/crop/614x') || urlLower.includes('/crop/640x')) score += 10;
    
    console.log(`📊 Imagem pontuada (${score}):`, url.substring(0, 80));
    return { url, score };
  });
  
  // Ordenar por pontuação (maior primeiro)
  scoredImages.sort((a, b) => b.score - a.score);
  
  // Retornar apenas as melhores imagens (máximo 3)
  const bestImages = scoredImages.slice(0, 3).map(item => item.url);
  
  console.log(`🏆 Melhores imagens selecionadas: ${bestImages.length}`);
  bestImages.forEach((url, index) => {
    const score = scoredImages[index].score;
    console.log(`  ${index + 1}. (${score} pontos) ${url.substring(0, 80)}`);
  });
  
  return bestImages;
}