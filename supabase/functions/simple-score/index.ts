import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('=== AVALIAÇÃO IA SIMPLES INICIADA ===');
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { propertyData } = await req.json();
    console.log('Dados da propriedade para avaliação:', propertyData);

    if (!propertyData) {
      throw new Error('Dados da propriedade são obrigatórios');
    }

    // Simular avaliação inteligente baseada nos dados
    const scores = {
      "Localização": calculateLocationScore(propertyData),
      "Espaço Interno": calculateSpaceScore(propertyData),
      "Mobilidade": calculateMobilityScore(propertyData),
      "Acessibilidade": calculateAccessibilityScore(propertyData),
      "Segurança": Math.floor(Math.random() * 3) + 7, // 7-9
      "Custo-Benefício": calculateCostBenefitScore(propertyData)
    };

    console.log('Scores calculados:', scores);

    return new Response(JSON.stringify({
      success: true,
      scores: scores,
      message: 'Avaliação IA concluída'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na avaliação IA:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro desconhecido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function calculateLocationScore(property: any): number {
  // Avaliação baseada no bairro
  if (property.address?.includes('Belvedere')) return 9;
  if (property.address?.includes('Savassi')) return 8;
  if (property.address?.includes('Centro')) return 6;
  return Math.floor(Math.random() * 3) + 6; // 6-8
}

function calculateSpaceScore(property: any): number {
  const area = property.area || 0;
  const bedrooms = property.bedrooms || 0;
  
  // Avaliação baseada na área e quartos
  if (area > 120 && bedrooms >= 3) return 9;
  if (area > 80 && bedrooms >= 2) return 7;
  if (area > 50) return 6;
  return 5;
}

function calculateMobilityScore(property: any): number {
  const parking = property.parkingSpaces || 0;
  
  // Avaliação baseada nas vagas e localização
  if (parking >= 2) return 8;
  if (parking >= 1) return 7;
  if (property.address?.includes('Centro')) return 8; // Centro tem transporte público
  return 5;
}

function calculateAccessibilityScore(property: any): number {
  // Avaliação baseada no andar (se disponível)
  if (property.floor && property.floor.includes('térreo')) return 9;
  return Math.floor(Math.random() * 4) + 5; // 5-8
}

function calculateCostBenefitScore(property: any): number {
  const rent = property.rent || 0;
  const area = property.area || 1;
  const pricePerSqm = rent / area;
  
  // Avaliação baseada no preço por m²
  if (pricePerSqm < 30) return 9;
  if (pricePerSqm < 50) return 8;
  if (pricePerSqm < 80) return 6;
  return 4;
}