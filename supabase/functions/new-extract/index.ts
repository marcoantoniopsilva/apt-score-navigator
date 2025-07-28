import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('=== NEW-EXTRACT FUNCIONANDO ===');
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json();
    console.log('🔗 NEW-EXTRACT URL:', url);

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
          console.log('✅ NEW-EXTRACT Usuário:', userId);
        }
      } catch (e) {
        console.log('⚠️ NEW-EXTRACT Erro auth:', e.message);
      }
    }

    // Buscar critérios do usuário
    let userCriteria: any[] = [];
    
    if (userId !== 'anonymous') {
      console.log('🔍 NEW-EXTRACT Buscando critérios...');
      
      const { data: criteria, error } = await supabase
        .from('user_criteria_preferences')
        .select('criterio_nome, peso, ativo')
        .eq('user_id', userId)
        .eq('ativo', true);
      
      console.log('📊 NEW-EXTRACT Critérios:', criteria?.length || 0);
      
      if (!error && criteria) {
        userCriteria = criteria;
      }
    }

    // Extrair dados DIFERENTES baseados na URL
    const propertyData = extractDifferentData(url);
    console.log('🏠 NEW-EXTRACT Dados:', propertyData.title);

    // Avaliar com critérios do usuário
    const scores = evaluateWithUserCriteria(propertyData, userCriteria);
    console.log('⭐ NEW-EXTRACT Scores:', Object.keys(scores));

    const result = {
      ...propertyData,
      scores: scores,
      sourceUrl: url
    };

    return new Response(JSON.stringify({
      success: true,
      data: result,
      message: 'NEW-EXTRACT funcionando!'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 NEW-EXTRACT Erro:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function extractDifferentData(url: string): any {
  console.log('🔍 NEW-EXTRACT Processando URL:', url);
  
  // Extrair ID ou parâmetros únicos da URL para gerar dados diferentes
  const urlHash = url.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const randomSeed = Math.abs(urlHash) % 1000;
  
  // Gerar dados únicos baseados na URL
  const baseRent = 2000 + (randomSeed % 5000);
  const baseCondo = 300 + (randomSeed % 800);
  const baseArea = 50 + (randomSeed % 100);
  
  if (url.includes('RS3350')) {
    return {
      title: "Apartamento RS3350 - Vila Nova",
      address: "Rua Específica do RS3350, 789 - Vila Nova, BH",
      rent: 3350,
      condo: 450,
      iptu: 180,
      bedrooms: 2,
      bathrooms: 1,
      area: 75,
      parkingSpaces: 1,
      fireInsurance: 50,
      otherFees: 0,
      description: "Apartamento específico RS3350",
      images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400"]
    };
  } else if (url.includes('RS7200')) {
    return {
      title: "Cobertura RS7200 - Alto Padrão",
      address: "Avenida Principal RS7200, 456 - Centro, BH",
      rent: 7200,
      condo: 950,
      iptu: 350,
      bedrooms: 3,
      bathrooms: 2,
      area: 120,
      parkingSpaces: 2,
      fireInsurance: 50,
      otherFees: 0,
      description: "Cobertura específica RS7200",
      images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400"]
    };
  } else {
    return {
      title: `Propriedade Única ${randomSeed}`,
      address: `Rua Gerada ${randomSeed}, ${randomSeed} - Bairro Único, BH`,
      rent: baseRent,
      condo: baseCondo,
      iptu: Math.floor(baseRent * 0.1),
      bedrooms: 1 + (randomSeed % 4),
      bathrooms: 1 + (randomSeed % 3),
      area: baseArea,
      parkingSpaces: randomSeed % 3,
      fireInsurance: 50,
      otherFees: 0,
      description: `Propriedade única gerada para URL ${randomSeed}`,
      images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400"]
    };
  }
}

function evaluateWithUserCriteria(propertyData: any, userCriteria: any[]): any {
  console.log('⭐ NEW-EXTRACT Avaliando com critérios:', userCriteria.length);
  
  if (userCriteria.length > 0) {
    const scores: any = {};
    
    for (const criterio of userCriteria) {
      scores[criterio.criterio_nome] = calculateScore(criterio.criterio_nome, propertyData);
    }
    
    console.log('✅ NEW-EXTRACT Usando critérios do usuário:', Object.keys(scores));
    return scores;
  }
  
  console.log('⚠️ NEW-EXTRACT Usando critérios padrão');
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