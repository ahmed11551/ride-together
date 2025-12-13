import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useSearchRides } from "@/hooks/useRides";
import { Button } from "@/components/ui/button";
import RideCard from "@/components/rides/RideCard";
import SearchForm from "@/components/search/SearchForm";
import { ArrowLeft, SlidersHorizontal, Search } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);

  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const date = searchParams.get("date") || "";
  const passengers = parseInt(searchParams.get("passengers") || "1");

  const { data: rides, isLoading } = useSearchRides({
    from,
    to,
    date,
    passengers,
  });

  const formattedDate = date 
    ? format(new Date(date), "d MMMM", { locale: ru })
    : "Любая дата";

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container flex h-16 items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <p className="font-semibold text-foreground">
              {from || "Любой город"} → {to || "Любой город"}
            </p>
            <p className="text-sm text-muted-foreground">
              {formattedDate} • {passengers} пассажир
            </p>
          </div>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Filters */}
      {showFilters && (
        <div className="container py-4 border-b border-border animate-slide-up">
          <SearchForm />
        </div>
      )}

      {/* Results */}
      <div className="container py-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl h-48 animate-pulse" />
            ))}
          </div>
        ) : rides && rides.length > 0 ? (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Найдено {rides.length} поездок
            </p>
            
            {rides.map((ride, index) => (
              <div 
                key={ride.id}
                style={{ animationDelay: `${index * 50}ms` }}
                className="animate-fade-in"
              >
                <RideCard 
                  ride={{
                    id: parseInt(ride.id.slice(0, 8), 16),
                    driver: {
                      name: (ride.driver as any)?.full_name || "Водитель",
                      avatar: (ride.driver as any)?.avatar_url || `https://ui-avatars.com/api/?name=U&background=0d9488&color=fff`,
                      rating: (ride.driver as any)?.rating || 5,
                      trips: (ride.driver as any)?.trips_count || 0,
                      verified: (ride.driver as any)?.is_verified || false,
                    },
                    from: ride.from_address,
                    to: ride.to_address,
                    date: ride.departure_date,
                    time: ride.departure_time.slice(0, 5),
                    duration: ride.estimated_duration || "—",
                    price: ride.price,
                    seats: ride.seats_available,
                    features: [
                      ...(ride.allow_music ? ["music"] : []),
                      ...(!ride.allow_smoking ? ["noSmoking"] : []),
                    ],
                    car: "Автомобиль",
                  }}
                  onSelect={() => navigate(`/ride/${ride.id}`)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2">Поездки не найдены</h2>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Попробуйте изменить параметры поиска или посмотрите другие даты
            </p>
            <Button onClick={() => setShowFilters(true)}>
              Изменить поиск
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
