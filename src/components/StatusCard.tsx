import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle } from "lucide-react";

interface StatusCardProps {
  isSafe: boolean;
  phValue: number;
  turbidityValue: number;
}

const StatusCard = ({ isSafe, phValue, turbidityValue }: StatusCardProps) => {
  return (
    <Card className={`glass-card p-8 text-center ${
      isSafe ? 'border-success/50' : 'border-destructive/50'
    } animate-pulse-glow`}>
      <div className="flex flex-col items-center gap-4">
        <div className={`p-4 rounded-full ${
          isSafe ? 'bg-success/20' : 'bg-destructive/20'
        }`}>
          {isSafe ? (
            <Shield className="w-12 h-12 text-success" />
          ) : (
            <AlertTriangle className="w-12 h-12 text-destructive" />
          )}
        </div>
        
        <div>
          <h2 className="text-3xl font-bold mb-2">Water Quality Status</h2>
          <Badge 
            variant={isSafe ? "default" : "destructive"}
            className="text-lg px-6 py-2"
          >
            {isSafe ? "✓ SAFE TO USE" : "✗ UNSAFE - NEEDS PURIFICATION"}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground max-w-md">
          {isSafe 
            ? "Water parameters are within safe limits. Suitable for consumption and daily use."
            : "Water quality is compromised. Please review purification recommendations below."}
        </p>
      </div>
    </Card>
  );
};

export default StatusCard;
