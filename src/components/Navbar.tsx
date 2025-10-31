import { Droplets } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-secondary animate-pulse-glow">
              <Droplets className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Smart Water Quality Monitor
              </h1>
              <p className="text-xs text-muted-foreground">Real-time IoT Analysis</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
