
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from './corsHeaders.ts';
import { scrapeWebsite } from './firecrawlService.ts';
import { extractDataWithAI } from './openaiService.ts';
import { extractImagesFromHTML, extractImagesFromMarkdown } from './imageExtractor.ts';
import { processExtractedData } from './dataProcessor.ts';
import { generateScoreSuggestions } from './scoreAnalyzer.ts';

console.log('=== FUNCTION STARTED ===');

serve(async (req) => {
  console.log('=== REQUEST RECEIVED ===', req.method, new Date().toISOString());
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('authorization');
    console.log('=== INÍCIO DA EXTRAÇÃO ===');
    console.log('URL:', url);

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!firecrawlApiKey || !openaiApiKey || !supabaseUrl || !supabaseServiceRoleKey) {
      console.error('API keys faltando:', {
        firecrawl: !!firecrawlApiKey,
        openai: !!openaiApiKey,
        supabase: !!supabaseUrl,
        serviceRole: !!supabaseServiceRoleKey
      });
      return new Response(
        JSON.stringify({ error: 'Configuração de API incompleta. Tente novamente em alguns minutos.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar usuário usando autenticação integrada
    console.log('Validando usuário...');
    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    if (!authHeader) {
      console.error('Token de autorização ausente');
      return new Response(
        JSON.stringify({ error: 'Token de autorização é obrigatório' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Erro de autenticação:', authError);
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Usuário validado:', user.id);

    // Fazer scraping do site com timeout aumentado e retry
    console.log('Iniciando scraping...');
    let scrapedData;
    
    try {
      // Timeout de 60 segundos para scraping
      const scrapingPromise = scrapeWebsite(url, firecrawlApiKey);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout no scraping após 60 segundos')), 60000);
      });
      
      scrapedData = await Promise.race([scrapingPromise, timeoutPromise]);
      
      console.log('Scraping concluído. Dados disponíveis:', {
        hasMarkdown: !!scrapedData.data?.markdown,
        hasContent: !!scrapedData.data?.content,
        hasHtml: !!scrapedData.data?.html,
        hasExtract: !!scrapedData.data?.extract,
        htmlLength: scrapedData.data?.html?.length || 0,
        markdownLength: scrapedData.data?.markdown?.length || 0
      });
    } catch (scrapingError) {
      console.error('Erro no scraping:', scrapingError);
      
      // Retornar erro mais amigável para problemas de scraping
      let errorMessage = 'Não foi possível extrair dados do site. ';
      
      if (scrapingError.message.includes('timeout') || scrapingError.message.includes('Timeout')) {
        errorMessage += 'O site demorou muito para responder. Tente novamente em alguns minutos.';
      } else if (scrapingError.message.includes('502') || scrapingError.message.includes('503')) {
        errorMessage += 'O site está temporariamente indisponível. Tente novamente.';
      } else if (scrapingError.message.includes('404')) {
        errorMessage += 'A URL não foi encontrada. Verifique se o link está correto.';
      } else {
        errorMessage += 'Verifique se a URL está correta e tente novamente.';
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair imagens (tentar HTML primeiro, depois Markdown)
    let extractedImages: string[] = [];
    
    if (scrapedData.data?.html && scrapedData.data.html.length > 0) {
      console.log('Extraindo imagens do HTML...');
      extractedImages = extractImagesFromHTML(scrapedData.data.html);
      console.log('Imagens extraídas do HTML:', extractedImages.length);
    } else if (scrapedData.data?.markdown && scrapedData.data.markdown.length > 0) {
      console.log('HTML não disponível, extraindo imagens do Markdown...');
      extractedImages = extractImagesFromMarkdown(scrapedData.data.markdown);
      console.log('Imagens extraídas do Markdown:', extractedImages.length);
    } else {
      console.log('Nenhum conteúdo disponível para extração de imagens');
    }

    // Extrair dados estruturados com IA
    console.log('Extraindo dados com IA...');
    const contentForAI = scrapedData.data?.markdown || scrapedData.data?.content || scrapedData.data?.html || '';
    
    if (!contentForAI || contentForAI.length < 50) {
      return new Response(
        JSON.stringify({ 
          error: 'Não foi possível extrair conteúdo suficiente do site. O site pode estar bloqueando o acesso automatizado ou ter pouco conteúdo textual.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    let extractedText;
    try {
      // Timeout de 30 segundos para OpenAI
      const aiPromise = extractDataWithAI(contentForAI, openaiApiKey);
      const aiTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout na análise com IA')), 30000);
      });
      
      extractedText = await Promise.race([aiPromise, aiTimeoutPromise]);
      console.log('Dados extraídos pela IA:', extractedText.substring(0, 200) + '...');
    } catch (aiError) {
      console.error('Erro na extração com IA:', aiError);
      return new Response(
        JSON.stringify({ 
          error: 'Erro na análise automática do conteúdo. Tente novamente.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Processar e limpar os dados extraídos
    console.log('Processando dados extraídos...');
    let cleanedData;
    try {
      cleanedData = processExtractedData(extractedText);
      console.log('Dados processados:', cleanedData);
    } catch (processingError) {
      console.error('Erro no processamento:', processingError);
      return new Response(
        JSON.stringify({ 
          error: 'Erro no processamento dos dados extraídos. Tente novamente.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar perfil do usuário para gerar sugestões de scores
    console.log('Buscando perfil do usuário para análise...');
    let userProfile = null;
    let suggestedScores = {};
    
    try {
      const { data: profile } = await supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profile) {
        userProfile = profile;
        console.log('Perfil encontrado:', profile.profile_type);
        
        // Gerar sugestões de scores baseado no perfil
        console.log('Gerando sugestões de scores...');
        try {
          suggestedScores = await generateScoreSuggestions(
            contentForAI,
            cleanedData,
            profile,
            openaiApiKey
          );
          
          console.log('Sugestões geradas:', suggestedScores);
        } catch (scoreError) {
          console.error('Erro ao gerar scores:', scoreError);
          // Continuar sem sugestões se houver erro
        }
      } else {
        console.log('Perfil do usuário não encontrado, usando scores padrão');
      }
    } catch (profileError) {
      console.error('Erro ao buscar perfil:', profileError);
      // Continuar sem sugestões se não conseguir buscar o perfil
    }

    // Retornar dados para o formulário
    console.log('Dados extraídos, retornando para o formulário...');

    const responseData = {
      success: true, 
      data: {
        ...cleanedData,
        parkingSpaces: cleanedData.parking_spaces,
        images: extractedImages,
        scores: suggestedScores
      },
      message: `Dados extraídos com sucesso! ${extractedImages.length > 0 ? `${extractedImages.length} imagem(ns) encontrada(s).` : 'Nenhuma imagem encontrada.'}${Object.keys(suggestedScores).length > 0 ? ' Sugestões de avaliação foram geradas baseadas no seu perfil.' : ''} Revise os dados e clique em "Adicionar Propriedade" para salvar.`
    };

    console.log('=== RESPOSTA FINAL ===');
    console.log('Dados da resposta:', responseData);
    console.log('=== FIM DA EXTRAÇÃO ===');

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro geral:', error);
    
    // Tratar erros específicos
    if (error.message && error.message.includes('Token de autorização')) {
      return new Response(
        JSON.stringify({ error: 'Sessão expirada. Faça login novamente.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (error.message && error.message.includes('URL é obrigatória')) {
      return new Response(
        JSON.stringify({ error: 'URL é obrigatória para extrair dados.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Erro genérico mais amigável
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno no processamento. Tente novamente em alguns minutos.' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
