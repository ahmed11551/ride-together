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
        const { display_name: _, id: __, ...insertFields } = updates;
        
        // Используем upsert для обработки возможных конфликтов
        const { data, error } = await supabase
          .from("profiles")
          .upsert({
            id: user.id, // profiles.id должен быть равен user.id (foreign key constraint)
            user_id: user.id,
            display_name: defaultName, // Обязательное поле
            full_name: updates.full_name || defaultName,
            ...insertFields,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'id', // Если профиль уже существует, обновляем его
            ignoreDuplicates: false,
          })
          .select("id, user_id, full_name, phone, avatar_url, bio, rating, trips_count, is_verified, created_at, updated_at, display_name, is_admin, is_banned")
          .single();

        if (error) {
          const { logger } = await import('@/lib/logger');
          logger.error('Profile create/update error', error);
          
          // Если ошибка 409 (Conflict) или 23505 (Unique violation), пробуем обновить
          if (error.code === '23505' || error.code === 'PGRST301' || error.message?.includes('duplicate')) {
            logger.debug('Profile already exists, trying to update...');
            // Пробуем обновить существующий профиль
            const { data: updatedData, error: updateError } = await supabase
              .from("profiles")
              .update({
                ...updates,
                ...(updates.full_name && { display_name: updates.full_name }),
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", user.id)
              .select("id, user_id, full_name, phone, avatar_url, bio, rating, trips_count, is_verified, created_at, updated_at, display_name, is_admin, is_banned")
              .single();
            
            if (updateError) {
              const { logger } = await import('@/lib/logger');
              logger.error('Profile update error after conflict', updateError);
              throw updateError;
            }
            return updatedData;
          }
          
          // Если ошибка foreign key constraint, значит пользователь не существует в auth.users
          if (error.code === '23503') {
            throw new Error('Пользователь не найден. Пожалуйста, войдите заново.');
          }
          
          throw error;
        }
        return data;
      }

      // Обновляем существующий профиль
      // Убираем поля, которые не должны обновляться напрямую
      const { display_name, id, ...updateFields } = updates;
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
        const { logger } = await import('@/lib/logger');
        logger.error('Profile update error', error);
        
        // Если ошибка foreign key constraint, значит пользователь не существует в auth.users
        if (error.code === '23503') {
          throw new Error('Пользователь не найден. Пожалуйста, войдите заново.');
        }
        
        // Если профиль не найден (возможно был удален), создаем заново
        if (error.code === 'PGRST116') {
          logger.debug('Profile not found, creating new one...');
          const defaultName = updates.full_name || user.email?.split('@')[0] || 'Пользователь';
          const { data: newData, error: createError } = await supabase
            .from("profiles")
            .upsert({
              id: user.id,
              user_id: user.id,
              display_name: defaultName,
              full_name: updates.full_name || defaultName,
              ...updateFields,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'id',
              ignoreDuplicates: false,
            })
            .select("id, user_id, full_name, phone, avatar_url, bio, rating, trips_count, is_verified, created_at, updated_at, display_name, is_admin, is_banned")
            .single();
          
          if (createError) {
            const { logger } = await import('@/lib/logger');
            logger.error('Profile create error after update failed', createError);
            throw createError;
          }
          return newData;
        }
        
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
