import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";

export interface SavedSearch {
  id: string;
  name?: string | null;
  fromCity?: string | null;
  toCity?: string | null;
  date?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  timeFrom?: string | null;
  timeTo?: string | null;
  passengers?: number;
  minPrice?: number;
  maxPrice?: number;
  allowSmoking?: boolean | null;
  allowPets?: boolean | null;
  allowMusic?: boolean | null;
  minRating?: number;
  sortBy?: string;
  notifyTelegram: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastSearchedAt?: string;
}

export interface CreateSavedSearchInput {
  name?: string;
  fromCity?: string;
  toCity?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  timeFrom?: string;
  timeTo?: string;
  passengers?: number;
  minPrice?: number;
  maxPrice?: number;
  allowSmoking?: boolean;
  allowPets?: boolean;
  allowMusic?: boolean;
  minRating?: number;
  sortBy?: string;
  notifyTelegram?: boolean;
}

export function savedSearchToParams(search: SavedSearch): URLSearchParams {
  const params = new URLSearchParams();
  if (search.fromCity) params.set("from", search.fromCity);
  if (search.toCity) params.set("to", search.toCity);
  if (search.date) params.set("date", search.date);
  if (search.passengers) params.set("passengers", String(search.passengers));
  return params;
}

export const useSavedSearches = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["saved-searches", user?.id],
    queryFn: async () => {
      const data = await apiClient.get<{ searches: SavedSearch[] }>("/api/saved-searches");
      return data.searches;
    },
    enabled: !!user,
  });
};

export const useCreateSavedSearch = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateSavedSearchInput) => {
      if (!user) throw new Error("Not authenticated");
      return apiClient.post<SavedSearch>("/api/saved-searches", input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
    },
  });
};

export const useUpdateSavedSearch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<CreateSavedSearchInput>) => {
      await apiClient.put(`/api/saved-searches/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
    },
  });
};

export const useDeleteSavedSearch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/saved-searches/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
    },
  });
};
