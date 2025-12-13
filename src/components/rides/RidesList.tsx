import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecentRidesPaginated } from "@/hooks/useRidesPaginated";
import RideCard from "./RideCard";
import { RideCardSkeleton } from "@/components/ui/skeleton-loaders";
import EmptyState from "@/components/ui/empty-state";
import { DemoRides } from "@/components/home/DemoRides";
import { SlidersHorizontal, Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { pluralizeRide } from "@/lib/pluralize";

const RidesList = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const { data: paginatedData, isLoading } = useRecentRidesPaginated({
    page: currentPage,
    pageSize: 5,
  });

  const rides = paginatedData?.data || [];
  const totalPages = paginatedData?.totalPages || 0;
  const total = paginatedData?.total || 0;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
      <>
        <DemoRides />
        <section className="py-8">
          <EmptyState
            icon={Search}
            title="Реальных поездок пока нет"
            description="Станьте первым водителем и создайте свою поездку!"
            action={{
              label: "Создать поездку",
              onClick: () => navigate("/create-ride"),
            }}
          />
        </section>
      </>
    );
  }

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Ближайшие поездки</h2>
          <p className="text-muted-foreground">
            {total} {pluralizeRide(total)} доступно
            {totalPages > 1 && ` • Страница ${currentPage} из ${totalPages}`}
          </p>
        </div>
        
        <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/search")}>
          <SlidersHorizontal className="w-4 h-4" />
          Фильтры
        </Button>
      </div>

      <div className="space-y-4">
        {rides.map((ride, index) => (
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

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {total > 5 && (
        <div className="mt-4 text-center">
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
