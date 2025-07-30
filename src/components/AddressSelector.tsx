import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, Plus, Trash2, Edit3 } from 'lucide-react';
import { AddressService } from '@/services/addressService';
import { UserAddress, AddressFormData, AddressSearchResult } from '@/types/address';
import { toast } from 'sonner';

interface AddressSelectorProps {
  userAddresses: UserAddress[];
  onAddressesChange: () => void;
  isEmbedded?: boolean; // Para usar no onboarding
}

const ADDRESS_LABELS = {
  trabalho: '💼 Trabalho',
  escola: '🏫 Escola', 
  outro: '📍 Outro'
};

export const AddressSelector: React.FC<AddressSelectorProps> = ({ 
  userAddresses, 
  onAddressesChange, 
  isEmbedded = false 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AddressSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [formData, setFormData] = useState<AddressFormData>({
    label: 'trabalho',
    address: ''
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await AddressService.searchAddresses(searchQuery);
      setSearchResults(results);
    } catch (error) {
      toast.error('Erro ao buscar endereços');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectAddress = (result: AddressSearchResult) => {
    setFormData(prev => ({
      ...prev,
      address: result.place_name,
      cep: result.postcode
    }));
    setSearchResults([]);
    setSearchQuery(result.place_name); // Manter o texto da busca como referência
  };

  const handleSave = async () => {
    if (!formData.address.trim()) {
      toast.error('Endereço é obrigatório');
      return;
    }

    try {
      // Buscar coordenadas do endereço selecionado
      const geocodeResults = await AddressService.searchAddresses(formData.address);
      const coordinates = geocodeResults[0]?.center;

      const addressData = {
        ...formData,
        latitude: coordinates?.[1],
        longitude: coordinates?.[0]
      };

      if (editingId) {
        await AddressService.updateAddress(editingId, addressData);
        toast.success('Endereço atualizado com sucesso');
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await AddressService.saveAddress(user.id, addressData);
          toast.success('Endereço adicionado com sucesso');
        }
      }

      setFormData({ label: 'trabalho', address: '' });
      setIsAdding(false);
      setEditingId(null);
      onAddressesChange();
    } catch (error) {
      toast.error('Erro ao salvar endereço');
    }
  };

  const handleEdit = (address: UserAddress) => {
    setFormData({
      label: address.label,
      custom_label: address.custom_label,
      address: address.address,
      cep: address.cep
    });
    setEditingId(address.id);
    setIsAdding(true);
  };

  const handleDelete = async (addressId: string) => {
    try {
      await AddressService.deleteAddress(addressId);
      toast.success('Endereço removido com sucesso');
      onAddressesChange();
    } catch (error) {
      toast.error('Erro ao remover endereço');
    }
  };

  const handleCancel = () => {
    setFormData({ label: 'trabalho', address: '' });
    setIsAdding(false);
    setEditingId(null);
    setSearchResults([]);
    setSearchQuery('');
  };

  return (
    <Card className={isEmbedded ? 'border-none shadow-none' : ''}>
      <CardHeader className={isEmbedded ? 'px-0 pb-4' : ''}>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Endereços Pessoais
        </CardTitle>
        <CardDescription>
          {isEmbedded 
            ? 'Adicione endereços importantes para calcular proximidade dos imóveis (opcional)'
            : 'Gerencie seus endereços para calcular proximidade dos imóveis'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className={isEmbedded ? 'px-0' : ''}>
        {/* Lista de endereços existentes */}
        {userAddresses.length > 0 && (
          <div className="space-y-3 mb-4">
            {userAddresses.map((address) => (
              <div key={address.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary">
                      {ADDRESS_LABELS[address.label]}
                    </Badge>
                    {address.custom_label && (
                      <span className="text-sm text-muted-foreground">
                        ({address.custom_label})
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{address.address}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(address)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(address.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Formulário de adição/edição */}
        {isAdding ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="label">Tipo de endereço</Label>
                <Select
                  value={formData.label}
                  onValueChange={(value: 'trabalho' | 'escola' | 'outro') => 
                    setFormData(prev => ({ ...prev, label: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trabalho">💼 Trabalho</SelectItem>
                    <SelectItem value="escola">🏫 Escola</SelectItem>
                    <SelectItem value="outro">📍 Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.label === 'outro' && (
                <div>
                  <Label htmlFor="custom_label">Nome personalizado</Label>
                  <Input
                    id="custom_label"
                    value={formData.custom_label || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, custom_label: e.target.value }))}
                    placeholder="Ex: Academia, Hospital..."
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="search">Buscar endereço</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Digite CEP, rua ou endereço completo..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                >
                  {isSearching ? '...' : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Resultados da busca */}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <Label>Resultados da busca:</Label>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full text-left p-2 text-sm border rounded hover:bg-muted"
                      onClick={() => handleSelectAddress(result)}
                    >
                      {result.place_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="address">Endereço selecionado</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Endereço completo"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave}>
                {editingId ? 'Atualizar' : 'Adicionar'}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            variant="outline" 
            onClick={() => setIsAdding(true)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Endereço
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

import { supabase } from '@/integrations/supabase/client';