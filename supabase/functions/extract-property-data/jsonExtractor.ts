
// Função para extrair JSON da resposta da IA, mesmo se estiver em markdown
export function extractJSONFromResponse(text: string): any {
  try {
    // Primeiro, tenta fazer parse direto
    return JSON.parse(text);
  } catch {
    // Se falhar, procura por blocos de código JSON
    const jsonBlockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
    const match = text.match(jsonBlockRegex);
    
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch {
        console.error('JSON encontrado em bloco de código não é válido:', match[1]);
      }
    }
    
    // Como último recurso, procura por qualquer objeto que pareça JSON
    const jsonObjectRegex = /\{[\s\S]*\}/;
    const objectMatch = text.match(jsonObjectRegex);
    
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch {
        console.error('Objeto JSON encontrado não é válido:', objectMatch[0]);
      }
    }
    
    throw new Error('Não foi possível extrair JSON válido da resposta');
  }
}
