import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";

export interface RideBooking {
  id: string;
  ride_id: string;
  passenger_id: string;
  seats_booked: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  payment_status: "pending" | "paid" | "refunded";
  total_price: number;
  created_at: string;
  updated_at: string;
  passenger?: {
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
    rating: number;
    passenger_rating: number;
  };
}

/**
 * Бронирования конкретной поездки (для водителя)
 */
export const useRideBookings = (rideId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["ride-bookings", rideId, user?.id],
    queryFn: async () => {
      if (!rideId || !user) return [];
      return apiClient.get<RideBooking[]>(`/api/bookings/ride/${rideId}`);
    },
    enabled: !!rideId && !!user,
  });
};
