import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RegiaoSelector } from '@/components/RegiaoSelector';
import { AddressSelector } from '@/components/AddressSelector';
import { UserAddress } from '@/types/address';
import { AddressService } from '@/services/addressService';
import { supabase } from '@/integrations/supabase/client';

interface PreferencesFormProps {
  intencao: 'alugar' | 'comprar';
  onComplete: (faixaPreco: string, regiaoReferencia: string) => void;
  onBack: () => void;
}

const FAIXAS_PRECO_ALUGUEL = [
  'Até R$ 1.500',
  'R$ 1.500 - R$ 2.500',
  'R$ 2.500 - R$ 4.000',
  'R$ 4.000 - R$ 6.000',
  'R$ 6.000 - R$ 10.000',
  'Acima de R$ 10.000'
];

const FAIXAS_PRECO_COMPRA = [
  'Até R$ 200.000',
  'R$ 200.000 - R$ 400.000',
  'R$ 400.000 - R$ 600.000',
  'R$ 600.000 - R$ 800.000',
  'R$ 800.000 - R$ 1.200.000',
  'R$ 1.200.000 - R$ 2.000.000',
  'R$ 2.000.000 - R$ 3.000.000',
  'R$ 3.000.000 - R$ 5.000.000',
  'Acima de R$ 5.000.000'
];

export const PreferencesForm: React.FC<PreferencesFormProps> = ({
  intencao,
  onComplete,
  onBack
}) => {
  const [faixaPreco, setFaixaPreco] = useState<string>('');
  const [regiaoReferencia, setRegiaoReferencia] = useState<string>('');
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        loadUserAddresses(user.id);
      }
    };
    checkUser();
  }, []);

  const loadUserAddresses = async (userId: string) => {
    try {
      const addresses = await AddressService.getUserAddresses(userId);
      setUserAddresses(addresses);
    } catch (error) {
      console.error('Erro ao carregar endereços:', error);
    }
  };

  const faixasPreco = intencao === 'alugar' ? FAIXAS_PRECO_ALUGUEL : FAIXAS_PRECO_COMPRA;
  const tipoImovel = intencao === 'alugar' ? 'alugar' : 'comprar';

  const handleSubmit = () => {
    if (faixaPreco && regiaoReferencia.trim()) {
      onComplete(faixaPreco, regiaoReferencia.trim());
    }
  };

  const isFormValid = faixaPreco && regiaoReferencia.trim();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Suas Preferências</CardTitle>
        <CardDescription>
          Informe sua faixa de preço e região de interesse para {tipoImovel}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="faixa-preco">
            Faixa de preço para {tipoImovel}
          </Label>
          <Select value={faixaPreco} onValueChange={setFaixaPreco}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione sua faixa de preço" />
            </SelectTrigger>
            <SelectContent>
              {faixasPreco.map((faixa) => (
                <SelectItem key={faixa} value={faixa}>
                  {faixa}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <RegiaoSelector
          value={regiaoReferencia}
          onChange={setRegiaoReferencia}
          placeholder="Ex: Vila Madalena, São Paulo, Centro..."
        />

        {/* Seção de endereços pessoais */}
        <div className="border-t pt-6">
          <AddressSelector
            userAddresses={userAddresses}
            onAddressesChange={() => userId && loadUserAddresses(userId)}
            isEmbedded
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Voltar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isFormValid}
            className="flex-1"
          >
            Finalizar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};