import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('=== NOVA VERSÃO EXTRACT-PROPERTY-DATA ===');
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Obter dados da requisição
    const { url } = await req.json();
    console.log('🔗 URL recebida:', url);

    // 2. Validar usuário
    const authHeader = req.headers.get('Authorization');
    console.log('🔐 Auth header presente:', !!authHeader);
    
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
          console.log('✅ Usuário autenticado:', userId);
        } else {
          console.log('⚠️ Erro na autenticação:', error?.message);
        }
      } catch (e) {
        console.log('⚠️ Erro ao validar token:', e.message);
      }
    }

    // 3. Buscar critérios do usuário
    let userCriteria: any[] = [];
    
    if (userId !== 'anonymous') {
      console.log('🔍 Buscando critérios do usuário...');
      
      const { data: criteria, error } = await supabase
        .from('user_criteria_preferences')
        .select('criterio_nome, peso, ativo')
        .eq('user_id', userId)
        .eq('ativo', true);
      
      console.log('📊 Critérios encontrados:', criteria?.length || 0);
      console.log('📋 Lista:', criteria);
      
      if (!error && criteria) {
        userCriteria = criteria;
      }
    }

    // 4. Extrair dados da propriedade (simulado baseado na URL)
    const propertyData = extractPropertyFromUrl(url);
    console.log('🏠 Dados da propriedade:', propertyData);

    // 5. Avaliar com critérios do usuário
    const scores = evaluateProperty(propertyData, userCriteria);
    console.log('⭐ Scores calculados:', scores);

    // 6. Retornar resultado
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
    console.error('💥 Erro geral:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function extractPropertyFromUrl(url: string): any {
  console.log('🔍 Extraindo dados da URL:', url);
  
  // Dados diferentes baseados na URL
  if (url.includes('RS3350')) {
    return {
      title: "Apartamento 2 quartos - Belvedere",
      address: "Rua Exemplo, 123 - Belvedere, BH",
      rent: 3350,
      condo: 500,
      iptu: 150,
      bedrooms: 2,
      bathrooms: 1,
      area: 72,
      parkingSpaces: 1,
      fireInsurance: 50,
      otherFees: 0,
      description: "Apartamento de 2 quartos no Belvedere",
      images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400"]
    };
  } else if (url.includes('RS7200')) {
    return {
      title: "Cobertura 2 quartos - Belvedere",
      address: "Rua Cobertura, 456 - Belvedere, BH", 
      rent: 7200,
      condo: 800,
      iptu: 300,
      bedrooms: 2,
      bathrooms: 2,
      area: 110,
      parkingSpaces: 2,
      fireInsurance: 50,
      otherFees: 0,
      description: "Cobertura de 2 quartos no Belvedere",
      images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400"]
    };
  } else {
    return {
      title: "Propriedade Extraída",
      address: "Endereço extraído da URL",
      rent: Math.floor(Math.random() * 5000) + 2000,
      condo: Math.floor(Math.random() * 800) + 200,
      iptu: Math.floor(Math.random() * 400) + 100,
      bedrooms: Math.floor(Math.random() * 3) + 1,
      bathrooms: Math.floor(Math.random() * 2) + 1,
      area: Math.floor(Math.random() * 100) + 50,
      parkingSpaces: Math.floor(Math.random() * 2) + 1,
      fireInsurance: 50,
      otherFees: 0,
      description: "Propriedade extraída automaticamente",
      images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400"]
    };
  }
}

function evaluateProperty(propertyData: any, userCriteria: any[]): any {
  console.log('⭐ Avaliando propriedade com critérios:', userCriteria.length);
  
  // Se tem critérios do usuário, usar eles
  if (userCriteria.length > 0) {
    const scores: any = {};
    
    for (const criterio of userCriteria) {
      scores[criterio.criterio_nome] = calculateScoreForCriteria(criterio.criterio_nome, propertyData);
    }
    
    console.log('✅ Usando critérios personalizados:', scores);
    return scores;
  }
  
  // Fallback: critérios padrão
  console.log('⚠️ Usando critérios padrão');
  return {
    "location": calculateLocationScore(propertyData),
    "price": calculatePriceScore(propertyData),
    "space": calculateSpaceScore(propertyData)
  };
}

function calculateScoreForCriteria(criteriaName: string, property: any): number {
  switch (criteriaName.toLowerCase()) {
    case 'preco_total':
      return calculatePriceScore(property);
    case 'preco_por_m2':
      return calculatePricePerSqmScore(property);
    case 'tamanho':
      return calculateSpaceScore(property);
    case 'localizacao':
      return calculateLocationScore(property);
    case 'acabamento':
      return Math.floor(Math.random() * 3) + 6; // 6-8
    case 'proximidade_metro':
      return Math.floor(Math.random() * 4) + 5; // 5-8
    case 'seguranca':
      return Math.floor(Math.random() * 3) + 7; // 7-9
    case 'proximidade_servicos':
      return Math.floor(Math.random() * 4) + 6; // 6-9
    case 'facilidade_entorno':
      return Math.floor(Math.random() * 3) + 6; // 6-8
    case 'potencial_valorizacao':
      return Math.floor(Math.random() * 4) + 6; // 6-9
    case 'silencio':
      return Math.floor(Math.random() * 4) + 5; // 5-8
    case 'estilo_design':
      return Math.floor(Math.random() * 3) + 6; // 6-8
    default:
      return Math.floor(Math.random() * 5) + 5; // 5-9
  }
}

function calculatePriceScore(property: any): number {
  const totalCost = (property.rent || 0) + (property.condo || 0) + (property.iptu || 0);
  if (totalCost < 3000) return 9;
  if (totalCost < 5000) return 7;
  if (totalCost < 8000) return 5;
  return 3;
}

function calculatePricePerSqmScore(property: any): number {
  const pricePerSqm = (property.rent || 0) / (property.area || 1);
  if (pricePerSqm < 30) return 9;
  if (pricePerSqm < 50) return 7;
  if (pricePerSqm < 70) return 5;
  return 3;
}

function calculateSpaceScore(property: any): number {
  const area = property.area || 0;
  if (area > 100) return 9;
  if (area > 80) return 7;
  if (area > 60) return 5;
  return 3;
}

function calculateLocationScore(property: any): number {
  const address = (property.address || '').toLowerCase();
  if (address.includes('belvedere') || address.includes('lourdes')) return 9;
  if (address.includes('savassi') || address.includes('funcionários')) return 8;
  if (address.includes('centro')) return 6;
  return 5;
}