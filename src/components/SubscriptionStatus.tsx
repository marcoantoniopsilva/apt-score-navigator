import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Settings, RefreshCw } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { ProBadge } from "./ProBadge";
import { UpgradeModal } from "./UpgradeModal";
import { useState } from "react";
import { toast } from "sonner";

export const SubscriptionStatus = () => {
  const { 
    isPro, 
    subscription_tier, 
    subscription_end, 
    loading, 
    checkSubscription, 
    openCustomerPortal 
  } = useSubscription();
  
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (refreshing) return; // Prevent multiple concurrent refreshes
    
    try {
      setRefreshing(true);
      await checkSubscription();
      toast.success('Status da assinatura atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar status da assinatura');
    } finally {
      setRefreshing(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      await openCustomerPortal();
    } catch (error) {
      toast.error('Erro ao abrir portal de gerenciamento');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-muted-foreground">Carregando plano...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {isPro ? (
                <>
                  <Crown className="w-5 h-5 text-amber-500" />
                  Plano Pro Ativo
                </>
              ) : (
                <>
                  Plano Gratuito
                </>
              )}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            {isPro ? (
              <ProBadge />
            ) : (
              <Badge variant="outline">Gratuito</Badge>
            )}
            {subscription_tier && (
              <Badge variant="secondary">{subscription_tier}</Badge>
            )}
          </div>

          {isPro && subscription_end && (
            <p className="text-sm text-muted-foreground">
              Renovação: {new Date(subscription_end).toLocaleDateString('pt-BR')}
            </p>
          )}

          <div className="flex gap-2">
            {isPro ? (
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Gerenciar Assinatura
              </Button>
            ) : (
              <Button
                onClick={() => setShowUpgradeModal(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 flex items-center gap-2"
              >
                <Crown className="w-4 h-4" />
                Upgrade para Pro
              </Button>
            )}
          </div>

          {!isPro && (
            <div className="text-xs text-muted-foreground">
              <p>• Até 5 propriedades</p>
              <p>• Funcionalidades básicas</p>
            </div>
          )}
        </CardContent>
      </Card>

      <UpgradeModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal} 
      />
    </>
  );
};