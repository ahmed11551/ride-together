import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRideById } from "@/hooks/useRides";
import { useCreateBooking } from "@/hooks/useBookings";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Calendar,
  Star, 
  Users,
  Cigarette,
  Dog,
  Music,
  MessageCircle,
  Shield,
  Phone
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const RideDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: ride, isLoading } = useRideById(id);
  const createBooking = useCreateBooking();

  const [seats, setSeats] = useState(1);

  const handleBook = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!ride) return;

    if (ride.driver_id === user.id) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Вы не можете забронировать свою поездку",
      });
      return;
    }

    try {
      await createBooking.mutateAsync({
        rideId: ride.id,
        seats,
        totalPrice: ride.price * seats,
      });

      toast({
        title: "Успешно!",
        description: "Бронирование создано. Ожидайте подтверждения водителя.",
      });
      navigate("/my-bookings");
    } catch (error: any) {
      if (error.message?.includes("duplicate")) {
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: "Вы уже забронировали эту поездку",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: "Не удалось создать бронирование",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Поездка не найдена</p>
        <Button onClick={() => navigate("/")}>На главную</Button>
      </div>
    );
  }

  const driver = ride.driver as any;
  const formattedDate = format(new Date(ride.departure_date), "d MMMM, EEEE", { locale: ru });

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container flex h-16 items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Детали поездки</h1>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Route Card */}
        <div className="bg-card rounded-2xl p-6 shadow-card animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-1 pt-1">
              <div className="w-4 h-4 rounded-full bg-success" />
              <div className="w-0.5 h-16 bg-border" />
              <div className="w-4 h-4 rounded-full bg-secondary" />
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-lg font-bold text-foreground">{ride.from_city}</p>
                <p className="text-muted-foreground">{ride.from_address}</p>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{formattedDate}</span>
                  <Clock className="w-4 h-4 ml-2" />
                  <span>{ride.departure_time.slice(0, 5)}</span>
                </div>
              </div>
              
              <div>
                <p className="text-lg font-bold text-foreground">{ride.to_city}</p>
                <p className="text-muted-foreground">{ride.to_address}</p>
                {ride.estimated_duration && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Время в пути: {ride.estimated_duration}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Driver Card */}
        {driver && (
          <div className="bg-card rounded-2xl p-6 shadow-card animate-fade-in" style={{ animationDelay: "100ms" }}>
            <h2 className="font-bold text-lg mb-4">Водитель</h2>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <img 
                  src={driver.avatar_url || `https://ui-avatars.com/api/?name=${driver.full_name || "User"}&background=0d9488&color=fff`} 
                  alt={driver.full_name || "Водитель"}
                  className="w-16 h-16 rounded-full object-cover border-2 border-border"
                />
                {driver.is_verified && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Shield className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <p className="text-lg font-bold text-foreground">{driver.full_name || "Водитель"}</p>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1 text-warning">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-medium">{driver.rating || 5}</span>
                  </div>
                  <span className="text-muted-foreground">{driver.trips_count || 0} поездок</span>
                </div>
              </div>

              <Button variant="outline" size="icon">
                <MessageCircle className="w-5 h-5" />
              </Button>
            </div>

            {driver.bio && (
              <p className="mt-4 text-muted-foreground">{driver.bio}</p>
            )}
          </div>
        )}

        {/* Preferences */}
        <div className="bg-card rounded-2xl p-6 shadow-card animate-fade-in" style={{ animationDelay: "150ms" }}>
          <h2 className="font-bold text-lg mb-4">Правила поездки</h2>
          
          <div className="grid grid-cols-3 gap-4">
            <div className={`flex flex-col items-center p-3 rounded-xl ${ride.allow_smoking ? 'bg-success-light text-success' : 'bg-muted text-muted-foreground'}`}>
              <Cigarette className="w-5 h-5 mb-1" />
              <span className="text-xs text-center">{ride.allow_smoking ? "Можно" : "Нельзя"}</span>
            </div>
            
            <div className={`flex flex-col items-center p-3 rounded-xl ${ride.allow_pets ? 'bg-success-light text-success' : 'bg-muted text-muted-foreground'}`}>
              <Dog className="w-5 h-5 mb-1" />
              <span className="text-xs text-center">{ride.allow_pets ? "С питомцами" : "Без питомцев"}</span>
            </div>
            
            <div className={`flex flex-col items-center p-3 rounded-xl ${ride.allow_music ? 'bg-success-light text-success' : 'bg-muted text-muted-foreground'}`}>
              <Music className="w-5 h-5 mb-1" />
              <span className="text-xs text-center">{ride.allow_music ? "С музыкой" : "Без музыки"}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {ride.notes && (
          <div className="bg-card rounded-2xl p-6 shadow-card animate-fade-in" style={{ animationDelay: "200ms" }}>
            <h2 className="font-bold text-lg mb-2">Дополнительно</h2>
            <p className="text-muted-foreground">{ride.notes}</p>
          </div>
        )}
      </div>

      {/* Booking Footer */}
      {ride.status === "active" && ride.seats_available > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border p-4 z-40">
          <div className="container flex items-center justify-between gap-4">
            <div>
              <p className="text-2xl font-bold text-primary">{ride.price} ₽</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{ride.seats_available} мест</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
                className="h-12 px-4 rounded-xl bg-muted border-2 border-transparent focus:border-primary outline-none"
              >
                {Array.from({ length: ride.seats_available }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>{num} место</option>
                ))}
              </select>

              <Button 
                variant="hero" 
                size="lg"
                onClick={handleBook}
                disabled={createBooking.isPending}
              >
                {createBooking.isPending ? "..." : `Забронировать ${ride.price * seats} ₽`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RideDetails;
