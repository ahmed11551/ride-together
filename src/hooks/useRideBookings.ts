import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  };
}

/**
 * Hook to get all bookings for a specific ride (for drivers)
 */
export const useRideBookings = (rideId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["ride-bookings", rideId, user?.id],
    queryFn: async () => {
      if (!rideId || !user) return [];

      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("ride_id", rideId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch passenger profiles
      const passengerIds = [...new Set(data?.map(b => b.passenger_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, phone, rating")
        .in("user_id", passengerIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (data || []).map(booking => ({
        ...booking,
        passenger: profileMap.get(booking.passenger_id),
      })) as RideBooking[];
    },
    enabled: !!rideId && !!user,
  });
};

/**
 * Hook to get all bookings for user's rides (for drivers to see all requests)
 */
export const useMyRideBookings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-ride-bookings", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get all user's rides
      const { data: rides, error: ridesError } = await supabase
        .from("rides")
        .select("id")
        .eq("driver_id", user.id)
        .eq("status", "active");

      if (ridesError) throw ridesError;

      const rideIds = rides?.map(r => r.id) || [];
      if (rideIds.length === 0) return [];

      // Get all bookings for these rides
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .in("ride_id", rideIds)
        .order("created_at", { ascending: false });

      if (bookingsError) throw bookingsError;

      // Fetch passenger profiles
      const passengerIds = [...new Set(bookings?.map(b => b.passenger_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, phone, rating")
        .in("user_id", passengerIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Fetch ride info
      const { data: ridesInfo } = await supabase
        .from("rides")
        .select("id, from_city, to_city, departure_date, departure_time")
        .in("id", rideIds);

      const rideMap = new Map(ridesInfo?.map(r => [r.id, r]) || []);

      return (bookings || []).map(booking => ({
        ...booking,
        passenger: profileMap.get(booking.passenger_id),
        ride: rideMap.get(booking.ride_id),
      })) as (RideBooking & { ride?: { from_city: string; to_city: string; departure_date: string; departure_time: string } })[];
    },
    enabled: !!user,
  });
};

