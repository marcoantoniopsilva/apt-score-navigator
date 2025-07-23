
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from './corsHeaders.ts'
import { validateUser } from './authService.ts'
import { scrapeWebsite } from './firecrawlService.ts'
import { processExtractedData } from './dataProcessor.ts'
import { extractImagesFromHTML, extractImagesFromMarkdown } from './imageExtractor.ts'

serve(async (req) => {
  console.log('=== INÍCIO DA EDGE FUNCTION ===');
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Autenticação do usuário
    console.log('Autenticando usuário...');
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const user = await validateUser(authHeader, supabaseUrl, supabaseServiceRoleKey);
    console.log('Usuário autenticado:', user.id);

    // Extrair URL do body
    const { url } = await req.json();
    console.log('URL recebida:', url);

    if (!url) {
      throw new Error('URL é obrigatória');
    }

    // Extrair dados com Firecrawl
    console.log('Iniciando extração com Firecrawl...');
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')!;
    const firecrawlResult = await scrapeWebsite(url, firecrawlApiKey);
    console.log('Conteúdo extraído com Firecrawl');

    // Processar dados extraídos
    console.log('Processando dados extraídos...');
    const extractedContent = firecrawlResult.data?.markdown || firecrawlResult.data?.content || '';
    const cleanedData = await processExtractedData(extractedContent);
    console.log('Dados processados:', cleanedData);

    // Extrair imagens do conteúdo
    console.log('Extraindo imagens...');
    const htmlContent = firecrawlResult.data?.html || '';
    const markdownContent = firecrawlResult.data?.markdown || '';
    const extractedImages = [
      ...extractImagesFromHTML(htmlContent),
      ...extractImagesFromMarkdown(markdownContent)
    ].slice(0, 10); // Limitar a 10 imagens
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
