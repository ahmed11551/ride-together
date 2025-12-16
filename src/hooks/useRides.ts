import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
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
      const queryParams = new URLSearchParams();
      if (params.from) queryParams.append('from', params.from);
      if (params.to) queryParams.append('to', params.to);
      if (params.date) queryParams.append('date', params.date);
      if (params.passengers) queryParams.append('passengers', params.passengers.toString());

      const data = await apiClient.get<RideWithDriver[]>(`/api/rides?${queryParams.toString()}`);
      return data;
    },
  });
};

export const useRideById = (rideId: string | undefined) => {
  return useQuery({
    queryKey: ["ride", rideId],
    queryFn: async () => {
      if (!rideId) return null;

      const data = await apiClient.get<RideWithDriver>(`/api/rides/${rideId}`);
      return data;
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

      const data = await apiClient.get<Ride[]>(`/api/rides/my`);
      return data;
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

      const data = await apiClient.post<Ride>('/api/rides', ride);
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
      const data = await apiClient.put<Ride>(`/api/rides/${id}`, updates);
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
      const data = await apiClient.get<RideWithDriver[]>('/api/rides?limit=10&status=active');
      return data;
    },
  });
};

/**
 * Хук для очистки старых отмененных и завершенных поездок пользователя
 * Удаляет поездки, которые были отменены или завершены более 30 дней назад
 */
export const useCleanupOldRides = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // Получаем старые поездки
      const myRides = await apiClient.get<Ride[]>('/api/rides/my?status=cancelled');
      const completedRides = await apiClient.get<Ride[]>('/api/rides/my?status=completed');
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      let deletedCount = 0;
      
      // Удаляем старые отмененные и завершенные поездки
      for (const ride of [...myRides, ...completedRides]) {
        const rideDate = new Date(ride.updated_at);
        if (rideDate < thirtyDaysAgo) {
          try {
            await apiClient.delete(`/api/rides/${ride.id}`);
            deletedCount++;
          } catch (error) {
            console.error(`Error deleting ride ${ride.id}:`, error);
          }
        }
      }

      return deletedCount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rides"] });
      queryClient.invalidateQueries({ queryKey: ["myRides"] });
    },
  });
};
