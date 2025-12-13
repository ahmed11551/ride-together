import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select(`
          user_id,
          full_name,
          phone,
          avatar_url,
          rating,
          trips_count,
          is_verified,
          is_admin,
          is_banned,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get emails from auth.users (requires service role or admin function)
      // For now, we'll just return profiles without emails
      return profiles as UserProfile[];
    },
    enabled: !!isAdmin,
  });
};

