import { Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProBadgeProps {
  className?: string;
}

export const ProBadge = ({ className = "" }: ProBadgeProps) => {
  return (
    <Badge 
      variant="secondary" 
      className={`bg-gradient-to-r from-amber-500 to-orange-500 text-white border-none ${className}`}
    >
      <Crown className="w-3 h-3 mr-1" />
      PRO
    </Badge>
  );
};