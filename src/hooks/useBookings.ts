import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
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
  ride?: {
    id: string;
    from_city: string;
    to_city: string;
    departure_date: string;
    departure_time: string;
    price: number;
    seats_available: number;
    driver_id: string;
    driver?: {
      full_name: string | null;
      avatar_url: string | null;
    };
  };
}

export const useMyBookings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["bookings", "my", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const data = await apiClient.get<BookingWithRide[]>('/api/bookings');
      return data;
    },
    enabled: !!user,
  });
};

export const useRideBookings = (rideId: string | undefined) => {
  return useQuery({
    queryKey: ["ride-bookings", rideId],
    queryFn: async () => {
      if (!rideId) return [];

      const data = await apiClient.get<BookingWithRide[]>(`/api/bookings/ride/${rideId}`);
      return data;
    },
    enabled: !!rideId,
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ rideId, seats, totalPrice }: { rideId: string; seats: number; totalPrice: number }) => {
      if (!user) throw new Error("Not authenticated");

      const data = await apiClient.post<Booking>('/api/bookings', {
        ride_id: rideId,
        seats_booked: seats,
        total_price: totalPrice,
      });

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
      queryClient.invalidateQueries({ queryKey: ["ride-bookings"] });
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
    const ride = await apiClient.get<{ driver_id: string }>(`/api/rides/${rideId}`);
    if (!ride) return;

    // Получаем информацию о пассажире
    const passengerProfile = await apiClient.get<{ full_name: string | null }>(`/api/profiles/${passengerId}`);
    const passengerName = passengerProfile?.full_name || "Пассажир";

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
      // Получаем текущее бронирование из кэша
      const cachedBookings = queryClient.getQueryData<BookingWithRide[]>(["bookings", "my"]);
      let currentBooking = cachedBookings?.find(b => b.id === id);
      
      // Если не в кэше, получаем из списка
      if (!currentBooking) {
        const allBookings = await apiClient.get<BookingWithRide[]>('/api/bookings');
        currentBooking = allBookings.find(b => b.id === id);
        if (!currentBooking) throw new Error("Booking not found");
      }

      const oldStatus = currentBooking.status;

      // Обновляем статус бронирования
      const data = await apiClient.put<Booking>(`/api/bookings/${id}`, { status });

      // Если бронирование подтверждено, отправляем уведомление пассажиру
      if (status === "confirmed" && oldStatus === "pending") {
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
    const ride = await apiClient.get<{ from_city: string; to_city: string }>(`/api/rides/${rideId}`);
    if (!ride) return;

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
