import { CRITERIOS_DISPONÍVEIS, PERFIL_PESOS_SUGERIDOS } from './types.ts';

export async function generateScoreSuggestions(
  extractedContent: string,
  propertyData: any,
  userProfile: any,
  openaiApiKey: string
): Promise<Record<string, number>> {
  
  // Obter critérios do perfil do usuário
  const profileWeights = PERFIL_PESOS_SUGERIDOS[userProfile.profile_type as keyof typeof PERFIL_PESOS_SUGERIDOS];
  if (!profileWeights) {
    console.log('Perfil não encontrado, retornando scores padrão');
    return {};
  }

  const criteriosAtivos = Object.keys(profileWeights);
  
  // Criar prompt para análise do conteúdo
  const analysisPrompt = `
Você é um especialista em avaliação imobiliária. Analise este anúncio de imóvel e sugira pontuações de 0 a 10 para os critérios listados.

PERFIL DO USUÁRIO: ${userProfile.profile_type}
- Objetivo: ${userProfile.objetivo_principal}
- Situação: ${userProfile.situacao_moradia}
- Valor principal: ${userProfile.valor_principal}

DADOS BÁSICOS DO IMÓVEL:
- Título: ${propertyData.title}
- Endereço: ${propertyData.address}
- Quartos: ${propertyData.bedrooms}
- Banheiros: ${propertyData.bathrooms}
- Área: ${propertyData.area}m²
- Aluguel: R$ ${propertyData.rent}
- Condomínio: R$ ${propertyData.condo}
- IPTU: R$ ${propertyData.iptu}

CRITÉRIOS PARA AVALIAÇÃO (baseado no perfil):
${criteriosAtivos.map(criterio => {
  const criterioInfo = CRITERIOS_DISPONÍVEIS.find(c => c.id === criterio);
  return `- ${criterio}: ${criterioInfo?.label || criterio} (peso: ${profileWeights[criterio]})`;
}).join('\n')}

CONTEÚDO DO ANÚNCIO:
${extractedContent.substring(0, 2000)}

Instruções:
1. Analise o conteúdo considerando o perfil específico do usuário
2. Para cada critério, dê uma nota de 0 a 10 baseada nas informações disponíveis
3. Considere que este usuário tem perfil "${userProfile.profile_type}"
4. Se não houver informações suficientes para um critério, use 5.0 como valor neutro
5. Responda APENAS com um JSON válido no formato: {"criterio1": 8.5, "criterio2": 6.2}

JSON de resposta:`;

  try {
    console.log('Gerando sugestões de scores com OpenAI...');
    console.log('Prompt:', analysisPrompt.substring(0, 500) + '...');
    
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
            content: 'Você é um especialista em avaliação imobiliária. Responda sempre com JSON válido contendo as pontuações.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      console.error('Erro na API OpenAI:', response.status);
      return {};
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;
    
    console.log('Resposta da OpenAI:', content);

    // Tentar parsear o JSON da resposta
    try {
      // Remover formatação markdown se presente
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      console.log('Conteúdo limpo para parsing:', cleanContent);
      const scores = JSON.parse(cleanContent);
      console.log('Scores sugeridos:', scores);
      
      // Validar e limitar scores entre 0 e 10
      const validatedScores: Record<string, number> = {};
      for (const [key, value] of Object.entries(scores)) {
        if (typeof value === 'number' && !isNaN(value)) {
          validatedScores[key] = Math.max(0, Math.min(10, value));
        }
      }
      
      return validatedScores;
    } catch (parseError) {
      console.error('Erro ao parsear JSON da OpenAI:', parseError);
      return {};
    }

  } catch (error) {
    console.error('Erro ao gerar sugestões:', error);
    return {};
  }
}