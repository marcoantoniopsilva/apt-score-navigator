
import { FirecrawlResponse } from './types.ts';

export async function scrapeWebsite(url: string, firecrawlApiKey: string): Promise<FirecrawlResponse> {
  console.log('Fazendo scraping com Firecrawl para URL:', url);
  
  const requestBody = {
    url: url,
    formats: ['markdown', 'html'],
    onlyMainContent: true,
    // Melhorar configuração para extrair mais dados
    includeTags: ['title', 'meta', 'h1', 'h2', 'h3', 'span', 'div', 'p', 'img', 'picture', 'figure', 'source'],
    excludeTags: ['script', 'style', 'nav', 'footer', 'header', 'aside', 'menu'],
    // Adicionar configurações para melhor extração
    waitFor: 2000, // Aguardar 2 segundos para página carregar
    screenshot: false, // Não precisamos de screenshot
    fullPageScreenshot: false,
    // Tentar extrair mais dados estruturados
    extractorOptions: {
      mode: 'llm-extraction',
      extractionPrompt: 'Extract all image URLs from this page, including those in img tags, picture tags, and background images. Also extract property details.'
    }
  };

  console.log('Corpo da requisição Firecrawl:', JSON.stringify(requestBody, null, 2));

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
}
