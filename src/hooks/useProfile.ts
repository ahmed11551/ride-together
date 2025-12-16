import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  rating: number; // Рейтинг водителя
  passenger_rating?: number; // Рейтинг пассажира (опционально, по умолчанию 5.0)
  trips_count: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  display_name?: string;
  is_admin?: boolean;
  is_banned?: boolean;
}

export const useProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const data = await apiClient.get<Profile>('/api/profiles/me');
      return data;
    },
    enabled: !!user,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user) throw new Error("Not authenticated");

      const data = await apiClient.put<Profile>('/api/profiles/me', updates);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
};

export const useProfileById = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const data = await apiClient.get<Profile>(`/api/profiles/${userId}`);
      return data;
    },
    enabled: !!userId,
  });
};
