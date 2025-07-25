import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserPreferences {
  criteriosAtivos: Array<{
    criterio_nome: string;
    peso: number;
  }>;
  regiaoReferencia?: string;
  faixaPreco?: string;
  valorPrincipal?: string;
  intencao?: string;
}

interface PropertyData {
  title: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  rent: number;
  condo: number;
  iptu: number;
  [key: string]: any;
}

interface ScoreResult {
  scores: Record<string, number>;
  finalScore: number;
  explanation: string;
}

async function getUserPreferences(userId: string, supabaseUrl: string, supabaseServiceRoleKey: string): Promise<UserPreferences> {
  console.log('Buscando preferências do usuário:', userId);
  
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Buscar critérios ativos e pesos
  const { data: criterios, error: criteriosError } = await supabase
    .from('user_criteria_preferences')
    .select('criterio_nome, peso')
    .eq('user_id', userId)
    .eq('ativo', true);

  if (criteriosError) {
    console.error('Erro ao buscar critérios:', criteriosError);
  }

  // Buscar perfil do usuário
  const { data: perfil, error: perfilError } = await supabase
    .from('user_profiles')
    .select('regiao_referencia, faixa_preco, valor_principal, intencao')
    .eq('user_id', userId)
    .single();

  if (perfilError) {
    console.error('Erro ao buscar perfil:', perfilError);
  }

  console.log('Critérios encontrados:', criterios?.length || 0);
  console.log('Perfil encontrado:', !!perfil);

  return {
    criteriosAtivos: criterios || [],
    regiaoReferencia: perfil?.regiao_referencia,
    faixaPreco: perfil?.faixa_preco,
    valorPrincipal: perfil?.valor_principal,
    intencao: perfil?.intencao
  };
}

