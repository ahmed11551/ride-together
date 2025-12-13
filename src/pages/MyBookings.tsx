import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMyBookings, useUpdateBookingStatus } from "@/hooks/useBookings";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ReviewPrompt } from "@/components/reviews/ReviewPrompt";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock,
  MessageCircle,
  XCircle,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Ожидает", variant: "secondary" },
  confirmed: { label: "Подтверждено", variant: "default" },
  cancelled: { label: "Отменено", variant: "destructive" },
  completed: { label: "Завершено", variant: "outline" },
};

const MyBookings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: bookings, isLoading } = useMyBookings();
  const updateStatus = useUpdateBookingStatus();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleCancel = async (bookingId: string) => {
    try {
      await updateStatus.mutateAsync({ id: bookingId, status: "cancelled" });
      toast({
        title: "Бронирование отменено",
        description: "Ваше бронирование было успешно отменено",
      });
    } catch (error) {
      console.error("Cancel booking error:", error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось отменить бронирование. Попробуйте еще раз.",
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

  const activeBookings = bookings?.filter((b) => 
    b.status === "pending" || b.status === "confirmed"
  ) || [];
  const pastBookings = bookings?.filter((b) => 
    b.status === "cancelled" || b.status === "completed"
  ) || [];

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container flex h-16 items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/")}
            aria-label="Вернуться на главную"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Мои бронирования</h1>
        </div>
      </header>

      <div className="container py-6">
        {bookings && bookings.length > 0 ? (
          <div className="space-y-8">
            {/* Active Bookings */}
            {activeBookings.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-4">Предстоящие</h2>
                <div className="space-y-4">
                  {activeBookings.map((booking) => {
                    const ride = booking.ride as any;
                    const driver = ride?.driver as any;
                    
                    return (
                      <div 
                        key={booking.id}
                        className="bg-card rounded-2xl p-5 shadow-card animate-fade-in"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <Badge variant={statusLabels[booking.status].variant}>
                            {statusLabels[booking.status].label}
                          </Badge>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {ride?.departure_date && 
                                format(new Date(ride.departure_date), "d MMM", { locale: ru })}
                            </span>
                            <Clock className="w-4 h-4 ml-1" />
                            <span>{ride?.departure_time?.slice(0, 5)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mb-2">
                          <MapPin className="w-4 h-4 text-success" />
                          <span className="font-medium">{ride?.from_city}</span>
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                          <MapPin className="w-4 h-4 text-secondary" />
                          <span className="font-medium">{ride?.to_city}</span>
                        </div>

                        {/* Driver */}
                        {driver && (
                          <div className="flex items-center gap-3 py-4 border-t border-border">
                            <img 
                              src={driver.avatar_url || `https://ui-avatars.com/api/?name=${driver.full_name || "D"}&background=0d9488&color=fff`}
                              alt={driver.full_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <p className="font-medium">{driver.full_name || "Водитель"}</p>
                              {driver.phone && (
                                <p className="text-sm text-muted-foreground">{driver.phone}</p>
                              )}
                            </div>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => navigate(`/ride/${ride.id}`)}
                              title="Открыть чат"
                              aria-label="Открыть чат с водителем"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              {booking.seats_booked} {booking.seats_booked === 1 ? "место" : "места"}
                            </p>
                            <p className="text-xl font-bold text-primary">{booking.total_price} ₽</p>
                          </div>
                          
                          {booking.status === "pending" && (
                            <Button 
                              variant="outline" 
                              className="text-destructive"
                              onClick={() => handleCancel(booking.id)}
                              disabled={updateStatus.isPending}
                              loading={updateStatus.isPending}
                              aria-label="Отменить бронирование"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Отменить
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Past Bookings */}
            {pastBookings.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-4">История</h2>
                <div className="space-y-4">
                  {pastBookings.map((booking) => {
                    const ride = booking.ride as any;
                    const isCompleted = booking.status === "completed";
                    
                    return (
                      <div 
                        key={booking.id}
                        className="bg-card rounded-2xl p-5 shadow-card"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant={statusLabels[booking.status].variant}>
                            {statusLabels[booking.status].label}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {ride?.departure_date && 
                              format(new Date(ride.departure_date), "d MMM yyyy", { locale: ru })}
                          </span>
                        </div>
                        <p className="font-medium mb-3">
                          {ride?.from_city} → {ride?.to_city}
                        </p>
                        {isCompleted && ride?.id && (
                          <ReviewPrompt
                            rideId={ride.id}
                            rideTitle={`${ride?.from_city} → ${ride?.to_city}`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <AlertCircle className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2">Нет бронирований</h2>
            <p className="text-muted-foreground mb-6">
              Найдите поездку и забронируйте место
            </p>
            <Button variant="hero" onClick={() => navigate("/")}>
              Найти поездку
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
