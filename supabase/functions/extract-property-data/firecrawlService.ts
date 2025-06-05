
import { FirecrawlResponse } from './types.ts';

export async function scrapeWebsite(url: string, firecrawlApiKey: string): Promise<FirecrawlResponse> {
  console.log('Fazendo scraping com Firecrawl...');
  
  const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firecrawlApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: url,
      formats: ['markdown', 'html'],
      onlyMainContent: true,
      includeTags: ['title', 'meta', 'h1', 'h2', 'h3', 'span', 'div', 'p', 'img'],
      excludeTags: ['script', 'style', 'nav', 'footer', 'header']
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Erro no Firecrawl:', errorText);
    throw new Error('Falha ao fazer scraping do site');
  }

  return await response.json();
}
