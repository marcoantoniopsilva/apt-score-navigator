import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('=== TEST FUNCTION STARTED ===');

serve(async (req) => {
  console.log('=== TEST REQUEST RECEIVED ===', req.method, new Date().toISOString());
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Request body:', body);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Função de teste funcionando!',
        received: body 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Test error:', error);
    return new Response(
      JSON.stringify({ error: 'Test error: ' + error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});