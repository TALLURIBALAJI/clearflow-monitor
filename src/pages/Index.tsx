import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SensorCard from "@/components/SensorCard";
import StatusCard from "@/components/StatusCard";
import PurificationCard from "@/components/PurificationCard";
import DataChart from "@/components/DataChart";
import { Activity, Droplet } from "lucide-react";

const Index = () => {
  // Mock sensor data - replace with real ESP32 data later
  const [phValue, setPhValue] = useState(7.2);
  const [turbidityValue, setTurbidityValue] = useState(4.5);
  
  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPhValue(6.5 + Math.random() * 2); // Range: 6.5-8.5
      setTurbidityValue(2 + Math.random() * 8); // Range: 2-10 NTU
    }, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Determine if water is safe
  const isSafe = phValue >= 6.5 && phValue <= 8.5 && turbidityValue <= 5;
  
  return (
    <div className="min-h-screen flex flex-col water-ripple">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-24">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Hero Status */}
          <div className="animate-float">
            <StatusCard 
              isSafe={isSafe} 
              phValue={phValue} 
              turbidityValue={turbidityValue} 
            />
          </div>
          
          {/* Sensor Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <SensorCard
              title="pH Level"
              value={phValue}
              unit="pH"
              icon={Activity}
              min={0}
              max={14}
              optimal={{ min: 6.5, max: 8.5 }}
            />
            <SensorCard
              title="Turbidity"
              value={turbidityValue}
              unit="NTU"
              icon={Droplet}
              min={0}
              max={20}
              optimal={{ min: 0, max: 5 }}
            />
          </div>
          
          {/* Purification Recommendations */}
          <PurificationCard phValue={phValue} turbidityValue={turbidityValue} />
          
          {/* Historical Data Chart */}
          <DataChart />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
