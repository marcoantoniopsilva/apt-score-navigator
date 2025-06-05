
import { OpenAIResponse } from './types.ts';

export async function extractDataWithAI(content: string, openaiApiKey: string): Promise<string> {
  console.log('Scraping concluído, extraindo dados estruturados...');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Você é um especialista em extração de dados de imóveis. Analise o conteúdo HTML/Markdown fornecido e extraia as informações do imóvel.

Retorne APENAS um objeto JSON válido (sem formatação markdown ou blocos de código) com as seguintes informações:
- title: título do anúncio
- address: endereço completo
- bedrooms: número de quartos (apenas números, default 1)
- bathrooms: número de banheiros (apenas números, default 1)
- parkingSpaces: número de vagas de garagem (apenas números, default 0)
- area: área em m² (apenas números, default 50 se não encontrar)
- floor: andar (ex: "5º andar", "Térreo", "Cobertura")
- rent: valor do aluguel em reais (apenas números, sem R$)
- condo: valor do condomínio em reais (apenas números, default 0)
- iptu: valor do IPTU em reais (apenas números, default 0)

IMPORTANTE: Retorne apenas o objeto JSON, sem texto adicional, sem blocos de código markdown. Se alguma informação não estiver disponível, use valores padrão razoáveis.`
        },
        {
          role: 'user',
          content: `Extraia os dados do imóvel deste conteúdo:\n\n${content}`
        }
      ],
      temperature: 0.1,
      max_tokens: 1000
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Erro no OpenAI:', errorText);
    throw new Error('Falha ao processar dados com IA');
  }

  const aiResponse: OpenAIResponse = await response.json();
  return aiResponse.choices[0].message.content;
}
