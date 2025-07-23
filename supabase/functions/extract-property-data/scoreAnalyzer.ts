import { UserPreferences } from './userPreferencesService.ts';
import { OpenAIResponse } from './types.ts';

export async function generatePropertyScores(
  content: string, 
  propertyData: any, 
  userPreferences: UserPreferences, 
  openaiApiKey: string
): Promise<Record<string, number>> {
  console.log('Gerando scores personalizados com IA...');
  console.log('Critérios ativos:', userPreferences.criteriosAtivos.length);
  console.log('Região de referência:', userPreferences.regiaoReferencia);
  console.log('Faixa de preço:', userPreferences.faixaPreco);

  if (!userPreferences.criteriosAtivos.length) {
    console.log('Nenhum critério ativo encontrado, retornando scores padrão');
    return {};
  }

  // Criar prompt personalizado baseado nos critérios do usuário
  const criteriosList = userPreferences.criteriosAtivos
    .map(c => `${c.criterio_nome} (peso: ${c.peso})`)
    .join('\n- ');

  const custoTotal = (propertyData.rent || 0) + (propertyData.condo || 0) + (propertyData.iptu || 0);

  const prompt = `Analise este imóvel e atribua notas de 0 a 10 para cada critério solicitado.

DADOS DO IMÓVEL:
- Título: ${propertyData.title}
- Endereço: ${propertyData.address}
- Aluguel: R$ ${propertyData.rent}
- Condomínio: R$ ${propertyData.condo}
- IPTU: R$ ${propertyData.iptu}
- Custo Total Mensal: R$ ${custoTotal}
- Quartos: ${propertyData.bedrooms}
- Banheiros: ${propertyData.bathrooms}
- Área: ${propertyData.area}m²
- Andar: ${propertyData.floor}

PREFERÊNCIAS DO USUÁRIO:
- Região de preferência: ${userPreferences.regiaoReferencia || 'Não informada'}
- Faixa de preço desejada: ${userPreferences.faixaPreco || 'Não informada'}
- Valor principal para o usuário: ${userPreferences.valorPrincipal || 'Não informado'}

CRITÉRIOS PARA AVALIAR (notas de 0 a 10):
- ${criteriosList}

INSTRUÇÕES ESPECÍFICAS:
1. Para "localizacao" ou "proximidade_metro": Compare o endereço do imóvel com a região de preferência do usuário
2. Para "preco_total" ou "preco_por_m2": Compare o custo total mensal (R$ ${custoTotal}) com a faixa de preço desejada
   - Se custo estiver muito acima da faixa desejada: nota baixa (2-4)
   - Se custo estiver na faixa desejada: nota alta (7-9)
   - Se custo estiver abaixo da faixa: nota média-alta (6-8)
3. Para outros critérios: Analise com base no conteúdo do anúncio

CONTEÚDO COMPLETO DO ANÚNCIO:
${content.substring(0, 3000)}

Retorne APENAS um objeto JSON com os critérios e suas notas (use o nome exato dos critérios):
{"criterio1": nota, "criterio2": nota, ...}`;

  console.log('Enviando prompt para OpenAI para análise de scores...');

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
          content: 'Você é um especialista em avaliação imobiliária. Analise imóveis e atribua notas precisas baseadas nos critérios solicitados. Seja criterioso e realista nas avaliações. Responda sempre com JSON válido.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Erro no OpenAI para scores:', errorText);
    throw new Error('Falha ao gerar scores com IA');
  }

  const aiResponse: OpenAIResponse = await response.json();
  const scoresText = aiResponse.choices[0].message.content;
  
  console.log('Resposta da IA para scores:', scoresText);

  try {
    // Extrair JSON da resposta
    let cleanContent = scoresText.trim();
    
    // Remover formatação markdown se presente
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/```\n?/, '').replace(/\n?```$/, '');
    }
    
    // Procurar por JSON válido
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const scores = JSON.parse(jsonMatch[0]);
      
      // Validar e limitar scores entre 0 e 10
      const validatedScores: Record<string, number> = {};
      for (const [key, value] of Object.entries(scores)) {
        if (typeof value === 'number' && !isNaN(value)) {
          validatedScores[key] = Math.max(0, Math.min(10, value));
        }
      }
      
      console.log('Scores extraídos e validados:', validatedScores);
      return validatedScores;
    } else {
      console.error('Não foi possível extrair JSON dos scores');
      return {};
    }
  } catch (error) {
    console.error('Erro ao fazer parse dos scores:', error);
    return {};
  }
}