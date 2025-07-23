
import { ExtractedPropertyData } from './types.ts';
import { extractJSONFromResponse } from './jsonExtractor.ts';
import { extractDataWithAI } from './openaiService.ts';

export async function processExtractedData(content: string): Promise<any> {
  console.log('Processando conteúdo extraído com IA...');
  
  // Usar OpenAI para extrair dados estruturados do conteúdo
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;
  const aiResponse = await extractDataWithAI(content, openaiApiKey);
  
  console.log('Resposta da IA:', aiResponse);

  const extractedData: ExtractedPropertyData = extractJSONFromResponse(aiResponse);
  
  // Validate and clean the data
  const cleanedData = {
    title: extractedData.title || 'Imóvel extraído automaticamente',
    address: extractedData.address || 'Endereço não encontrado',
    bedrooms: Math.max(0, Number(extractedData.bedrooms) || 1),
    bathrooms: Math.max(0, Number(extractedData.bathrooms) || 1),
    parking_spaces: Math.max(0, Number(extractedData.parkingSpaces) || 0),
    area: Math.max(1, Number(extractedData.area) || 50),
    floor: extractedData.floor || 'Não informado',
    rent: Math.max(0, Number(extractedData.rent) || 0),
    condo: Math.max(0, Number(extractedData.condo) || 0),
    iptu: Math.max(0, Number(extractedData.iptu) || 0),
  };

  return cleanedData;
}
