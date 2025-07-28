import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('=== FUNÇÃO DE TESTE INICIADA ===');
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Processando requisição de teste...');
    
    const { url } = await req.json();
    console.log('URL recebida:', url);

    // Simular dados extraídos de teste
    const testData = {
      title: "Apartamento de Teste",
      description: "Apartamento extraído via função de teste",
      price: 2500,
      address: "Rua de Teste, 123 - Bairro Teste",
      bedrooms: 3,
      bathrooms: 2,
      area: 85,
      parkingSpaces: 1,
      fireInsurance: 50,
      otherFees: 0,
      images: [
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400"
      ]
    };

    console.log('Dados de teste preparados:', testData);

    return new Response(JSON.stringify({
      success: true,
      data: testData,
      message: 'Dados extraídos com sucesso (função de teste)'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na função de teste:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro desconhecido',
      details: 'Erro na função de teste'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});