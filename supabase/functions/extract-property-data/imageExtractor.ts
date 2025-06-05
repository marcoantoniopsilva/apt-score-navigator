
// Função para extrair imagens do HTML e também do Markdown
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
    
    console.log(`Total de imagens encontradas no HTML: ${totalMatches}`);
    console.log(`Imagens válidas do HTML: ${images.length}`);
    
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
    console.log('Imagens finais únicas do HTML:', uniqueImages);
    
    return uniqueImages;
  } catch (error) {
    console.error('Erro ao extrair imagens do HTML:', error);
    return [];
  }
}

// Nova função para extrair imagens do Markdown
export function extractImagesFromMarkdown(markdown: string): string[] {
  const images: string[] = [];
  
  try {
    console.log('Iniciando extração de imagens do Markdown...');
    console.log('Tamanho do Markdown:', markdown.length);
    
    // Regex para encontrar imagens no formato ![alt](url)
    const markdownImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    let totalMatches = 0;
    
    while ((match = markdownImgRegex.exec(markdown)) !== null) {
      totalMatches++;
      const src = match[2];
      console.log(`Imagem markdown encontrada ${totalMatches}:`, src);
      
      if (src && isValidPropertyImage(src)) {
        let fullUrl = src;
        if (src.startsWith('//')) {
          fullUrl = 'https:' + src;
        }
        
        if (!src.startsWith('/') && !images.includes(fullUrl)) {
          console.log('Imagem markdown válida adicionada:', fullUrl);
          images.push(fullUrl);
        }
      }
    }
    
    // Regex para encontrar URLs de imagens soltas no texto
    const urlImgRegex = /https?:\/\/[^\s<>"']*\.(jpg|jpeg|png|webp|avif|gif)(?:\?[^\s<>"']*)?/gi;
    let urlMatch;
    
    while ((urlMatch = urlImgRegex.exec(markdown)) !== null) {
      const src = urlMatch[0];
      console.log('URL de imagem encontrada no texto:', src);
      
      if (src && isValidPropertyImage(src) && !images.includes(src)) {
        console.log('URL de imagem válida adicionada:', src);
        images.push(src);
      }
    }
    
    console.log(`Total de imagens encontradas no Markdown: ${totalMatches}`);
    
    // Remover duplicatas e limitar a 10 imagens
    const uniqueImages = [...new Set(images)].slice(0, 10);
    console.log('Imagens finais únicas do Markdown:', uniqueImages);
    
    return uniqueImages;
  } catch (error) {
    console.error('Erro ao extrair imagens do Markdown:', error);
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
    /profile/i,
    /sprite/i,
    /favicon/i
  ];
  
  const isExcluded = excludePatterns.some(pattern => pattern.test(src));
  
  console.log(`Validando ${src}: extensão=${hasImageExtension}, excluído=${isExcluded}`);
  
  return hasImageExtension && !isExcluded;
}
