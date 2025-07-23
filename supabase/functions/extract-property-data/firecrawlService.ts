
import { FirecrawlResponse } from './types.ts';

export async function scrapeWebsite(url: string, firecrawlApiKey: string): Promise<FirecrawlResponse> {
  console.log('Fazendo scraping com Firecrawl para URL:', url);
  
  const requestBody = {
    url: url,
    formats: ['markdown', 'html'],
    onlyMainContent: true,
    // Usar apenas parâmetros suportados pela v1 da API
    includeTags: ['title', 'meta', 'h1', 'h2', 'h3', 'span', 'div', 'p', 'img', 'picture', 'figure', 'source'],
    excludeTags: ['script', 'style', 'nav', 'footer', 'header', 'aside', 'menu'],
    // Aguardar carregamento da página
    waitFor: 2000
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
      
      // Se for erro 502, tentar novamente após um delay
      if (response.status === 502) {
        console.log('Erro 502 detectado, tentando novamente em 3 segundos...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Segunda tentativa
        const retryResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
        
        if (!retryResponse.ok) {
          const retryErrorText = await retryResponse.text();
          console.error('Erro na segunda tentativa:', retryErrorText);
          throw new Error(`Falha ao fazer scraping do site (após retry): ${retryResponse.status} - ${retryErrorText}`);
        }
        
        const retryResult = await retryResponse.json();
        console.log('Segunda tentativa bem-sucedida');
        return retryResult;
      }
      
      throw new Error(`Falha ao fazer scraping do site: ${response.status} - ${errorText}`);
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

    return result;
    
  } catch (error) {
    console.error('Erro de rede ou timeout:', error);
    throw new Error(`Erro de conexão com Firecrawl: ${error.message}`);
  }
}
