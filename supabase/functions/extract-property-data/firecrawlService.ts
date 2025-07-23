
import { FirecrawlResponse } from './types.ts';

export async function scrapeWebsite(url: string, firecrawlApiKey: string): Promise<FirecrawlResponse> {
  console.log('Fazendo scraping com Firecrawl para URL:', url);
  
  const requestBody = {
    url: url,
    formats: ['markdown', 'html'],
    onlyMainContent: true,
    includeTags: ['title', 'meta', 'h1', 'h2', 'h3', 'span', 'div', 'p', 'img', 'picture', 'figure', 'source'],
    excludeTags: ['script', 'style', 'nav', 'footer', 'header', 'aside', 'menu'],
    waitFor: 3000, // Aumentar tempo de espera
    timeout: 45000 // Timeout de 45 segundos
  };

  console.log('Corpo da requisição Firecrawl:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Status da resposta Firecrawl:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro no Firecrawl:', errorText);
      
      // Tratamento específico para diferentes tipos de erro
      if (response.status === 408 || response.status === 504) {
        throw new Error('Timeout: O site demorou muito para responder');
      } else if (response.status === 502 || response.status === 503) {
        throw new Error('Serviço temporariamente indisponível');
      } else if (response.status === 404) {
        throw new Error('URL não encontrada');
      } else if (response.status === 403) {
        throw new Error('Acesso negado pelo site');
      } else if (response.status >= 500) {
        throw new Error('Erro interno do serviço de extração');
      } else {
        throw new Error(`Erro no scraping: ${response.status} - ${errorText}`);
      }
    }

    const result = await response.json();
    console.log('Resposta do Firecrawl:', {
      hasData: !!result.data,
      hasMarkdown: !!result.data?.markdown,
      hasHtml: !!result.data?.html,
      hasContent: !!result.data?.content,
      hasExtract: !!result.data?.extract,
      htmlLength: result.data?.html?.length || 0,
      markdownLength: result.data?.markdown?.length || 0,
      extractLength: result.data?.extract?.length || 0
    });

    // Verificar se temos dados suficientes
    if (!result.data || (!result.data.markdown && !result.data.html && !result.data.content)) {
      throw new Error('Nenhum conteúdo foi extraído do site');
    }

    return result;
    
  } catch (error) {
    console.error('Erro de rede ou processamento:', error);
    
    // Relançar erros conhecidos
    if (error.message.includes('Timeout') || 
        error.message.includes('temporariamente indisponível') ||
        error.message.includes('não encontrada') ||
        error.message.includes('Acesso negado') ||
        error.message.includes('Nenhum conteúdo')) {
      throw error;
    }
    
    // Para outros erros, usar mensagem genérica
    throw new Error('Erro de conexão ou processamento do site');
  }
}
