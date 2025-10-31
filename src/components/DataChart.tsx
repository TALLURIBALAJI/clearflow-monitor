import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface DataPoint {
  time: string;
  ph: number;
  turbidity: number;
}

const DataChart = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  
  useEffect(() => {
    // Generate mock historical data
    const mockData: DataPoint[] = [];
    const now = new Date();
    
    for (let i = 9; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60000); // Every minute
      mockData.push({
        time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        ph: 6.5 + Math.random() * 2,
        turbidity: 3 + Math.random() * 4,
      });
    }
    
    setData(mockData);
  }, []);
  
  return (
    <Card className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Recent Readings
        </h3>
        <span className="text-xs text-muted-foreground">Last 10 minutes</span>
      </div>
      
      <div className="space-y-3">
        {data.map((point, index) => (
          <div key={index} className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground w-16">{point.time}</span>
            <div className="flex-1 flex gap-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">pH:</span>
                <span className="text-primary font-semibold">{point.ph.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Turbidity:</span>
                <span className="text-secondary font-semibold">{point.turbidity.toFixed(1)} NTU</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default DataChart;
