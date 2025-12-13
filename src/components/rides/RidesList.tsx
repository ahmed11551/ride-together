import { useNavigate } from "react-router-dom";
import { useRecentRides } from "@/hooks/useRides";
import RideCard from "./RideCard";
import { RideCardSkeleton } from "@/components/ui/skeleton-loaders";
import EmptyState from "@/components/ui/empty-state";
import { SlidersHorizontal, Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const RidesList = () => {
  const navigate = useNavigate();
  const { data: rides, isLoading } = useRecentRides();

  if (isLoading) {
    return (
      <section className="py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-7 w-48 bg-muted rounded-lg animate-shimmer mb-2" />
            <div className="h-5 w-32 bg-muted rounded-lg animate-shimmer" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <RideCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (!rides || rides.length === 0) {
    return (
      <section className="py-8">
        <EmptyState
          icon={Search}
          title="Поездок пока нет"
          description="Станьте первым водителем или проверьте позже"
          action={{
            label: "Создать поездку",
            onClick: () => navigate("/create-ride"),
          }}
        />
      </section>
    );
  }

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Ближайшие поездки</h2>
          <p className="text-muted-foreground">{rides.length} поездок доступно</p>
        </div>
        
        <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/search")}>
          <SlidersHorizontal className="w-4 h-4" />
          Фильтры
        </Button>
      </div>

      <div className="space-y-4">
        {rides.slice(0, 5).map((ride, index) => (
          <div 
            key={ride.id}
            style={{ animationDelay: `${index * 80}ms` }}
            className="animate-slide-up"
          >
            <RideCard 
              ride={{
                id: ride.id,
                driver: {
                  name: ride.driver?.full_name || "Водитель",
                  avatar: ride.driver?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(ride.driver?.full_name || "U")}&background=0d9488&color=fff`,
                  rating: ride.driver?.rating || 5,
                  trips: ride.driver?.trips_count || 0,
                  verified: ride.driver?.is_verified || false,
                },
                from: ride.from_address,
                to: ride.to_address,
                fromCity: ride.from_city,
                toCity: ride.to_city,
                date: ride.departure_date,
                time: ride.departure_time.slice(0, 5),
                duration: ride.estimated_duration || "—",
                price: ride.price,
                seats: ride.seats_available,
                features: {
                  noSmoking: !ride.allow_smoking,
                  music: ride.allow_music,
                  pets: ride.allow_pets,
                },
              }}
              onSelect={() => navigate(`/ride/${ride.id}`)}
            />
          </div>
        ))}
      </div>

      {rides.length > 5 && (
        <div className="mt-6 text-center">
          <Button variant="soft" onClick={() => navigate("/search")}>
            Показать все поездки
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </section>
  );
};

export default RidesList;
