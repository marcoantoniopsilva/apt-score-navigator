import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

interface ValidationSummaryProps {
  acceptedCount: number;
  rejectedCount: number;
  commonViolations?: string[];
  onRetrySearch?: () => void;
}

export const PropertyValidationSummary = ({ 
  acceptedCount, 
  rejectedCount, 
  commonViolations = [],
  onRetrySearch 
}: ValidationSummaryProps) => {
  if (acceptedCount === 0 && rejectedCount === 0) return null;

  const totalProperties = acceptedCount + rejectedCount;
  const successRate = Math.round((acceptedCount / totalProperties) * 100);

  return (
    <div className="space-y-3">
      {/* Status geral */}
      <div className="flex items-center gap-2 text-sm">
        <Badge variant="secondary" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3 text-emerald-600" />
          {acceptedCount} aceitos
        </Badge>
        {rejectedCount > 0 && (
          <Badge variant="outline" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-amber-600" />
            {rejectedCount} rejeitados
          </Badge>
        )}
        <span className="text-muted-foreground">
          Taxa de compatibilidade: {successRate}%
        </span>
      </div>

      {/* Alertas baseados na performance */}
      {successRate < 50 && rejectedCount > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Muitos imóveis rejeitados</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              {rejectedCount} de {totalProperties} imóveis não atendem aos seus critérios.
            </p>
            {commonViolations.length > 0 && (
              <div>
                <p className="font-medium text-sm">Problemas principais:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {commonViolations.slice(0, 3).map((violation, index) => (
                    <li key={index}>{violation}</li>
                  ))}
                </ul>
              </div>
            )}
            {onRetrySearch && (
              <button 
                onClick={onRetrySearch}
                className="text-sm underline hover:no-underline"
              >
                Tentar busca com critérios mais flexíveis
              </button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {successRate >= 50 && successRate < 80 && rejectedCount > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Alguns imóveis rejeitados</AlertTitle>
          <AlertDescription>
            {rejectedCount} imóveis não atenderam completamente aos seus critérios, 
            mas encontramos {acceptedCount} opções compatíveis.
          </AlertDescription>
        </Alert>
      )}

      {successRate >= 80 && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <AlertTitle className="text-emerald-800">Ótima compatibilidade!</AlertTitle>
          <AlertDescription className="text-emerald-700">
            A maioria dos imóveis encontrados atende aos seus critérios.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};