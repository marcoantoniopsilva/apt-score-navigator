import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== SEARCH PROPERTIES FUNCTION START ===');
    console.log('Method:', req.method);
    console.log('Headers:', Object.fromEntries(req.headers.entries()));
    
    let body;
    try {
      body = await req.json();
      console.log('Request body parsed successfully:', body);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      throw new Error('Invalid JSON in request body');
    }

    const { searchQuery } = body;
    console.log('Search query:', searchQuery);

    // Retornar dados de teste primeiro para garantir que a função básica funciona
    const testResponse = {
      success: true,
      urls: [
        "https://www.olx.com.br/imoveis/aluguel/estado-mg/belo-horizonte/apartamento-3-quartos-santo-agostinho-123",
        "https://www.olx.com.br/imoveis/aluguel/estado-mg/belo-horizonte/apartamento-2-quartos-centro-456"
      ],
      searchQuery: searchQuery || 'imóveis para alugar',
      userPreferences: {
        regiaoReferencia: "Santo Agostinho, Belo Horizonte, MG",
        faixaPreco: "R$ 4.000 - R$ 6.000"
      }
    };

    console.log('Returning response:', testResponse);

    return new Response(JSON.stringify(testResponse), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== ERROR IN SEARCH PROPERTIES ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    const errorResponse = {
      success: false,
      error: error.message || 'Unknown error occurred'
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});