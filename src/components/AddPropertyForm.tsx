import React, { useState } from 'react';
import { Property, PropertyScores, DEFAULT_WEIGHTS } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { X, Link, Plus, Calculator, AlertCircle, Info } from 'lucide-react';
import { calculateFinalScore } from '@/utils/scoreCalculator';
import { extractPropertyFromUrl } from '@/utils/propertyExtractor';
import { useToast } from '@/hooks/use-toast';

interface AddPropertyFormProps {
  onSubmit: (property: Property) => void;
  onCancel: () => void;
}

export const AddPropertyForm: React.FC<AddPropertyFormProps> = ({
  onSubmit,
  onCancel
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    address: '',
    bedrooms: 1,
    bathrooms: 1,
    parkingSpaces: 0,
    area: 0,
    floor: '',
    rent: 0,
    condo: 0,
    iptu: 0,
    fireInsurance: 50, // Valor padrão sugerido
    otherFees: 0,
    sourceUrl: ''
  });

  const [scores, setScores] = useState<PropertyScores>({
    location: 5,
    internalSpace: 5,
    furniture: 5,
    accessibility: 5,
    finishing: 5,
    price: 5
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleScoreChange = (criterion: keyof PropertyScores, value: number) => {
    setScores(prev => ({
      ...prev,
      [criterion]: Math.max(0, Math.min(10, value))
    }));
  };

  const handleExtractFromUrl = async () => {
    if (!urlInput.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma URL válida",
        variant: "destructive"
      });
      return;
    }

    console.log('Iniciando extração para URL:', urlInput);
    setIsLoading(true);
    
    try {
      const extractedData = await extractPropertyFromUrl(urlInput);
      console.log('Dados extraídos com sucesso:', extractedData);
      
      setFormData(prev => ({
        ...prev,
        ...extractedData,
        sourceUrl: urlInput
      }));
      
      toast({
        title: "Sucesso!",
        description: "Dados extraídos e preenchidos automaticamente. Revise as informações antes de salvar.",
      });
      
    } catch (error) {
      console.error('Erro ao extrair dados:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast({
        title: "Aviso",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Define a URL mesmo se a extração falhar
      setFormData(prev => ({
        ...prev,
        sourceUrl: urlInput
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotalCost = () => {
    return formData.rent + formData.condo + formData.iptu + formData.fireInsurance + formData.otherFees;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.address.trim() || formData.rent <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }
    
    const property: Property = {
      id: Date.now().toString(),
      ...formData,
      totalMonthlyCost: calculateTotalCost(),
      images: [], // TODO: Implementar extração de imagens
      scores,
      finalScore: calculateFinalScore(scores, DEFAULT_WEIGHTS)
    };

    console.log('Propriedade criada:', property);
    onSubmit(property);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Adicionar Imóvel</h2>
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Extração por URL */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-start space-x-2 mb-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <Label className="text-sm font-medium mb-1 flex items-center text-blue-800">
                    <Link className="h-4 w-4 mr-2" />
                    Extrair dados do anúncio (Funcionalidade Simulada)
                  </Label>
                  <p className="text-xs text-blue-700 mb-3">
                    Esta é uma simulação para demonstração. Os dados são preenchidos automaticamente com base no domínio do site (Zap, OLX, QuintoAndar, etc.).
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Cole o link do anúncio (ex: https://www.zapimoveis.com.br/...)"
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  onClick={handleExtractFromUrl}
                  disabled={isLoading}
                  variant="outline"
                  className="whitespace-nowrap"
                >
                  {isLoading ? 'Extraindo...' : 'Extrair'}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Informações básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações Básicas</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título*</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                    placeholder="Ex: Apartamento 2 quartos em Pinheiros"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Endereço*</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    required
                    placeholder="Ex: Rua Augusta, 123 - Jardins, São Paulo"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Quartos</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    min="0"
                    value={formData.bedrooms}
                    onChange={(e) => handleInputChange('bedrooms', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="bathrooms">Banheiros</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    min="0"
                    value={formData.bathrooms}
                    onChange={(e) => handleInputChange('bathrooms', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="parkingSpaces">Vagas</Label>
                  <Input
                    id="parkingSpaces"
                    type="number"
                    min="0"
                    value={formData.parkingSpaces}
                    onChange={(e) => handleInputChange('parkingSpaces', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="area">Área (m²)</Label>
                  <Input
                    id="area"
                    type="number"
                    min="0"
                    value={formData.area}
                    onChange={(e) => handleInputChange('area', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="floor">Andar</Label>
                <Input
                  id="floor"
                  value={formData.floor}
                  onChange={(e) => handleInputChange('floor', e.target.value)}
                  placeholder="Ex: 5º andar, Térreo, Cobertura"
                />
              </div>
            </div>

            <Separator />

            {/* Custos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Custos Mensais
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="rent">Aluguel (R$)*</Label>
                  <Input
                    id="rent"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.rent}
                    onChange={(e) => handleInputChange('rent', parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="condo">Condomínio (R$)</Label>
                  <Input
                    id="condo"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.condo}
                    onChange={(e) => handleInputChange('condo', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="iptu">IPTU (R$)</Label>
                  <Input
                    id="iptu"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.iptu}
                    onChange={(e) => handleInputChange('iptu', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="fireInsurance">Seguro Incêndio (R$)</Label>
                  <Input
                    id="fireInsurance"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.fireInsurance}
                    onChange={(e) => handleInputChange('fireInsurance', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="otherFees">Outras Taxas (R$)</Label>
                  <Input
                    id="otherFees"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.otherFees}
                    onChange={(e) => handleInputChange('otherFees', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="flex items-end">
                  <div className="w-full">
                    <Label>Total Mensal</Label>
                    <div className="h-10 bg-gray-100 rounded-md px-3 flex items-center font-semibold text-blue-600">
                      R$ {calculateTotalCost().toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Pontuações */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Avaliação (0-10)</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Localização</Label>
                  <Input
                    id="location"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={scores.location}
                    onChange={(e) => handleScoreChange('location', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="internalSpace">Espaço Interno</Label>
                  <Input
                    id="internalSpace"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={scores.internalSpace}
                    onChange={(e) => handleScoreChange('internalSpace', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="furniture">Mobília</Label>
                  <Input
                    id="furniture"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={scores.furniture}
                    onChange={(e) => handleScoreChange('furniture', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="accessibility">Acessibilidade</Label>
                  <Input
                    id="accessibility"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={scores.accessibility}
                    onChange={(e) => handleScoreChange('accessibility', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="finishing">Acabamento</Label>
                  <Input
                    id="finishing"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={scores.finishing}
                    onChange={(e) => handleScoreChange('finishing', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="price">Preço</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={scores.price}
                    onChange={(e) => handleScoreChange('price', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-3 pt-6">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Imóvel
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};
