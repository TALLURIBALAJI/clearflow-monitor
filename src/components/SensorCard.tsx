import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LucideIcon } from "lucide-react";

interface SensorCardProps {
  title: string;
  value: number;
  unit: string;
  icon: LucideIcon;
  min: number;
  max: number;
  optimal: { min: number; max: number };
}

const SensorCard = ({ title, value, unit, icon: Icon, min, max, optimal }: SensorCardProps) => {
  const percentage = ((value - min) / (max - min)) * 100;
  const isOptimal = value >= optimal.min && value <= optimal.max;
  
  return (
    <Card className="glass-card p-6 hover:scale-105 transition-transform duration-300 animate-float">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {value.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">{unit}</span>
          </div>
        </div>
        <div className={`p-3 rounded-xl ${isOptimal ? 'bg-success/20' : 'bg-warning/20'}`}>
          <Icon className={`w-6 h-6 ${isOptimal ? 'text-success' : 'text-warning'}`} />
        </div>
      </div>
      
      <div className="space-y-2">
        <Progress value={percentage} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{min}</span>
          <span className="font-medium">Optimal: {optimal.min}-{optimal.max}</span>
          <span>{max}</span>
        </div>
      </div>
      
      <div className={`mt-4 px-3 py-2 rounded-lg text-xs font-medium text-center ${
        isOptimal 
          ? 'bg-success/10 text-success' 
          : 'bg-warning/10 text-warning'
      }`}>
        {isOptimal ? '✓ Optimal Range' : '⚠ Out of Range'}
      </div>
    </Card>
  );
};

export default SensorCard;
