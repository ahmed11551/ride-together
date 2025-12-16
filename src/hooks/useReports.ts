import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
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

      const data = await apiClient.post<Report>('/api/reports', report);
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

      const data = await apiClient.get<Report[]>(`/api/reports?my=true`);
      return data;
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

      const profile = await apiClient.get<{ is_admin?: boolean }>('/api/profiles/me');
      return profile?.is_admin || false;
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
      const data = await apiClient.get<Report[]>('/api/reports');
      return data;
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
      const data = await apiClient.put<Report>(`/api/reports/${id}`, { status, admin_notes });
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
      const data = await apiClient.put<{ id: string; user_id: string; is_banned: boolean }>(
        `/api/profiles/${userId}/ban`,
        { is_banned: isBanned }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
};
