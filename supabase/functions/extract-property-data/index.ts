
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from './corsHeaders.ts'
import { authenticateUser } from './authService.ts'
import { extractDataWithFirecrawl } from './firecrawlService.ts'
import { processExtractedData } from './dataProcessor.ts'
import { extractImagesFromContent } from './imageExtractor.ts'

serve(async (req) => {
  console.log('=== INÍCIO DA EDGE FUNCTION ===');
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Autenticação do usuário
    console.log('Autenticando usuário...');
    const { userId } = await authenticateUser(req);
    console.log('Usuário autenticado:', userId);

    // Extrair URL do body
    const { url } = await req.json();
    console.log('URL recebida:', url);

    if (!url) {
      throw new Error('URL é obrigatória');
    }

    // Extrair dados com Firecrawl
    console.log('Iniciando extração com Firecrawl...');
    const extractedContent = await extractDataWithFirecrawl(url);
    console.log('Conteúdo extraído com Firecrawl');

    // Processar dados extraídos
    console.log('Processando dados extraídos...');
    const cleanedData = await processExtractedData(extractedContent, url);
    console.log('Dados processados:', cleanedData);

    // Extrair imagens do conteúdo
    console.log('Extraindo imagens...');
    const extractedImages = await extractImagesFromContent(extractedContent);
    console.log('Imagens extraídas:', extractedImages?.length || 0);

    // REMOVIDO: Não salvar mais no banco de dados automaticamente
    // Apenas retornar os dados para preenchimento do formulário
    
    console.log('Retornando dados para preenchimento do formulário...');
    
    const responseData = {
      ...cleanedData,
      images: extractedImages || [],
      // Converter snake_case para camelCase para compatibilidade com o frontend
      parkingSpaces: cleanedData.parking_spaces || 0,
      fireInsurance: cleanedData.fire_insurance || 50,
      otherFees: cleanedData.other_fees || 0
    };

    console.log('Dados finais sendo retornados:', responseData);
    console.log('=== FIM DA EDGE FUNCTION ===');

    return new Response(
      JSON.stringify({
        success: true,
        data: responseData,
        message: 'Dados extraídos com sucesso para preenchimento do formulário'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Erro na edge function:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro interno do servidor',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
