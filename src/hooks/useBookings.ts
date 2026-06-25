import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";

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
      return apiClient.get<BookingWithRide[]>('/api/bookings');
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

      return apiClient.post<Booking>('/api/bookings', {
        ride_id: rideId,
        seats_booked: seats,
        total_price: totalPrice,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["rides"] });
      queryClient.invalidateQueries({ queryKey: ["ride-bookings"] });
    },
  });
};

export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Booking["status"] }) => {
      return apiClient.put<Booking>(`/api/bookings/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["rides"] });
      queryClient.invalidateQueries({ queryKey: ["ride-bookings"] });
    },
  });
};
