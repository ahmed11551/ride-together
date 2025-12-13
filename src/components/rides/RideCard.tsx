import { MapPin, Clock, Star, Users, Cigarette, Music, Dog, ChevronRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { OptimizedImage } from "@/components/ui/optimized-image";

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
      <div className="p-3 sm:p-5 border-b border-border">
        <div className="flex items-start gap-2 sm:gap-4">
          <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-success ring-2 sm:ring-4 ring-success-light" />
            <div className="w-0.5 h-8 sm:h-12 bg-gradient-to-b from-success via-border to-secondary" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-secondary ring-2 sm:ring-4 ring-warning-light" />
          </div>
          
          <div className="flex-1 min-w-0 space-y-2 sm:space-y-4">
            <div>
              <p className="font-bold text-sm sm:text-base text-foreground truncate">{ride.fromCity}</p>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{ride.from}</p>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-1 text-xs sm:text-sm text-muted-foreground">
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="font-medium">{ride.time}</span>
              </div>
            </div>
            
            <div>
              <p className="font-bold text-sm sm:text-base text-foreground truncate">{ride.toCity}</p>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{ride.to}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{ride.duration}</p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-xl sm:text-2xl font-extrabold text-primary">{ride.price.toLocaleString()}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">₽ / место</p>
          </div>
        </div>
      </div>

      {/* Driver Section */}
      <div className="p-3 sm:p-5 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="relative shrink-0">
            <OptimizedImage
              src={ride.driver.avatar}
              alt={ride.driver.name}
              fallback={`https://ui-avatars.com/api/?name=${encodeURIComponent(ride.driver.name)}&background=0d9488&color=fff`}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-border group-hover:border-primary transition-colors"
              showPlaceholder={true}
            />
            {ride.driver.verified && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-primary flex items-center justify-center ring-2 ring-card">
                <span className="text-[8px] sm:text-[10px] text-primary-foreground">✓</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap">
              <p className="font-semibold text-foreground text-xs sm:text-sm truncate">{ride.driver.name}</p>
              {ride.driver.verified && (
                <Badge 
                  variant="soft" 
                  className="gap-1 px-1 sm:px-1.5 py-0 text-[9px] sm:text-[10px] bg-primary/10 text-primary border-primary/20 shrink-0"
                  title="Проверенный водитель - документы верифицированы"
                >
                  <ShieldCheck className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                  <span className="hidden sm:inline">Проверен</span>
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs flex-wrap">
              <div className="flex items-center gap-0.5 text-warning">
                <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                <span className="font-semibold">{ride.driver.rating.toFixed(1)}</span>
              </div>
              <span className="text-muted-foreground">• {ride.driver.trips} {ride.driver.trips === 1 ? 'поездка' : ride.driver.trips < 5 ? 'поездки' : 'поездок'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg bg-primary-light text-primary text-[10px] sm:text-xs font-semibold">
              <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{ride.seats}</span>
            </div>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideCard;
