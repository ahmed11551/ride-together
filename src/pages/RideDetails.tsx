import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRideById } from "@/hooks/useRides";
import { useCreateBooking } from "@/hooks/useBookings";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import RideChat from "@/components/chat/RideChat";
import { ReportDialog } from "@/components/reports/ReportDialog";
import { getUserFriendlyError, logError } from "@/lib/error-handler";
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
  Phone,
  Info,
  CheckCircle,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton-loaders";

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
            title: "Бронирование создано!",
        description: "Ожидайте подтверждения от водителя",
      });
      navigate("/my-bookings");
    } catch (error) {
      logError(error, "createBooking");
      const friendlyError = getUserFriendlyError(error);
      toast({
        variant: "destructive",
        title: friendlyError.title,
        description: friendlyError.description,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
          <div className="container flex h-16 items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              aria-label="Вернуться назад"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Skeleton className="h-6 w-40" />
          </div>
        </header>
        <div className="container py-6 space-y-6">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
          <Info className="w-10 h-10 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-center">Поездка не найдена</p>
        <Button onClick={() => navigate("/")}>На главную</Button>
      </div>
    );
  }

  const driver = ride.driver as any;
  const formattedDate = format(new Date(ride.departure_date), "d MMMM, EEEE", { locale: ru });

  return (
    <div className="min-h-screen bg-background pb-36">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container flex h-16 items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-bold text-foreground">{ride.from_city} → {ride.to_city}</h1>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-5">
        {/* Route Card */}
        <div className="bg-card rounded-2xl p-5 shadow-card animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
              <div className="w-4 h-4 rounded-full bg-success ring-4 ring-success-light" />
              <div className="w-0.5 h-20 bg-gradient-to-b from-success via-border to-secondary" />
              <div className="w-4 h-4 rounded-full bg-secondary ring-4 ring-warning-light" />
            </div>
            
            <div className="flex-1 space-y-5">
              <div>
                <p className="text-lg font-bold text-foreground">{ride.from_city}</p>
                <p className="text-muted-foreground">{ride.from_address}</p>
                <div className="flex items-center gap-3 mt-2 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{formattedDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-foreground font-medium">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{ride.departure_time.slice(0, 5)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-lg font-bold text-foreground">{ride.to_city}</p>
                <p className="text-muted-foreground">{ride.to_address}</p>
                {ride.estimated_duration && (
                  <p className="text-sm text-muted-foreground mt-2">
                    ⏱ Время в пути: {ride.estimated_duration}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Driver Card */}
        {driver && (
          <div className="bg-card rounded-2xl p-5 shadow-card animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Водитель</h2>
              {driver.is_verified && (
                <Badge variant="soft" className="gap-1">
                  <Shield className="w-3 h-3" />
                  Проверен
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <img 
                  src={driver.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(driver.full_name || "U")}&background=0d9488&color=fff&size=80`} 
                  alt={driver.full_name || "Водитель"}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-border"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-foreground truncate">{driver.full_name || "Водитель"}</p>
                <div className="flex items-center gap-3 text-sm mt-1">
                  <div className="flex items-center gap-1 text-warning">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-semibold">{driver.rating || 5}</span>
                  </div>
                      <span className="text-muted-foreground">
                        {driver.trips_count || 0} {(driver.trips_count || 0) === 1 ? 'поездка' : (driver.trips_count || 0) < 5 ? 'поездки' : 'поездок'}
                      </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="soft" size="icon" className="shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </Button>
                {user && driver.user_id !== user.id && (
                  <ReportDialog
                    reportedUserId={ride.driver_id}
                    rideId={ride.id}
                    rideTitle={`${ride.from_city} → ${ride.to_city}`}
                  />
                )}
              </div>
            </div>

            {driver.bio && (
              <p className="mt-4 text-muted-foreground text-sm bg-muted/50 rounded-xl p-3">{driver.bio}</p>
            )}
          </div>
        )}

        {/* Preferences */}
        <div className="bg-card rounded-2xl p-5 shadow-card animate-fade-in" style={{ animationDelay: "150ms" }}>
          <h2 className="font-bold text-lg mb-4">Правила поездки</h2>
          
          <div className="grid grid-cols-3 gap-3">
            <div className={`flex flex-col items-center p-4 rounded-xl transition-colors ${!ride.allow_smoking ? 'bg-success-light' : 'bg-muted'}`}>
              <Cigarette className={`w-5 h-5 mb-2 ${!ride.allow_smoking ? 'text-success' : 'text-muted-foreground'}`} />
              {!ride.allow_smoking ? (
                <CheckCircle className="w-4 h-4 text-success mb-1" />
              ) : (
                <XCircle className="w-4 h-4 text-muted-foreground mb-1" />
              )}
              <span className="text-xs text-center font-medium">{ride.allow_smoking ? "Можно курить" : "Без курения"}</span>
            </div>
            
            <div className={`flex flex-col items-center p-4 rounded-xl transition-colors ${ride.allow_pets ? 'bg-info-light' : 'bg-muted'}`}>
              <Dog className={`w-5 h-5 mb-2 ${ride.allow_pets ? 'text-info' : 'text-muted-foreground'}`} />
              {ride.allow_pets ? (
                <CheckCircle className="w-4 h-4 text-info mb-1" />
              ) : (
                <XCircle className="w-4 h-4 text-muted-foreground mb-1" />
              )}
              <span className="text-xs text-center font-medium">{ride.allow_pets ? "С питомцами" : "Без питомцев"}</span>
            </div>
            
            <div className={`flex flex-col items-center p-4 rounded-xl transition-colors ${ride.allow_music ? 'bg-primary-light' : 'bg-muted'}`}>
              <Music className={`w-5 h-5 mb-2 ${ride.allow_music ? 'text-primary' : 'text-muted-foreground'}`} />
              {ride.allow_music ? (
                <CheckCircle className="w-4 h-4 text-primary mb-1" />
              ) : (
                <XCircle className="w-4 h-4 text-muted-foreground mb-1" />
              )}
              <span className="text-xs text-center font-medium">{ride.allow_music ? "Музыка" : "Без музыки"}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {ride.notes && (
          <div className="bg-card rounded-2xl p-5 shadow-card animate-fade-in" style={{ animationDelay: "200ms" }}>
            <h2 className="font-bold text-lg mb-2">Дополнительно</h2>
            <p className="text-muted-foreground">{ride.notes}</p>
          </div>
        )}

        {/* Chat */}
        <div className="animate-fade-in" style={{ animationDelay: "250ms" }}>
          <RideChat rideId={ride.id} driverId={ride.driver_id} />
        </div>
      </div>

      {/* Booking Footer */}
      {ride.status === "active" && ride.seats_available > 0 && (
        <div className="fixed bottom-0 left-0 right-0 glass border-t border-border p-3 sm:p-4 z-40 safe-area-bottom">
          <div className="container">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex-shrink-0">
                <p className="text-xl sm:text-2xl font-extrabold text-primary">{(ride.price * seats).toLocaleString()} ₽</p>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{ride.seats_available} мест свободно</span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-1 sm:flex-initial">
                <select
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                  className="h-10 sm:h-12 px-3 sm:px-4 rounded-xl bg-muted border-2 border-transparent focus:border-primary outline-none font-medium text-sm sm:text-base flex-shrink-0"
                >
                  {Array.from({ length: ride.seats_available }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>{num} {num === 1 ? "место" : "места"}</option>
                  ))}
                </select>

                <Button 
                  variant="hero" 
                  size="lg"
                  onClick={handleBook}
                  loading={createBooking.isPending}
                  className="flex-1 sm:flex-initial whitespace-nowrap min-w-0"
                >
                  <span className="truncate">Забронировать</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RideDetails;
