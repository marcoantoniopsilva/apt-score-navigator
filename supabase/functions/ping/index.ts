import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('=== FUNÇÃO BÁSICA INICIADA ===');
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Processando ping básico...');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Pong! Edge function está funcionando',
      timestamp: new Date().toISOString(),
      method: req.method
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na função básica:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro desconhecido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});