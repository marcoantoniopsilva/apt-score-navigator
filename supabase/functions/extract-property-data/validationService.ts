import { UserPreferences } from './userPreferencesService.ts';

export interface ValidationResult {
  isValid: boolean;
  violations: string[];
  score: number; // 0-100, how well it matches preferences
}

export interface ExtractedPropertyData {
  title: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  parking_spaces: number;
  area: number;
  floor: string;
  rent: number;
  condo: number;
  iptu: number;
  fire_insurance?: number;
  other_fees?: number;
}

export function validatePropertyAgainstPreferences(
  propertyData: ExtractedPropertyData,
  userPreferences: UserPreferences,
  sourceUrl: string
): ValidationResult {
  const violations: string[] = [];
  let score = 100;

  console.log('=== VALIDAÇÃO INICIADA ===');
  console.log('Property data:', JSON.stringify(propertyData, null, 2));
  console.log('User preferences:', JSON.stringify(userPreferences, null, 2));

  // 1. Validação de Localização
  if (userPreferences.regiaoReferencia) {
    const referenciaLower = userPreferences.regiaoReferencia.toLowerCase();
    const addressLower = propertyData.address.toLowerCase();
    
    // Extrair cidade de referência
    let cidadeReferencia = '';
    if (referenciaLower.includes('belo horizonte')) {
      cidadeReferencia = 'belo horizonte';
    } else if (referenciaLower.includes('rio de janeiro')) {
      cidadeReferencia = 'rio de janeiro';
    } else if (referenciaLower.includes('são paulo')) {
      cidadeReferencia = 'são paulo';
    }
    
    // Verificar cidades completamente incorretas (fora da região)
    const cidadesProibidas = ['juiz de fora', 'poços de caldas', 'contagem', 'betim', 'nova lima'];
    const cidadeEncontrada = cidadesProibidas.find(cidade => addressLower.includes(cidade));
    
    if (cidadeEncontrada) {
      violations.push(`Localização incorreta: imóvel em ${cidadeEncontrada}, mas preferência é ${userPreferences.regiaoReferencia}`);
      score -= 60; // Penalidade severa por cidade completamente errada
    } else if (cidadeReferencia && !addressLower.includes(cidadeReferencia)) {
      // Se não tem a cidade de referência mas também não está nas cidades proibidas, penalidade menor
      violations.push(`Cidade não confirmada no endereço: esperado ${cidadeReferencia}`);
      score -= 20; // Penalidade menor quando a cidade não é confirmada
    }
    
    // Verificação de bairro mais flexível
    if (referenciaLower.includes('santo agostinho')) {
      if (!addressLower.includes('santo agostinho')) {
        // Verificar se está em Belo Horizonte pelo menos
        if (addressLower.includes('belo horizonte') || addressLower.includes('bh')) {
          violations.push(`Bairro não confirmado: preferência é Santo Agostinho`);
          score -= 15; // Penalidade menor se está em BH mas bairro não confirmado
        } else {
          violations.push(`Bairro incorreto: preferência é Santo Agostinho, mas imóvel parece estar em outro local`);
          score -= 25; // Penalidade maior se nem a cidade está clara
        }
      }
    }
  }

  // 2. Validação de Preço - Aplicada apenas durante comparação, não busca inicial
  // Durante a busca inicial, não aplicamos filtros de preço para ter mais resultados
  // O preço será validado posteriormente quando o usuário decidir comparar
  if (userPreferences.faixaPreco && sourceUrl.includes('comparison')) {
    const faixaLimpa = userPreferences.faixaPreco.replace(/R\$|\./g, '').replace(/\s/g, '');
    let minPreco = 0;
    let maxPreco = Infinity;
    
    if (faixaLimpa.includes('-')) {
      const partes = faixaLimpa.split('-');
      if (partes.length === 2) {
        minPreco = parseInt(partes[0]) || 0;
        maxPreco = parseInt(partes[1]) || Infinity;
      }
    } else if (faixaLimpa.includes('até')) {
      maxPreco = parseInt(faixaLimpa.replace('até', '')) || Infinity;
    }
    
    const precoTotal = propertyData.rent + (propertyData.condo || 0) + (propertyData.iptu || 0);
    
    // Tolerância ampla: -30% no mínimo, +50% no máximo
    const margemToleranciaMin = 0.30; // 30% para baixo
    const margemToleranciaMax = 0.50; // 50% para cima
    const minComTolerancia = minPreco * (1 - margemToleranciaMin);
    const maxComTolerancia = maxPreco * (1 + margemToleranciaMax);
    
    if (precoTotal < minComTolerancia || precoTotal > maxComTolerancia) {
      violations.push(`Preço fora da faixa preferida: R$ ${precoTotal} não está entre R$ ${minComTolerancia.toFixed(0)}-${maxComTolerancia.toFixed(0)}`);
      score -= 15; // Penalidade reduzida para comparação
    }
    
    console.log(`Validação preço COMPARAÇÃO: total=${precoTotal}, faixa original=${minPreco}-${maxPreco}, tolerância=${minComTolerancia.toFixed(0)}-${maxComTolerancia.toFixed(0)}`);
  }

  // 3. Validação de Valores Suspeitos baseada na intenção do usuário
  const isRental = userPreferences.intencao !== 'comprar';
  
  if (isRental) {
    // Validação para aluguel
    if (propertyData.rent <= 0) {
      violations.push('Valor do aluguel inválido (R$ 0 ou negativo)');
      score -= 60; // Dados claramente incorretos
    }
    
    if (propertyData.rent < 500) {
      violations.push(`Valor do aluguel muito baixo: R$ ${propertyData.rent} (suspeito)`);
      score -= 30;
    }
  } else {
    // Validação para compra - valores geralmente mais altos
    if (propertyData.rent <= 0) {
      violations.push('Valor do imóvel inválido (R$ 0 ou negativo)');
      score -= 60;
    }
    
    if (propertyData.rent < 50000) {
      violations.push(`Valor de compra muito baixo: R$ ${propertyData.rent} (suspeito)`);
      score -= 20; // Penalidade menor pois valores de compra variam muito
    }
  }

  // 4. Validação de Endereço
  if (!propertyData.address || propertyData.address.length < 10) {
    violations.push('Endereço muito vago ou incompleto');
    score -= 20;
  }

  // 5. Validação de URL (verificar se não é página de listagem)
  if (sourceUrl.includes('/busca') || sourceUrl.includes('/search') || sourceUrl.includes('?q=')) {
    violations.push('URL parece ser de página de listagem, não de imóvel específico');
    score -= 15;
  }

  // 6. Verificação de dados básicos
  if (propertyData.area <= 0) {
    violations.push('Área inválida');
    score -= 20;
  }

  if (propertyData.bedrooms < 0 || propertyData.bathrooms < 0) {
    violations.push('Número de quartos/banheiros inválido');
    score -= 15;
  }

  // Validação ajustada: mais flexível para busca inicial, mais rigorosa para comparação
  const isComparison = sourceUrl.includes('comparison');
  const hasCriticalViolations = violations.some(v => 
    v.includes('Localização incorreta:') || 
    v.includes('Valor do aluguel inválido') ||
    v.includes('Valor do imóvel inválido') ||
    (isComparison && v.includes('Preço fora da faixa preferida:'))
  );
  
  // Critérios mais flexíveis para busca inicial (score >= 20%), mais rigorosos para comparação (>= 40%)
  const minimumScore = isComparison ? 40 : 20;
  const isValid = score >= minimumScore && !hasCriticalViolations;
  
  console.log('=== RESULTADO DA VALIDAÇÃO ===');
  console.log(`Válido: ${isValid}`);
  console.log(`Score: ${score}/100`);
  console.log(`Violações: ${violations.length}`);
  violations.forEach((v, i) => console.log(`  ${i + 1}. ${v}`));

  return {
    isValid,
    violations,
    score: Math.max(0, Math.min(100, score)) // Garantir que está entre 0-100
  };
}

export function extractLocationFromAddress(address: string): { city: string; neighborhood?: string } {
  const addressLower = address.toLowerCase();
  
  // Mapear cidades comuns
  const cities = {
    'belo horizonte': 'Belo Horizonte',
    'rio de janeiro': 'Rio de Janeiro',
    'são paulo': 'São Paulo',
    'juiz de fora': 'Juiz de Fora',
    'poços de caldas': 'Poços de Caldas',
    'contagem': 'Contagem',
    'betim': 'Betim'
  };
  
  let foundCity = '';
  for (const [key, value] of Object.entries(cities)) {
    if (addressLower.includes(key)) {
      foundCity = value;
      break;
    }
  }
  
  // Extrair bairro (lógica simples)
  let neighborhood = '';
  const bairrosComuns = ['santo agostinho', 'savassi', 'funcionários', 'centro', 'copacabana', 'ipanema'];
  for (const bairro of bairrosComuns) {
    if (addressLower.includes(bairro)) {
      neighborhood = bairro.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      break;
    }
  }
  
  return {
    city: foundCity,
    neighborhood
  };
}