import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
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

  return useQuery({
    queryKey: ["rides", "search", "paginated", params, pagination],
    queryFn: async (): Promise<PaginatedResult<RideWithDriver>> => {
      // Строим query параметры
      const queryParams = new URLSearchParams();
      queryParams.append('status', 'active');
      queryParams.append('page', pagination.page.toString());
      queryParams.append('pageSize', pageSize.toString());
      queryParams.append('includePagination', 'true');
      
      if (params.from) queryParams.append('from', params.from);
      if (params.to) queryParams.append('to', params.to);
      if (params.date) queryParams.append('date', params.date);
      if (params.passengers) queryParams.append('passengers', params.passengers.toString());

      // API возвращает объект с пагинацией
      const result = await apiClient.get<PaginatedResult<RideWithDriver>>(
        `/api/rides?${queryParams.toString()}`
      );

      return result;
    },
  });
};

/**
 * Hook for paginated recent rides
 */
export const useRecentRidesPaginated = (pagination: PaginationParams) => {
  const pageSize = pagination.pageSize || DEFAULT_PAGE_SIZE;

  return useQuery({
    queryKey: ["rides", "recent", "paginated", pagination],
    queryFn: async (): Promise<PaginatedResult<RideWithDriver>> => {
      // Строим query параметры для recent rides
      const queryParams = new URLSearchParams();
      queryParams.append('status', 'active');
      queryParams.append('page', pagination.page.toString());
      queryParams.append('pageSize', pageSize.toString());
      queryParams.append('includePagination', 'true');
      queryParams.append('sortBy', 'recent'); // Сортировка по created_at DESC
      
      // Не фильтруем по дате - показываем все активные поездки, отсортированные по дате создания

      // API возвращает объект с пагинацией
      const result = await apiClient.get<PaginatedResult<RideWithDriver>>(
        `/api/rides?${queryParams.toString()}`
      );

      return result;
    },
  });
};

