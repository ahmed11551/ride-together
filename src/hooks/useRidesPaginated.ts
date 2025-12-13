import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Ride, RideWithDriver } from "./useRides";

interface PaginationParams {
  page: number;
  pageSize?: number;
}

interface SearchParams {
  from?: string;
  to?: string;
  date?: string;
  passengers?: number;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

const DEFAULT_PAGE_SIZE = 10;

/**
 * Hook for paginated search of rides
 */
export const useSearchRidesPaginated = (
  params: SearchParams,
  pagination: PaginationParams
) => {
  const pageSize = pagination.pageSize || DEFAULT_PAGE_SIZE;
  const offset = (pagination.page - 1) * pageSize;

  return useQuery({
    queryKey: ["rides", "search", "paginated", params, pagination],
    queryFn: async (): Promise<PaginatedResult<RideWithDriver>> => {
      // First, get total count
      let countQuery = supabase
        .from("rides")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .gte("seats_available", params.passengers || 1);

      if (params.from) {
        countQuery = countQuery.ilike("from_city", `%${params.from}%`);
      }
      if (params.to) {
        countQuery = countQuery.ilike("to_city", `%${params.to}%`);
      }
      if (params.date) {
        countQuery = countQuery.eq("departure_date", params.date);
      }

      const { count, error: countError } = await countQuery;
      if (countError) throw countError;

      // Then, get paginated data
      let query = supabase
        .from("rides")
        .select("*")
        .eq("status", "active")
        .gte("seats_available", params.passengers || 1)
        .order("departure_date", { ascending: true })
        .order("departure_time", { ascending: true })
        .range(offset, offset + pageSize - 1);

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

      const total = count || 0;
      const totalPages = Math.ceil(total / pageSize);

      return {
        data: ridesWithDriver,
        total,
        page: pagination.page,
        pageSize,
        totalPages,
        hasMore: pagination.page < totalPages,
      };
    },
  });
};

/**
 * Hook for paginated recent rides
 */
export const useRecentRidesPaginated = (pagination: PaginationParams) => {
  const pageSize = pagination.pageSize || DEFAULT_PAGE_SIZE;
  const offset = (pagination.page - 1) * pageSize;

  return useQuery({
    queryKey: ["rides", "recent", "paginated", pagination],
    queryFn: async (): Promise<PaginatedResult<RideWithDriver>> => {
      // Get total count
      const { count, error: countError } = await supabase
        .from("rides")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .gte("departure_date", new Date().toISOString().split("T")[0])
        .gt("seats_available", 0);

      if (countError) throw countError;

      // Get paginated data
      const { data, error } = await supabase
        .from("rides")
        .select("*")
        .eq("status", "active")
        .gte("departure_date", new Date().toISOString().split("T")[0])
        .gt("seats_available", 0)
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;

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

      const total = count || 0;
      const totalPages = Math.ceil(total / pageSize);

      return {
        data: ridesWithDriver,
        total,
        page: pagination.page,
        pageSize,
        totalPages,
        hasMore: pagination.page < totalPages,
      };
    },
  });
};

