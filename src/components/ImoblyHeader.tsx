import React from 'react';
import imoblyLogo from '@/assets/imobly-logo.png';

interface ImoblyHeaderProps {
  showSubtitle?: boolean;
  className?: string;
}

export const ImoblyHeader: React.FC<ImoblyHeaderProps> = ({ 
  showSubtitle = true, 
  className = "" 
}) => {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <img 
        src={imoblyLogo} 
        alt="Imobly Logo" 
        className="h-12 w-12"
      />
      <div>
        <h1 className="text-2xl font-bold text-white">Imobly</h1>
        {showSubtitle && (
          <p className="text-white/80 text-sm">Seu novo jeito de escolher imóveis</p>
        )}
      </div>
    </div>
  );
};