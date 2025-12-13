import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTelegram } from "@/contexts/TelegramContext";

export interface Subscription {
  id: string;
  user_id: string;
  telegram_user_id: number;
  telegram_username?: string;
  subscription_type: "free" | "premium" | "premium_plus";
  subscription_status: "active" | "cancelled" | "expired";
  subscribed_at: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BotUser {
  id: string;
  telegram_user_id: number;
  telegram_username?: string;
  telegram_first_name?: string;
  is_subscribed: boolean;
  last_interaction_at: string;
}

/**
 * Get user's subscription
 */
export const useSubscription = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return data as Subscription | null;
    },
    enabled: !!user,
  });
};

/**
 * Create or update subscription
 */
export const useCreateSubscription = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { user: telegramUser } = useTelegram();

  return useMutation({
    mutationFn: async (type: "free" | "premium" | "premium_plus" = "free") => {
      if (!user || !telegramUser) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          telegram_user_id: telegramUser.id,
          telegram_username: telegramUser.username,
          telegram_first_name: telegramUser.first_name,
          telegram_last_name: telegramUser.last_name,
          subscription_type: type,
          subscription_status: "active",
        }, {
          onConflict: "user_id",
        })
        .select()
        .single();

      if (error) throw error;
      return data as Subscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
};

/**
 * Check if user is subscribed to bot
 */
export const useBotSubscription = () => {
  const { user: telegramUser } = useTelegram();

  return useQuery({
    queryKey: ["bot-subscription", telegramUser?.id],
    queryFn: async () => {
      if (!telegramUser) return null;

      const { data, error } = await supabase
        .from("bot_users")
        .select("*")
        .eq("telegram_user_id", telegramUser.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return data as BotUser | null;
    },
    enabled: !!telegramUser,
  });
};

/**
 * Get bot statistics (admin only)
 */
export const useBotStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["bot-stats"],
    queryFn: async () => {
      const { data: totalUsers, error: usersError } = await supabase
        .from("bot_users")
        .select("id", { count: "exact", head: true });

      if (usersError) throw usersError;

      const { data: subscribedUsers, error: subscribedError } = await supabase
        .from("bot_users")
        .select("id", { count: "exact", head: true })
        .eq("is_subscribed", true);

      if (subscribedError) throw subscribedError;

      const { data: subscriptions, error: subsError } = await supabase
        .from("subscriptions")
        .select("subscription_type", { count: "exact", head: true });

      if (subsError) throw subsError;

      return {
        totalUsers: totalUsers || 0,
        subscribedUsers: subscribedUsers || 0,
        subscriptions: subscriptions || 0,
      };
    },
    enabled: !!user,
  });
};

