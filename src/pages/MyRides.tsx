import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMyRides, useUpdateRide } from "@/hooks/useRides";
import { useUpdateBookingStatus } from "@/hooks/useBookings";
import { RideBookings } from "@/components/rides/RideBookings";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getUserFriendlyError, logError } from "@/lib/error-handler";
import { 
  ArrowLeft, 
  Plus, 
  MapPin, 
  Calendar, 
  Clock, 
  Users,
  MoreVertical,
  XCircle,
  CheckCircle,
  User,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MyRides = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: rides, isLoading } = useMyRides();
  const updateRide = useUpdateRide();
  const updateBookingStatus = useUpdateBookingStatus();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleCancel = async (rideId: string) => {
    try {
      await updateRide.mutateAsync({ id: rideId, status: "cancelled" });
      toast({
        title: "Поездка отменена",
      });
    } catch (error) {
      logError(error, "cancelRide");
      const friendlyError = getUserFriendlyError(error);
      toast({
        variant: "destructive",
        title: friendlyError.title,
        description: friendlyError.description,
      });
    }
  };

  const handleBookingStatus = async (bookingId: string, status: "confirmed" | "cancelled") => {
    try {
      await updateBookingStatus.mutateAsync({ id: bookingId, status });
      toast({
        title: status === "confirmed" ? "Бронирование подтверждено" : "Бронирование отменено",
      });
    } catch (error) {
      logError(error, "updateBookingStatus");
      const friendlyError = getUserFriendlyError(error);
      toast({
        variant: "destructive",
        title: friendlyError.title,
        description: friendlyError.description,
      });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  const activeRides = rides?.filter((r) => r.status === "active") || [];
  const pastRides = rides?.filter((r) => r.status !== "active") || [];

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Мои поездки</h1>
          </div>
          <Button onClick={() => navigate("/create-ride")}>
            <Plus className="w-4 h-4 mr-2" />
            Создать
          </Button>
        </div>
      </header>

      <div className="container py-6">
        {rides && rides.length > 0 ? (
          <div className="space-y-8">
            {/* Active Rides */}
            {activeRides.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-4">Активные</h2>
                <div className="space-y-4">
                  {activeRides.map((ride) => (
                    <div 
                      key={ride.id}
                      className="bg-card rounded-2xl p-5 shadow-card animate-fade-in"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(ride.departure_date), "d MMM", { locale: ru })}</span>
                          <Clock className="w-4 h-4 ml-2" />
                          <span>{ride.departure_time.slice(0, 5)}</span>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/ride/${ride.id}`)}>
                              Подробнее
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleCancel(ride.id)}
                            >
                              Отменить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Bookings for this ride */}
                      <div className="mt-4">
                        <RideBookings rideId={ride.id} />
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <MapPin className="w-4 h-4 text-success" />
                        <span className="font-medium">{ride.from_city}</span>
                      </div>
                      <div className="flex items-center gap-3 mb-4">
                        <MapPin className="w-4 h-4 text-secondary" />
                        <span className="font-medium">{ride.to_city}</span>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{ride.seats_available} / {ride.seats_total} мест</span>
                        </div>
                        <span className="text-xl font-bold text-primary">{ride.price} ₽</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Past Rides */}
            {pastRides.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-4">Завершённые</h2>
                <div className="space-y-4">
                  {pastRides.map((ride) => (
                    <div 
                      key={ride.id}
                      className="bg-card rounded-2xl p-5 shadow-card opacity-60"
                    >
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(ride.departure_date), "d MMM yyyy", { locale: ru })}</span>
                        {ride.status === "cancelled" && (
                          <span className="text-destructive flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> Отменена
                          </span>
                        )}
                      </div>

                      <p className="font-medium">
                        {ride.from_city} → {ride.to_city}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Plus className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2">Нет поездок</h2>
            <p className="text-muted-foreground mb-6">
              Создайте свою первую поездку и найдите попутчиков
            </p>
            <Button variant="hero" onClick={() => navigate("/create-ride")}>
              Создать поездку
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRides;
