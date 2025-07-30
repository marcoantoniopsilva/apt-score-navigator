import React from 'react';
import { UserAddress } from '@/types/address';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AddressDisplaySectionProps {
  userAddresses: UserAddress[];
}

const getAddressTypeLabel = (label: 'trabalho' | 'escola' | 'outro', customLabel?: string) => {
  if (label === 'outro' && customLabel) {
    return customLabel;
  }
  
  const labels = {
    trabalho: '💼 Trabalho',
    escola: '🏫 Escola',
    outro: '📍 Outro'
  };
  
  return labels[label];
};

export const AddressDisplaySection: React.FC<AddressDisplaySectionProps> = ({ userAddresses }) => {
  if (!userAddresses || userAddresses.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 pt-4 border-t border-primary/10">
      <p className="text-xs font-medium text-muted-foreground mb-2">ENDEREÇOS PESSOAIS</p>
      <div className="space-y-2">
        {userAddresses.map((address) => (
          <div key={address.id} className="flex items-start gap-2">
            <MapPin className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs px-2 py-0">
                  {getAddressTypeLabel(address.label, address.custom_label)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {address.address}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};