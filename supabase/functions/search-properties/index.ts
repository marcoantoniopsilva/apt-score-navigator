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
    console.log('=== SEARCH PROPERTIES START ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    
    const body = await req.json();
    console.log('Request body:', body);

    // Resposta de teste simples
    const testResponse = {
      success: true,
      urls: [
        "https://www.olx.com.br/imoveis/aluguel/estado-mg/belo-horizonte/apartamento-test-1",
        "https://www.olx.com.br/imoveis/aluguel/estado-mg/belo-horizonte/apartamento-test-2"
      ],
      searchQuery: body.searchQuery || 'imóveis para alugar',
      userPreferences: {}
    };

    console.log('Returning test response:', testResponse);

    return new Response(JSON.stringify(testResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in search-properties:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});