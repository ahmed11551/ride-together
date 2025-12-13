import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { RideWithDriver } from "./useRides";

interface SearchParams {
  from?: string;
  to?: string;
  date?: string;
  passengers?: number;
}

const PAGE_SIZE = 10;

/**
 * Hook for infinite scroll loading of rides
 */
export const useInfiniteRides = (params: SearchParams) => {
  return useInfiniteQuery({
    queryKey: ["rides", "infinite", params],
    queryFn: async ({ pageParam = 0 }) => {
      const offset = pageParam * PAGE_SIZE;

      let query = supabase
        .from("rides")
        .select("*")
        .eq("status", "active")
        .gte("seats_available", params.passengers || 1)
        .order("departure_date", { ascending: true })
        .order("departure_time", { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);

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

      // Fetch driver profiles
      const driverIds = [...new Set(data?.map((r) => r.driver_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, rating, trips_count, is_verified")
        .in("user_id", driverIds);

      const profileMap = new Map(
        profiles?.map((p) => [p.user_id, p]) || []
      );

      const ridesWithDriver = (data || []).map((ride) => ({
        ...ride,
        driver: profileMap.get(ride.driver_id),
      })) as RideWithDriver[];

      return {
        data: ridesWithDriver,
        nextPage: ridesWithDriver.length === PAGE_SIZE ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 2 * 60 * 1000, // 2 минуты
  });
};

