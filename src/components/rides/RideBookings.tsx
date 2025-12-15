import { useRideBookings } from "@/hooks/useRideBookings";
import { useUpdateBookingStatus } from "@/hooks/useBookings";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getUserFriendlyError, logError } from "@/lib/error-handler";
import { User, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface RideBookingsProps {
  rideId: string;
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Ожидает", variant: "secondary" },
  confirmed: { label: "Подтверждено", variant: "default" },
  cancelled: { label: "Отменено", variant: "destructive" },
  completed: { label: "Завершено", variant: "outline" },
};

export const RideBookings = ({ rideId }: RideBookingsProps) => {
  const { data: bookings, isLoading } = useRideBookings(rideId);
  const updateBookingStatus = useUpdateBookingStatus();
  const { toast } = useToast();

  const handleStatusChange = async (bookingId: string, status: "confirmed" | "cancelled") => {
    try {
      await updateBookingStatus.mutateAsync({ id: bookingId, status });
      toast({
        title: status === "confirmed" ? "Бронирование подтверждено" : "Бронирование отменено",
        description: status === "confirmed" 
          ? "Пассажир получит уведомление о подтверждении" 
          : "Бронирование было отменено",
      });
    } catch (error) {
      logError(error, "updateBookingStatus");
      const friendlyError = getUserFriendlyError(error);
      toast({
        variant: "destructive",
        title: friendlyError.title,
        description: friendlyError.description || "Не удалось изменить статус бронирования",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-5 shadow-card">
        <p className="text-muted-foreground">Загрузка заявок...</p>
      </div>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-5 shadow-card">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Пока нет заявок на эту поездку</p>
        </div>
      </div>
    );
  }

  const pendingBookings = bookings.filter(b => b.status === "pending");
  const otherBookings = bookings.filter(b => b.status !== "pending");

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card space-y-4">
      <h3 className="font-bold text-lg">Заявки на поездку</h3>
      
      {pendingBookings.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Ожидают подтверждения</h4>
          {pendingBookings.map((booking) => (
            <div
              key={booking.id}
              className="border-2 border-primary/20 rounded-xl p-4 bg-primary/5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    {booking.passenger?.avatar_url ? (
                      <img
                        src={booking.passenger.avatar_url}
                        alt={booking.passenger.full_name || "Пассажир"}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{booking.passenger?.full_name || "Пассажир"}</p>
                      {booking.passenger?.passenger_rating !== undefined && booking.passenger.passenger_rating !== null && booking.passenger.passenger_rating > 0 && (
                        <div className="flex items-center gap-1 text-xs text-warning">
                          <span>⭐</span>
                          <span className="font-semibold">{booking.passenger.passenger_rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    {booking.passenger?.phone && (
                      <p className="text-sm text-muted-foreground">{booking.passenger.phone}</p>
                    )}
                  </div>
                </div>
                <Badge variant={statusLabels[booking.status].variant}>
                  {statusLabels[booking.status].label}
                </Badge>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {booking.seats_booked} {booking.seats_booked === 1 ? "место" : "места"}
                  </p>
                  <p className="text-lg font-bold text-primary">{booking.total_price} ₽</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    onClick={() => handleStatusChange(booking.id, "cancelled")}
                    disabled={updateBookingStatus.isPending}
                    loading={updateBookingStatus.isPending}
                    aria-label={`Отклонить бронирование от ${booking.passenger?.full_name || 'пассажира'}`}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Отклонить
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleStatusChange(booking.id, "confirmed")}
                    disabled={updateBookingStatus.isPending}
                    loading={updateBookingStatus.isPending}
                    aria-label={`Подтвердить бронирование от ${booking.passenger?.full_name || 'пассажира'}`}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Подтвердить
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {otherBookings.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-border">
          <h4 className="text-sm font-medium text-muted-foreground">Остальные заявки</h4>
          {otherBookings.map((booking) => (
            <div
              key={booking.id}
              className="border rounded-xl p-4 bg-muted/30"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    {booking.passenger?.avatar_url ? (
                      <img
                        src={booking.passenger.avatar_url}
                        alt={booking.passenger.full_name || "Пассажир"}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{booking.passenger?.full_name || "Пассажир"}</p>
                      {booking.passenger?.passenger_rating !== undefined && booking.passenger.passenger_rating !== null && booking.passenger.passenger_rating > 0 && (
                        <div className="flex items-center gap-1 text-xs text-warning">
                          <span>⭐</span>
                          <span className="font-semibold">{booking.passenger.passenger_rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {booking.seats_booked} {booking.seats_booked === 1 ? "место" : "места"} • {booking.total_price} ₽
                    </p>
                  </div>
                </div>
                <Badge variant={statusLabels[booking.status].variant}>
                  {statusLabels[booking.status].label}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