async function generatePropertyScores(
  propertyData: PropertyData,
  userPreferences: UserPreferences,
  openaiApiKey: string
): Promise<ScoreResult> {
  console.log('Gerando scores com IA para propriedade...');

  if (!userPreferences.criteriosAtivos || userPreferences.criteriosAtivos.length === 0) {
    console.log('Nenhum critério ativo encontrado');
    return {
      scores: {},
      finalScore: 5.0,
      explanation: 'Nenhum critério ativo configurado para avaliação'
    };
  }

  const isRental = userPreferences.intencao !== 'comprar';
  const transactionType = isRental ? 'aluguel' : 'compra';

  // Construir prompt específico para o contexto
  const prompt = `
Você é um especialista em avaliação de imóveis. Analise este imóvel para ${transactionType} e atribua notas de 0 a 10 para cada critério solicitado.

DADOS DO IMÓVEL:
- Título: ${propertyData.title}
- Endereço: ${propertyData.address}
- Quartos: ${propertyData.bedrooms}
- Banheiros: ${propertyData.bathrooms}
- Área: ${propertyData.area}m²
- ${isRental ? 'Aluguel' : 'Valor'}: R$ ${propertyData.rent}
- Condomínio: R$ ${propertyData.condo}
- IPTU: R$ ${propertyData.iptu}
- Total mensal: R$ ${propertyData.rent + propertyData.condo + propertyData.iptu}

PREFERÊNCIAS DO USUÁRIO:
- Região preferida: ${userPreferences.regiaoReferencia || 'Não especificada'}
- Faixa de preço: ${userPreferences.faixaPreco || 'Não especificada'}
- Tipo de transação: ${transactionType}

CRITÉRIOS PARA AVALIAR (notas de 0 a 10):
${userPreferences.criteriosAtivos.map(c => `- ${c.criterio_nome} (peso: ${c.peso})`).join('\n')}

INSTRUÇÕES:
1. Para cada critério, atribua uma nota de 0 a 10 baseada nos dados disponíveis
2. Considere o contexto do tipo de transação (${transactionType})
3. Compare com a região e faixa de preço preferidas quando relevante
4. Para critérios como "segurança" e "proximidade", use conhecimento geral sobre a localização
5. Para "potencial_valorizacao", considere a localização e características do imóvel
6. Se algum dado não estiver disponível, use uma estimativa razoável baseada nas informações fornecidas

FORMATO DA RESPOSTA (apenas JSON):
{
  "scores": {
    "criterio_nome": nota_0_a_10,
    ...
  },
  "explanation": "Breve explicação das principais considerações na avaliação"
}
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em avaliação de imóveis. Responda sempre em JSON válido.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log('Resposta da IA:', content);

    // Parse do JSON da resposta
    let aiResult;
    try {
      // Limpar a resposta removendo markdown code blocks se existirem
      let cleanContent = content.trim();
      
      // Se a resposta contém ```json, extrair apenas o conteúdo JSON
      const jsonMatch = cleanContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        cleanContent = jsonMatch[1].trim();
      }
      
      // Se ainda começa e termina com backticks, remover
      if (cleanContent.startsWith('```') && cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(3, -3).trim();
        if (cleanContent.startsWith('json')) {
          cleanContent = cleanContent.slice(4).trim();
        }
      }
      
      console.log('Conteúdo limpo para parse:', cleanContent);
      
      aiResult = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Erro ao fazer parse da resposta da IA:', parseError);
      // Fallback com scores padrão
      const defaultScores: Record<string, number> = {};
      userPreferences.criteriosAtivos.forEach(criterio => {
        defaultScores[criterio.criterio_nome] = 5.0;
      });
      
      return {
        scores: defaultScores,
        finalScore: 5.0,
        explanation: 'Avaliação automática (erro no processamento da IA)'
      };
    }

    // Validar e limitar scores entre 0 e 10
    const scores: Record<string, number> = {};
    userPreferences.criteriosAtivos.forEach(criterio => {
      const score = aiResult.scores[criterio.criterio_nome];
      if (typeof score === 'number' && score >= 0 && score <= 10) {
        scores[criterio.criterio_nome] = score;
      } else {
        scores[criterio.criterio_nome] = 5.0; // Score padrão se inválido
      }
    });

    // Calcular score final ponderado
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    userPreferences.criteriosAtivos.forEach(criterio => {
      const score = scores[criterio.criterio_nome] || 5.0;
      totalWeightedScore += score * criterio.peso;
      totalWeight += criterio.peso;
    });

    const finalScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 5.0;

    return {
      scores,
      finalScore: Math.round(finalScore * 10) / 10, // Arredondar para 1 casa decimal
      explanation: aiResult.explanation || 'Avaliação realizada com base nos critérios selecionados'
    };

  } catch (error) {
    console.error('Erro na geração de scores:', error);
    
    // Fallback com scores padrão
    const defaultScores: Record<string, number> = {};
    userPreferences.criteriosAtivos.forEach(criterio => {
      defaultScores[criterio.criterio_nome] = 5.0;
    });
    
    return {
      scores: defaultScores,
      finalScore: 5.0,
      explanation: 'Avaliação automática (erro na geração de scores)'
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== EVALUATE PROPERTY SCORES FUNCTION START ===');
    
    const { propertyData } = await req.json();
    
    if (!propertyData) {
      throw new Error('Property data is required');
    }

    // Obter informações do usuário autenticado
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    // Extrair o token JWT
    const token = authHeader.replace('Bearer ', '');
    
    // Verificar o token e obter o user ID
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;
    
    // Decodificar o JWT para obter o user ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub;
    
    console.log('User ID:', userId);

    // Buscar preferências do usuário
    const userPreferences = await getUserPreferences(userId, supabaseUrl, supabaseServiceRoleKey);
    console.log('User preferences:', userPreferences);

    // Gerar scores usando IA
    const scoreResult = await generatePropertyScores(propertyData, userPreferences, openaiApiKey);

    const response = {
      success: true,
      scores: scoreResult.scores,
      finalScore: scoreResult.finalScore,
      explanation: scoreResult.explanation,
      userPreferences
    };

    console.log('Returning evaluation result:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== ERROR IN EVALUATE PROPERTY SCORES ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      scores: {},
      finalScore: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});