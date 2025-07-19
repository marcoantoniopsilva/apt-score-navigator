import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useState } from "react";
import { toast } from "sonner";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UpgradeModal = ({ open, onOpenChange }: UpgradeModalProps) => {
  const { createCheckout } = useSubscription();
  const [loading, setLoading] = useState<'monthly' | 'annual' | null>(null);

  const handleUpgrade = async (planType: 'monthly' | 'annual') => {
    try {
      setLoading(planType);
      await createCheckout(planType);
      toast.success('Redirecionando para o checkout...');
    } catch (error) {
      console.error('Error upgrading:', error);
      toast.error('Erro ao processar upgrade. Tente novamente.');
    } finally {
      setLoading(null);
    }
  };

  const proFeatures = [
    "Propriedades ilimitadas",
    "Resumo de localização com IA",
    "Exportação para PDF",
    "Comparação lado a lado",
    "Filtros avançados",
    "Suporte prioritário"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Crown className="w-6 h-6 text-amber-500" />
            Upgrade para o Plano Pro
          </DialogTitle>
          <DialogDescription>
            Desbloqueie todas as funcionalidades avançadas e maximize sua busca por imóveis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Features List */}
          <div className="grid gap-3">
            <h3 className="font-semibold mb-2">O que você terá com o Pro:</h3>
            {proFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {/* Pricing Plans */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Monthly Plan */}
            <div className="border rounded-lg p-6 space-y-4">
              <div className="text-center">
                <h4 className="font-semibold text-lg">Plano Mensal</h4>
                <div className="mt-2">
                  <span className="text-3xl font-bold">R$ 19,90</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </div>
              <Button 
                onClick={() => handleUpgrade('monthly')}
                disabled={loading !== null}
                className="w-full"
                variant="outline"
              >
                {loading === 'monthly' ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    Processando...
                  </div>
                ) : (
                  'Escolher Mensal'
                )}
              </Button>
            </div>

            {/* Annual Plan */}
            <div className="border rounded-lg p-6 space-y-4 relative">
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-500">
                <Zap className="w-3 h-3 mr-1" />
                Melhor valor
              </Badge>
              <div className="text-center">
                <h4 className="font-semibold text-lg">Plano Anual</h4>
                <div className="mt-2">
                  <span className="text-3xl font-bold">R$ 199,00</span>
                  <span className="text-muted-foreground">/ano</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  Economize R$ 39,80 por ano
                </p>
              </div>
              <Button 
                onClick={() => handleUpgrade('annual')}
                disabled={loading !== null}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                {loading === 'annual' ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    Processando...
                  </div>
                ) : (
                  'Escolher Anual'
                )}
              </Button>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Cancele a qualquer momento. Sem taxas ocultas.</p>
            <p>Processamento seguro via Stripe.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};