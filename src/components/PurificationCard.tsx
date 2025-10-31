import { Card } from "@/components/ui/card";
import { Beaker, Filter, Zap, ThermometerSun } from "lucide-react";

interface PurificationCardProps {
  phValue: number;
  turbidityValue: number;
}

const PurificationCard = ({ phValue, turbidityValue }: PurificationCardProps) => {
  const recommendations = [];
  
  if (phValue < 6.5) {
    recommendations.push({
      icon: Beaker,
      title: "pH Neutralization",
      description: "Water is too acidic. Use pH neutralizers or baking soda to increase pH levels.",
    });
  } else if (phValue > 8.5) {
    recommendations.push({
      icon: Beaker,
      title: "pH Adjustment",
      description: "Water is too alkaline. Use pH reducers or citric acid to lower pH levels.",
    });
  }
  
  if (turbidityValue > 5) {
    recommendations.push({
      icon: Filter,
      title: "Filtration Required",
      description: "High turbidity detected. Use sediment filters or activated carbon filtration.",
    });
  }
  
  if (turbidityValue > 10) {
    recommendations.push({
      icon: Zap,
      title: "Coagulation & Flocculation",
      description: "Very high turbidity. Consider using alum or other coagulants before filtration.",
    });
  }
  
  if (recommendations.length === 0) {
    recommendations.push({
      icon: ThermometerSun,
      title: "Standard Maintenance",
      description: "Water quality is good. Continue regular monitoring and basic filtration.",
    });
  }
  
  return (
    <Card className="glass-card p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Filter className="w-5 h-5 text-primary" />
        Recommended Purification Methods
      </h3>
      
      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <div 
            key={index}
            className="flex gap-4 p-4 rounded-lg bg-card/50 hover:bg-card/80 transition-colors"
          >
            <div className="p-3 rounded-lg bg-primary/10">
              <rec.icon className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1">{rec.title}</h4>
              <p className="text-sm text-muted-foreground">{rec.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default PurificationCard;
