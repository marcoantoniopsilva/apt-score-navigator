import React, { useState } from 'react';
import { Property } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';
import { extractPropertyFromUrl } from '@/utils/propertyExtractor';
import { useToast } from '@/hooks/use-toast';

interface AddPropertyFormProps {
  onSubmit: (property: Property) => void;
  onCancel: () => void;
}

export const AddPropertyForm: React.FC<AddPropertyFormProps> = ({ onSubmit, onCancel }) => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    address: '',
    bedrooms: 0,
    bathrooms: 0,
    parkingSpaces: 0,
    area: 0,
    floor: '',
    rent: 0,
    condo: 0,
    iptu: 0,
    fireInsurance: 0,
    otherFees: 0
  });

  const [scores, setScores] = useState({
    location: 5,
    internalSpace: 5,
    furniture: 5,
    accessibility: 5,
    finishing: 5,
    price: 5,
    condo: 5,
  });

  const handleExtractFromUrl = async () => {
    setIsExtracting(true);
    try {
      const data = await extractPropertyFromUrl(url);
      if (data) {
        setExtractedData(data);
        setFormData({
          title: data.title || '',
          address: data.address || '',
          bedrooms: data.bedrooms || 0,
          bathrooms: data.bathrooms || 0,
          parkingSpaces: data.parkingSpaces || 0,
          area: data.area || 0,
          floor: data.floor || '',
          rent: data.rent || 0,
          condo: data.condo || 0,
          iptu: data.iptu || 0,
          fireInsurance: data.fireInsurance || 0,
          otherFees: data.otherFees || 0
        });
        setScores({
          location: data.scores?.location || 5,
          internalSpace: data.scores?.internalSpace || 5,
          furniture: data.scores?.furniture || 5,
          accessibility: data.scores?.accessibility || 5,
          finishing: data.scores?.finishing || 5,
          price: data.scores?.price || 5,
          condo: data.scores?.condo || 5,
        });
        toast({
          title: "Dados extraídos",
          description: "Os dados do anúncio foram extraídos com sucesso.",
        });
      } else {
        toast({
          title: "Erro na extração",
          description: "Não foi possível extrair os dados do anúncio.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao extrair dados da URL:", error);
      toast({
        title: "Erro na extração",
        description: "Ocorreu um erro ao tentar extrair os dados do anúncio.",
        variant: "destructive"
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setScores(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newProperty: Property = {
      id: crypto.randomUUID(),
      title: formData.title,
      address: formData.address,
      bedrooms: Number(formData.bedrooms),
      bathrooms: Number(formData.bathrooms),
      parkingSpaces: Number(formData.parkingSpaces),
      area: Number(formData.area),
      floor: formData.floor,
      rent: Number(formData.rent),
      condo: Number(formData.condo),
      iptu: Number(formData.iptu),
      fireInsurance: Number(formData.fireInsurance),
      otherFees: Number(formData.otherFees),
      totalMonthlyCost: Number(formData.rent) + Number(formData.condo) + Number(formData.iptu) + Number(formData.fireInsurance) + Number(formData.otherFees),
      images: [],
      scores: scores,
      finalScore: 0
    };

    onSubmit(newProperty);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Adicionar Nova Propriedade</h2>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* URL Extraction Section */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <Label className="text-sm font-medium mb-2 block">
              Extrair dados de um anúncio (opcional)
            </Label>
            <div className="flex space-x-2">
              <Input
                type="url"
                placeholder="Cole a URL do anúncio aqui..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleExtractFromUrl}
                disabled={isExtracting || !url}
              >
                {isExtracting ? 'Extraindo...' : 'Extrair'}
              </Button>
            </div>
            {extractedData && (
              <p className="text-sm text-green-600 mt-2">
                Dados extraídos com sucesso! Revise e ajuste conforme necessário.
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* Property Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="bedrooms">Quartos</Label>
                <Input
                  id="bedrooms"
                  name="bedrooms"
                  type="number"
                  min="0"
                  value={formData.bedrooms}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="bathrooms">Banheiros</Label>
                <Input
                  id="bathrooms"
                  name="bathrooms"
                  type="number"
                  min="0"
                  value={formData.bathrooms}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="parkingSpaces">Vagas</Label>
                <Input
                  id="parkingSpaces"
                  name="parkingSpaces"
                  type="number"
                  min="0"
                  value={formData.parkingSpaces}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="area">Área (m²)</Label>
                <Input
                  id="area"
                  name="area"
                  type="number"
                  min="0"
                  value={formData.area}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="floor">Andar</Label>
              <Input
                id="floor"
                name="floor"
                value={formData.floor}
                onChange={handleInputChange}
              />
            </div>

            {/* Financial Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="rent">Aluguel (R$)</Label>
                <Input
                  id="rent"
                  name="rent"
                  type="number"
                  min="0"
                  value={formData.rent}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="condo">Condomínio (R$)</Label>
                <Input
                  id="condo"
                  name="condo"
                  type="number"
                  min="0"
                  value={formData.condo}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="iptu">IPTU (R$)</Label>
                <Input
                  id="iptu"
                  name="iptu"
                  type="number"
                  min="0"
                  value={formData.iptu}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="fireInsurance">Seguro Incêndio (R$)</Label>
                <Input
                  id="fireInsurance"
                  name="fireInsurance"
                  type="number"
                  min="0"
                  value={formData.fireInsurance}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="otherFees">Outras Taxas (R$)</Label>
                <Input
                  id="otherFees"
                  name="otherFees"
                  type="number"
                  min="0"
                  value={formData.otherFees}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* Scoring Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Avaliação por Critérios (0-10)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="location">Localização</Label>
                  <Input
                    id="location"
                    name="location"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={scores.location}
                    onChange={handleScoreChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="internalSpace">Espaço Interno</Label>
                  <Input
                    id="internalSpace"
                    name="internalSpace"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={scores.internalSpace}
                    onChange={handleScoreChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="furniture">Mobília</Label>
                  <Input
                    id="furniture"
                    name="furniture"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={scores.furniture}
                    onChange={handleScoreChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="accessibility">Acessibilidade</Label>
                  <Input
                    id="accessibility"
                    name="accessibility"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={scores.accessibility}
                    onChange={handleScoreChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="finishing">Acabamento</Label>
                  <Input
                    id="finishing"
                    name="finishing"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={scores.finishing}
                    onChange={handleScoreChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Preço</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={scores.price}
                    onChange={handleScoreChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="condo">Condomínio</Label>
                  <Input
                    id="condo"
                    name="condo"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={scores.condo}
                    onChange={handleScoreChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit">
                Adicionar Propriedade
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};
