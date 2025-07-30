import { useState, useEffect } from 'react';
import { UserAddress, PropertyDistance } from '@/types/address';
import { AddressService } from '@/services/addressService';
import { supabase } from '@/integrations/supabase/client';

export const useUserAddresses = () => {
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserAddresses();
  }, []);

  const loadUserAddresses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserAddresses([]);
        return;
      }

      const addresses = await AddressService.getUserAddresses(user.id);
      setUserAddresses(addresses);
    } catch (err) {
      console.error('Erro ao carregar endereços:', err);
      setError('Erro ao carregar endereços');
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePropertyDistances = (propertyLat: number, propertyLng: number): PropertyDistance[] => {
    return userAddresses
      .filter(address => address.latitude && address.longitude)
      .map(address => {
        const distance = AddressService.calculateDistance(
          propertyLat,
          propertyLng,
          address.latitude!,
          address.longitude!
        );

        const label = address.label === 'outro' && address.custom_label 
          ? address.custom_label 
          : getAddressDisplayLabel(address.label);

        return {
          addressId: address.id,
          addressLabel: label,
          distance: Math.round(distance),
          // Estimativa básica de tempo: 1km = 3 minutos de carro
          travelTime: Math.round(distance / 1000 * 3)
        };
      })
      .sort((a, b) => a.distance - b.distance);
  };

  const getClosestAddressByType = (propertyLat: number, propertyLng: number, addressType: 'trabalho' | 'escola' | 'outro'): PropertyDistance | null => {
    const filteredAddresses = userAddresses.filter(addr => addr.label === addressType && addr.latitude && addr.longitude);
    
    if (filteredAddresses.length === 0) return null;

    let closest: PropertyDistance | null = null;
    let minDistance = Infinity;

    filteredAddresses.forEach(address => {
      const distance = AddressService.calculateDistance(
        propertyLat,
        propertyLng,
        address.latitude!,
        address.longitude!
      );

      if (distance < minDistance) {
        minDistance = distance;
        const label = address.label === 'outro' && address.custom_label 
          ? address.custom_label 
          : getAddressDisplayLabel(address.label);

        closest = {
          addressId: address.id,
          addressLabel: label,
          distance: Math.round(distance),
          travelTime: Math.round(distance / 1000 * 3)
        };
      }
    });

    return closest;
  };

  const getAddressDisplayLabel = (label: 'trabalho' | 'escola' | 'outro'): string => {
    const labels = {
      trabalho: 'Trabalho',
      escola: 'Escola',
      outro: 'Outro'
    };
    return labels[label];
  };

  return {
    userAddresses,
    isLoading,
    error,
    loadUserAddresses,
    calculatePropertyDistances,
    getClosestAddressByType,
    getAddressDisplayLabel
  };
};