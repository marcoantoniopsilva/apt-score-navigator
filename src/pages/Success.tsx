import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Crown } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';

export default function Success() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkSubscription } = useSubscription();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Check subscription status after successful payment
    const updateSubscription = async () => {
      try {
        await checkSubscription();
        toast.success('Assinatura ativada com sucesso!');
      } catch (error) {
        console.error('Error updating subscription:', error);
      }
    };

    if (sessionId) {
      updateSubscription();
    }
  }, [sessionId, checkSubscription]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-green-800">
            Pagamento Realizado!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Crown className="w-5 h-5 text-amber-500" />
            <span className="font-semibold text-amber-700">Bem-vindo ao Pro!</span>
          </div>
          
          <p className="text-muted-foreground">
            Sua assinatura foi ativada com sucesso. Agora você tem acesso a todas as funcionalidades Pro.
          </p>
          
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h3 className="font-semibold text-amber-800 mb-2">Agora você pode:</h3>
            <ul className="text-sm text-amber-700 space-y-1 text-left">
              <li>• Adicionar propriedades ilimitadas</li>
              <li>• Usar resumo de localização com IA</li>
              <li>• Exportar relatórios em PDF</li>
              <li>• Usar comparação lado a lado</li>
            </ul>
          </div>

          <Button 
            onClick={() => navigate('/')} 
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            Voltar ao App
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}