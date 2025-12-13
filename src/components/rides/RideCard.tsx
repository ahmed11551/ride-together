import { MapPin, Clock, Star, Users, Cigarette, Music, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RideCardProps {
  ride: {
    id: number;
    driver: {
      name: string;
      avatar: string;
      rating: number;
      trips: number;
      verified: boolean;
    };
    from: string;
    to: string;
    date: string;
    time: string;
    duration: string;
    price: number;
    seats: number;
    features: string[];
    car: string;
  };
  onSelect?: () => void;
}

const RideCard = ({ ride, onSelect }: RideCardProps) => {
  const featureIcons: Record<string, typeof Cigarette> = {
    noSmoking: Cigarette,
    music: Music,
    chat: MessageCircle,
  };

  return (
    <div 
      className="bg-card rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden cursor-pointer group animate-fade-in"
      onClick={onSelect}
    >
      {/* Route Section */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-1 pt-1">
            <div className="w-3 h-3 rounded-full bg-success" />
            <div className="w-0.5 h-8 bg-border" />
            <div className="w-3 h-3 rounded-full bg-secondary" />
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <p className="font-semibold text-foreground">{ride.from}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{ride.time}</span>
              </div>
            </div>
            
            <div>
              <p className="font-semibold text-foreground">{ride.to}</p>
              <p className="text-sm text-muted-foreground">{ride.duration}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{ride.price} ₽</p>
            <p className="text-sm text-muted-foreground">за место</p>
          </div>
        </div>
      </div>

      {/* Driver Section */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={ride.driver.avatar} 
              alt={ride.driver.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-border"
            />
            {ride.driver.verified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <span className="text-xs text-primary-foreground">✓</span>
              </div>
            )}
          </div>
          
          <div>
            <p className="font-semibold text-foreground">{ride.driver.name}</p>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1 text-warning">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-medium">{ride.driver.rating}</span>
              </div>
              <span className="text-muted-foreground">• {ride.driver.trips} поездок</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">{ride.seats}</span>
          </div>
          
          <Button variant="soft" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            Детали
          </Button>
        </div>
      </div>

      {/* Car & Features */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{ride.car}</p>
        <div className="flex items-center gap-2">
          {ride.features.slice(0, 3).map((feature) => {
            const Icon = featureIcons[feature] || MessageCircle;
            return (
              <div 
                key={feature}
                className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center"
              >
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RideCard;
