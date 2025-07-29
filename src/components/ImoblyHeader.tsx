import React from 'react';

interface ImoblyHeaderProps {
  showSubtitle?: boolean;
  className?: string;
  variant?: 'light' | 'dark';
}

export const ImoblyHeader: React.FC<ImoblyHeaderProps> = ({ 
  showSubtitle = true, 
  className = "",
  variant = 'light'
}) => {
  const textColor = variant === 'light' ? 'text-white' : 'text-foreground';
  const subtitleColor = variant === 'light' ? 'text-white/80' : 'text-muted-foreground';
  
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="w-12 h-12 bg-white rounded-xl p-2 shadow-lg">
        <img 
          src="/lovable-uploads/5d5f089c-a2fc-47e8-abd1-c861b2624952.png" 
          alt="Imobly Logo" 
          className="w-full h-full object-contain"
        />
      </div>
      <div>
        <h1 className={`text-2xl font-bold ${textColor}`}>Imobly</h1>
        {showSubtitle && (
          <p className={`${subtitleColor} text-sm`}>Seu novo jeito de escolher imóveis</p>
        )}
      </div>
    </div>
  );
};