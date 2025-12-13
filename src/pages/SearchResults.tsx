import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useSearchRides } from "@/hooks/useRides";
import { Button } from "@/components/ui/button";
import RideCard from "@/components/rides/RideCard";
import SearchForm from "@/components/search/SearchForm";
import EmptyState from "@/components/ui/empty-state";
import { RideCardSkeleton } from "@/components/ui/skeleton-loaders";
import { RidesMap } from "@/components/map/RidesMap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, SlidersHorizontal, Search, X, Map as MapIcon, List } from "lucide-react";
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
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container flex h-16 items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/")}
            aria-label="Вернуться на главную"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">
              {from || "Любой город"} → {to || "Любой город"}
            </p>
            <p className="text-xs text-muted-foreground">
              {formattedDate} • {passengers} пассажир{passengers > 1 ? (passengers < 5 ? 'а' : 'ов') : ''}
            </p>
          </div>
          <Button 
            variant={showFilters ? "soft" : "outline"} 
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            aria-label={showFilters ? "Скрыть фильтры" : "Показать фильтры"}
            aria-expanded={showFilters}
          >
            {showFilters ? <X className="w-5 h-5" /> : <SlidersHorizontal className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* Filters */}
      {showFilters && (
        <div className="container py-4 border-b border-border animate-slide-down">
          <SearchForm />
        </div>
      )}

      {/* Results */}
      <div className="container py-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="h-5 w-40 bg-muted rounded-lg animate-shimmer" />
            </div>
            {[1, 2, 3].map((i) => (
              <RideCardSkeleton key={i} />
            ))}
          </div>
        ) : rides && rides.length > 0 ? (
          <Tabs defaultValue="list" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <p className="text-muted-foreground text-sm">
                Найдено {rides.length} {rides.length === 1 ? 'поездка' : rides.length < 5 ? 'поездки' : 'поездок'}
              </p>
              <TabsList>
                <TabsTrigger value="list" className="gap-2">
                  <List className="w-4 h-4" />
                  Список
                </TabsTrigger>
                <TabsTrigger value="map" className="gap-2">
                  <MapIcon className="w-4 h-4" />
                  Карта
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="list" className="space-y-4 mt-4">
              {rides.map((ride, index) => (
                <div 
                  key={ride.id}
                  style={{ animationDelay: `${index * 60}ms` }}
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
            </TabsContent>
            
            <TabsContent value="map" className="mt-4">
              <div className="bg-card rounded-2xl p-4 shadow-card">
                <RidesMap rides={rides} height="600px" />
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Наведите на маркер, чтобы увидеть детали поездки
                </p>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <EmptyState
            icon={Search}
            title="Поездки не найдены"
            description="Попробуйте изменить параметры поиска или посмотрите другие даты"
            action={{
              label: "Изменить поиск",
              onClick: () => setShowFilters(true),
            }}
          />
        )}
      </div>
    </div>
  );
};

export default SearchResults;
