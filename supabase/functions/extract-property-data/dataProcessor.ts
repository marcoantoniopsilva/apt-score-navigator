
import { ExtractedPropertyData } from './types.ts';
import { extractJSONFromResponse } from './jsonExtractor.ts';

export function processExtractedData(extractedText: string): any {
  console.log('Resposta da IA:', extractedText);

  const extractedData: ExtractedPropertyData = extractJSONFromResponse(extractedText);
  
  // Validate and clean the data - usar snake_case para manter consistência com edge function
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
    fire_insurance: Math.max(0, Number(extractedData.fireInsurance) || 50),
    other_fees: Math.max(0, Number(extractedData.otherFees) || 0),
  };

  console.log('Dados processados (snake_case):', cleanedData);
  return cleanedData;
}
