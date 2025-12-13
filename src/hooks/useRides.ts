import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Ride {
  id: string;
  driver_id: string;
  from_city: string;
  from_address: string;
  to_city: string;
  to_address: string;
  departure_date: string;
  departure_time: string;
  estimated_duration: string | null;
  price: number;
  seats_total: number;
  seats_available: number;
  status: "active" | "completed" | "cancelled";
  allow_smoking: boolean;
  allow_pets: boolean;
  allow_music: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RideWithDriver extends Ride {
  driver?: {
    full_name: string | null;
    avatar_url: string | null;
    rating: number;
    trips_count: number;
    is_verified: boolean;
  };
}

interface SearchParams {
  from?: string;
  to?: string;
  date?: string;
  passengers?: number;
}

export const useSearchRides = (params: SearchParams) => {
  return useQuery({
    queryKey: ["rides", "search", params],
    queryFn: async () => {
      let query = supabase
        .from("rides")
        .select("*")
        .eq("status", "active")
        .gte("seats_available", params.passengers || 1)
        .order("departure_date", { ascending: true })
        .order("departure_time", { ascending: true });

      if (params.from) {
        query = query.ilike("from_city", `%${params.from}%`);
      }
      if (params.to) {
        query = query.ilike("to_city", `%${params.to}%`);
      }
      if (params.date) {
        query = query.eq("departure_date", params.date);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch driver profiles separately
      const driverIds = [...new Set(data?.map(r => r.driver_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, rating, trips_count, is_verified")
        .in("user_id", driverIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
      
      return (data || []).map(ride => ({
        ...ride,
        driver: profileMap.get(ride.driver_id),
      })) as RideWithDriver[];
    },
  });
};

export const useRideById = (rideId: string | undefined) => {
  return useQuery({
    queryKey: ["ride", rideId],
    queryFn: async () => {
      if (!rideId) return null;

      const { data, error } = await supabase
        .from("rides")
        .select("*")
        .eq("id", rideId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", data.driver_id)
        .maybeSingle();

      return { ...data, driver: profile } as RideWithDriver;
    },
    enabled: !!rideId,
  });
};

export const useMyRides = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["rides", "my", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("rides")
        .select("*")
        .eq("driver_id", user.id)
        .order("departure_date", { ascending: true });

      if (error) throw error;
      return data as Ride[];
    },
    enabled: !!user,
  });
};

export const useCreateRide = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (ride: Omit<Ride, "id" | "driver_id" | "status" | "created_at" | "updated_at">) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("rides")
        .insert({ ...ride, driver_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rides"] });
    },
  });
};

export const useUpdateRide = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Ride> & { id: string }) => {
      const { data, error } = await supabase
        .from("rides")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rides"] });
      queryClient.invalidateQueries({ queryKey: ["ride", variables.id] });
    },
  });
};

export const useRecentRides = () => {
  return useQuery({
    queryKey: ["rides", "recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rides")
        .select("*")
        .eq("status", "active")
        .gte("departure_date", new Date().toISOString().split("T")[0])
        .gt("seats_available", 0)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      const driverIds = [...new Set(data?.map(r => r.driver_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, rating, trips_count, is_verified")
        .in("user_id", driverIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
      
      return (data || []).map(ride => ({
        ...ride,
        driver: profileMap.get(ride.driver_id),
      })) as RideWithDriver[];
    },
  });
};
