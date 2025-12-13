import { MapPin, Clock, Star, Users, Cigarette, Music, Dog, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface RideCardProps {
  ride: {
    id: string;
    driver: {
      name: string;
      avatar: string;
      rating: number;
      trips: number;
      verified: boolean;
    };
    from: string;
    to: string;
    fromCity: string;
    toCity: string;
    date: string;
    time: string;
    duration: string;
    price: number;
    seats: number;
    features: {
      noSmoking: boolean;
      music: boolean;
      pets: boolean;
    };
  };
  onSelect?: () => void;
  className?: string;
}

const RideCard = ({ ride, onSelect, className }: RideCardProps) => {
  return (
    <div 
      className={cn(
        "bg-card rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden cursor-pointer group focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
        className
      )}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Поездка из ${ride.fromCity} в ${ride.toCity}, цена ${ride.price.toLocaleString()} ₽`}
    >
      {/* Route Section */}
      <div className="p-5 border-b border-border">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
            <div className="w-3 h-3 rounded-full bg-success ring-4 ring-success-light" />
            <div className="w-0.5 h-12 bg-gradient-to-b from-success via-border to-secondary" />
            <div className="w-3 h-3 rounded-full bg-secondary ring-4 ring-warning-light" />
          </div>
          
          <div className="flex-1 min-w-0 space-y-4">
            <div>
              <p className="font-bold text-foreground truncate">{ride.fromCity}</p>
              <p className="text-sm text-muted-foreground truncate">{ride.from}</p>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-medium">{ride.time}</span>
              </div>
            </div>
            
            <div>
              <p className="font-bold text-foreground truncate">{ride.toCity}</p>
              <p className="text-sm text-muted-foreground truncate">{ride.to}</p>
              <p className="text-xs text-muted-foreground mt-1">{ride.duration}</p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-2xl font-extrabold text-primary">{ride.price.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">₽ / место</p>
          </div>
        </div>
      </div>

      {/* Driver Section */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={ride.driver.avatar} 
              alt={ride.driver.name}
              className="w-11 h-11 rounded-full object-cover border-2 border-border group-hover:border-primary transition-colors"
            />
            {ride.driver.verified && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center ring-2 ring-card">
                <span className="text-[10px] text-primary-foreground">✓</span>
              </div>
            )}
          </div>
          
          <div>
            <p className="font-semibold text-foreground text-sm">{ride.driver.name}</p>
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-0.5 text-warning">
                <Star className="w-3 h-3 fill-current" />
                <span className="font-semibold">{ride.driver.rating.toFixed(1)}</span>
              </div>
              <span className="text-muted-foreground">• {ride.driver.trips} поездок</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Features */}
          <div className="hidden sm:flex items-center gap-1.5">
            {!ride.features.noSmoking && (
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center" title="Курить нельзя">
                <Cigarette className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            )}
            {ride.features.music && (
              <div className="w-7 h-7 rounded-lg bg-success-light flex items-center justify-center" title="Музыка">
                <Music className="w-3.5 h-3.5 text-success" />
              </div>
            )}
            {ride.features.pets && (
              <div className="w-7 h-7 rounded-lg bg-info-light flex items-center justify-center" title="С питомцами">
                <Dog className="w-3.5 h-3.5 text-info" />
              </div>
            )}
          </div>

          {/* Seats & Arrow */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary-light text-primary text-xs font-semibold">
              <Users className="w-3.5 h-3.5" />
              <span>{ride.seats}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideCard;
