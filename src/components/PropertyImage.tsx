
import React from 'react';
import { Property } from '@/types/property';
import { Home } from 'lucide-react';

interface PropertyImageProps {
  property: Property;
  className?: string;
}

export const PropertyImage: React.FC<PropertyImageProps> = ({ property, className = '' }) => {
  const mainImage = property.images && property.images.length > 0 ? property.images[0] : null;

  if (!mainImage) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <Home className="h-8 w-8 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={mainImage}
      alt={property.title}
      className={`object-cover ${className}`}
      onError={(e) => {
        // Se a imagem falhar ao carregar, mostrar o ícone padrão
        const target = e.target as HTMLElement;
        target.style.display = 'none';
        const parent = target.parentElement;
        if (parent) {
          parent.innerHTML = '<div class="bg-gray-100 flex items-center justify-center h-full w-full"><svg class="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg></div>';
        }
      }}
    />
  );
};
