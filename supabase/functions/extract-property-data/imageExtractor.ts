
// Função para extrair imagens do HTML
export function extractImagesFromHTML(html: string): string[] {
  const images: string[] = [];
  
  try {
    // Regex para encontrar tags img com src
    const imgRegex = /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi;
    let match;
    
    while ((match = imgRegex.exec(html)) !== null) {
      const src = match[1];
      
      // Filtrar apenas imagens que parecem ser fotos de propriedades
      if (src && 
          !src.includes('logo') && 
          !src.includes('icon') && 
          !src.includes('avatar') && 
          !src.includes('banner') &&
          (src.includes('jpg') || src.includes('jpeg') || src.includes('png') || src.includes('webp')) &&
          (src.startsWith('http') || src.startsWith('https') || src.startsWith('//'))) {
        
        // Converter URLs relativas em absolutas se necessário
        let fullUrl = src;
        if (src.startsWith('//')) {
          fullUrl = 'https:' + src;
        }
        
        images.push(fullUrl);
      }
    }
    
    // Remover duplicatas e limitar a 5 imagens
    return [...new Set(images)].slice(0, 5);
  } catch (error) {
    console.error('Erro ao extrair imagens do HTML:', error);
    return [];
  }
}
