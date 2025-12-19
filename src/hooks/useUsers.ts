import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useIsAdmin } from "./useReports";

export interface UserProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  rating: number;
  trips_count: number;
  is_verified: boolean;
  is_admin: boolean;
  is_banned: boolean;
  created_at: string;
}

/**
 * Get all users (admin only)
 */
export const useAllUsers = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["users", "all"],
    queryFn: async () => {
      const users = await apiClient.get<UserProfile[]>('/api/users');
      return users;
    },
    enabled: !!isAdmin,
  });
};

