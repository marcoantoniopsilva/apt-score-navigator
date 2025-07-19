
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address, propertyId } = await req.json();
    
    if (!address) {
      return new Response(
        JSON.stringify({ error: 'Endereço é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Gerando resumo da localização para:', address);

    // Gerar resumo com ChatGPT
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
            content: `Você é um especialista em análise de localização urbana no Brasil. Analise a localização do imóvel e gere um resumo estruturado por tópicos, seguindo EXATAMENTE este formato:

🔒 **Segurança**
[Análise sobre criminalidade, policiamento, sensação de segurança]

🚌 **Acessibilidade**
[Informações sobre transporte público, metrô, ônibus, mobilidade urbana, ciclofaixas]

🛒 **Comércio e Serviços**
[Supermercados, farmácias, bancos, restaurantes, serviços essenciais próximos]

🎯 **Lazer e Entretenimento**
[Parques, praças, vida noturna, centros culturais, opções de lazer]

👥 **Perfil dos Moradores**
[Características da população local, faixa etária, perfil socioeconômico]

⚖️ **Considerações Gerais**
[Principais vantagens e pontos de atenção sobre morar na região]

Seja objetivo e equilibrado. Use no máximo 2-3 frases por tópico. Mantenha o formato exato com os emojis e títulos em negrito.`
          },
          {
            role: 'user',
            content: `Endereço: ${address}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro no OpenAI:', errorText);
      throw new Error('Falha ao gerar resumo com IA');
    }

    const aiResponse = await response.json();
    const summary = aiResponse.choices[0].message.content;

    console.log('Resumo gerado com sucesso');

    // Salvar no banco se tivermos as credenciais e propertyId
    if (supabaseUrl && supabaseServiceRoleKey && propertyId) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });

        const { error: updateError } = await supabase
          .from('properties')
          .update({ location_summary: summary })
          .eq('id', propertyId);

        if (updateError) {
          console.error('Erro ao salvar resumo no banco:', updateError);
          // Não falha a requisição, apenas loga o erro
        } else {
          console.log('Resumo salvo no banco de dados');
        }
      } catch (dbError) {
        console.error('Erro de conexão com banco:', dbError);
        // Não falha a requisição
      }
    }

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
