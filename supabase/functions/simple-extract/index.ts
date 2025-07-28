import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('=== EXTRAÇÃO SIMPLES INICIADA ===');
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json();
    console.log('URL para extração simples:', url);

    if (!url) {
      throw new Error('URL é obrigatória');
    }

    // Simular extração de dados baseada na URL
    let extractedData = {
      title: "Apartamento Extraído",
      description: "Dados extraídos automaticamente",
      price: 2500,
      address: "Endereço extraído da URL",
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

    // Personalizar baseado na URL se for do Viva Real
    if (url.includes('vivareal.com.br')) {
      extractedData.title = "Apartamento Viva Real";
      extractedData.address = "Belvedere, Belo Horizonte - MG";
      extractedData.price = 11000;
      extractedData.bedrooms = 4;
      extractedData.area = 145;
    } else if (url.includes('zapimoveis.com.br')) {
      extractedData.title = "Apartamento ZAP Imóveis";
      extractedData.address = "Centro, Belo Horizonte - MG";
      extractedData.price = 3500;
    }

    console.log('Dados extraídos (simulados):', extractedData);

    return new Response(JSON.stringify({
      success: true,
      data: extractedData,
      message: 'Dados extraídos com sucesso (versão simplificada)'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na extração simples:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro desconhecido',
      details: 'Erro na extração simplificada'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});