import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["rides"] });
    },
  });
};

export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Booking["status"] }) => {
      const { data, error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["rides"] });
    },
  });
};
