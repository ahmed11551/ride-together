import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  rating: number;
  trips_count: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, phone, avatar_url, bio, rating, trips_count, is_verified, created_at, updated_at, display_name, is_admin, is_banned")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Profile | null;
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

      // Проверяем, существует ли профиль
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      // Если профиль не существует, создаем его
      if (!existingProfile) {
        const defaultName = updates.full_name || user.email?.split('@')[0] || 'Пользователь';
        // Убираем поля, которые не должны быть в insert
        const { display_name: _, ...insertFields } = updates;
        const { data, error } = await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            display_name: defaultName, // Обязательное поле
            full_name: updates.full_name || defaultName,
            ...insertFields,
            updated_at: new Date().toISOString(),
          })
          .select("id, user_id, full_name, phone, avatar_url, bio, rating, trips_count, is_verified, created_at, updated_at, display_name, is_admin, is_banned")
          .single();

        if (error) {
          console.error('Profile create error:', error);
          throw error;
        }
        return data;
      }

      // Обновляем существующий профиль
      // Убираем поля, которые не должны обновляться напрямую
      const { display_name, ...updateFields } = updates;
      const { data, error } = await supabase
        .from("profiles")
        .update({
          ...updateFields,
          // Обновляем display_name только если изменился full_name
          ...(updates.full_name && { display_name: updates.full_name }),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select("id, user_id, full_name, phone, avatar_url, bio, rating, trips_count, is_verified, created_at, updated_at, display_name, is_admin, is_banned")
        .single();

      if (error) {
        console.error('Profile update error:', error);
        throw error;
      }
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
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, phone, avatar_url, bio, rating, trips_count, is_verified, created_at, updated_at, display_name, is_admin, is_banned")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!userId,
  });
};
