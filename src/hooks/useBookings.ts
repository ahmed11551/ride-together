import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { notifyNewBooking, notifyBookingConfirmed } from "@/lib/notifications";

export interface Booking {
  id: string;
  ride_id: string;
  passenger_id: string;
  seats_booked: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  payment_status: "pending" | "paid" | "refunded";
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface BookingWithRide extends Booking {
  ride?: any;
}

export const useMyBookings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["bookings", "my", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("bookings")
        .select("*, ride:rides(*)")
        .eq("passenger_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch driver profiles
      const driverIds = [...new Set(data?.map(b => (b.ride as any)?.driver_id).filter(Boolean) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, phone")
        .in("user_id", driverIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
      
      return (data || []).map(booking => ({
        ...booking,
        ride: booking.ride ? {
          ...(booking.ride as any),
          driver: profileMap.get((booking.ride as any).driver_id),
        } : undefined,
      })) as BookingWithRide[];
    },
    enabled: !!user,
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ rideId, seats, totalPrice }: { rideId: string; seats: number; totalPrice: number }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("bookings")
        .insert({
          ride_id: rideId,
          passenger_id: user.id,
          seats_booked: seats,
          total_price: totalPrice,
        })
        .select()
        .single();

      if (error) throw error;

      // Отправляем уведомление водителю (асинхронно, не блокируем)
      if (data) {
        sendBookingNotification(rideId, data.id, user.id, seats).catch((err) => {
          import('@/lib/logger').then(({ logger }) => {
            logger.error('Ошибка отправки уведомления о бронировании', err);
          });
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["rides"] });
    },
  });
};

/**
 * Отправка уведомления водителю о новом бронировании
 */
async function sendBookingNotification(
  rideId: string,
  bookingId: string,
  passengerId: string,
  seats: number
): Promise<void> {
  try {
    // Получаем информацию о поездке
    const { data: ride } = await supabase
      .from("rides")
      .select("driver_id")
      .eq("id", rideId)
      .single();

    if (!ride) return;

    // Получаем информацию о пассажире
    const { data: passengerProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", passengerId)
      .maybeSingle();

    const passengerName = passengerProfile?.full_name || "Пассажир";

    // Импортируем функцию отправки уведомлений
    // Уведомление отправляется через статический импорт

    // Отправляем уведомление водителю
    await notifyNewBooking(ride.driver_id, bookingId, passengerName, seats);
  } catch (error) {
    import('@/lib/logger').then(({ logger }) => {
      logger.error("Ошибка отправки уведомления о бронировании", error);
    });
  }
}

export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Booking["status"] }) => {
      // Получаем текущее бронирование для проверки статуса
      const { data: currentBooking, error: fetchError } = await supabase
        .from("bookings")
        .select("ride_id, seats_booked, status")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;
      if (!currentBooking) throw new Error("Booking not found");

      // Обновляем статус бронирования
      const { data, error } = await supabase
        .from("bookings")
        .update({ 
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Если бронирование подтверждено, обновляем seats_available
      // (триггер уже обрабатывает это, но убедимся что все правильно)
      if (status === "confirmed" && currentBooking.status === "pending") {
        // Триггер должен обработать это автоматически
        // Но на всякий случай обновим кэш
        queryClient.invalidateQueries({ queryKey: ["rides", currentBooking.ride_id] });
        queryClient.invalidateQueries({ queryKey: ["ride", currentBooking.ride_id] });

        // Отправляем уведомление пассажиру о подтверждении (асинхронно)
        sendBookingConfirmedNotification(
          currentBooking.ride_id,
          data.passenger_id
        ).catch((err) => {
          import('@/lib/logger').then(({ logger }) => {
            logger.error('Ошибка отправки уведомления о подтверждении', err);
          });
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["rides"] });
      queryClient.invalidateQueries({ queryKey: ["ride-bookings"] });
    },
  });
};

/**
 * Отправка уведомления пассажиру о подтверждении бронирования
 */
async function sendBookingConfirmedNotification(
  rideId: string,
  passengerId: string
): Promise<void> {
  try {
    // Получаем информацию о поездке
    const { data: ride } = await supabase
      .from("rides")
      .select("from_city, to_city")
      .eq("id", rideId)
      .single();

    if (!ride) return;

    // Импортируем функцию отправки уведомлений
    // Уведомление отправляется через статический импорт

    // Отправляем уведомление пассажиру
    await notifyBookingConfirmed(
      passengerId,
      rideId,
      ride.from_city,
      ride.to_city
    );
  } catch (error) {
    import('@/lib/logger').then(({ logger }) => {
      logger.error("Ошибка отправки уведомления о подтверждении", error);
    });
  }
}
