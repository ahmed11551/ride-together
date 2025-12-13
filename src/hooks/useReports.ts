import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  ride_id: string | null;
  reason: string;
  description: string | null;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  reported_user?: {
    full_name: string | null;
    email: string | null;
  };
  reporter?: {
    full_name: string | null;
  };
  ride?: {
    from_city: string;
    to_city: string;
  };
}

export interface ReportInput {
  reported_user_id: string;
  ride_id?: string;
  reason: string;
  description?: string;
}

/**
 * Create a report
 */
export const useCreateReport = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (report: ReportInput) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("reports")
        .insert({
          ...report,
          reporter_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
};

/**
 * Get user's reports
 */
export const useMyReports = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["reports", "my", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("reporter_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Report[];
    },
    enabled: !!user,
  });
};

/**
 * Check if user is admin
 */
export const useIsAdmin = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;

      const { data } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", user.id)
        .maybeSingle();

      return data?.is_admin || false;
    },
    enabled: !!user,
  });
};

/**
 * Get all reports (admin only)
 */
export const useAllReports = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["reports", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select(`
          *,
          reported_user:profiles!reports_reported_user_id_fkey(user_id, full_name),
          reporter:profiles!reports_reporter_id_fkey(user_id, full_name),
          ride:rides(id, from_city, to_city)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Report[];
    },
    enabled: !!isAdmin,
  });
};

/**
 * Update report status (admin only)
 */
export const useUpdateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      admin_notes,
    }: {
      id: string;
      status: Report["status"];
      admin_notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("reports")
        .update({ status, admin_notes })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
};

/**
 * Ban/unban user (admin only)
 */
export const useBanUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      isBanned,
    }: {
      userId: string;
      isBanned: boolean;
    }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update({ is_banned: isBanned })
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
};

