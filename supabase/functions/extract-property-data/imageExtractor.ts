
// Função para extrair imagens do HTML
export function extractImagesFromHTML(html: string): string[] {
  const images: string[] = [];
  
  try {
    console.log('Iniciando extração de imagens do HTML...');
    console.log('Tamanho do HTML:', html.length);
    
    // Regex mais abrangente para encontrar tags img
    const imgRegex = /<img[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi;
    let match;
    let totalMatches = 0;
    
    while ((match = imgRegex.exec(html)) !== null) {
      totalMatches++;
      const src = match[1];
      console.log(`Imagem encontrada ${totalMatches}:`, src);
      
      // Filtrar e validar imagens
      if (src && isValidPropertyImage(src)) {
        // Converter URLs relativas em absolutas se necessário
        let fullUrl = src;
        if (src.startsWith('//')) {
          fullUrl = 'https:' + src;
        } else if (src.startsWith('/')) {
          // Para URLs relativas, precisaríamos da URL base, por enquanto skip
          console.log('Pulando URL relativa:', src);
          continue;
        }
        
        console.log('Imagem válida adicionada:', fullUrl);
        images.push(fullUrl);
      } else {
        console.log('Imagem rejeitada:', src);
      }
    }
    
    console.log(`Total de imagens encontradas: ${totalMatches}`);
    console.log(`Imagens válidas: ${images.length}`);
    
    // Também tentar buscar por atributos data-src (lazy loading)
    const dataSrcRegex = /<img[^>]*data-src\s*=\s*["']([^"']+)["'][^>]*>/gi;
    let dataSrcMatch;
    
    while ((dataSrcMatch = dataSrcRegex.exec(html)) !== null) {
      const src = dataSrcMatch[1];
      console.log('Imagem data-src encontrada:', src);
      
      if (src && isValidPropertyImage(src) && !images.includes(src)) {
        let fullUrl = src;
        if (src.startsWith('//')) {
          fullUrl = 'https:' + src;
        }
        
        if (!src.startsWith('/')) {
          console.log('Imagem data-src válida adicionada:', fullUrl);
          images.push(fullUrl);
        }
      }
    }
    
    // Remover duplicatas e limitar a 10 imagens
    const uniqueImages = [...new Set(images)].slice(0, 10);
    console.log('Imagens finais únicas:', uniqueImages);
    
    return uniqueImages;
  } catch (error) {
    console.error('Erro ao extrair imagens do HTML:', error);
    return [];
  }
}

function isValidPropertyImage(src: string): boolean {
  // Verificar se é uma URL válida
  if (!src || src.length < 10) return false;
  
  // Deve começar com http, https ou //
  if (!src.match(/^(https?:\/\/|\/\/)/)) return false;
  
  // Deve ter extensão de imagem
  const hasImageExtension = /\.(jpg|jpeg|png|webp|avif|gif)(\?|$)/i.test(src);
  
  // Filtrar URLs que claramente não são fotos de propriedades
  const excludePatterns = [
    /logo/i,
    /icon/i,
    /avatar/i,
    /banner/i,
    /header/i,
    /footer/i,
    /menu/i,
    /nav/i,
    /button/i,
    /social/i,
    /share/i,
    /thumb/i,
    /profile/i
  ];
  
  const isExcluded = excludePatterns.some(pattern => pattern.test(src));
  
  console.log(`Validando ${src}: extensão=${hasImageExtension}, excluído=${isExcluded}`);
  
  return hasImageExtension && !isExcluded;
}
