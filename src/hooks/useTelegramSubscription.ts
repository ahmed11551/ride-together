import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useTelegram } from "@/contexts/TelegramContext";
import { apiClient } from "@/lib/api-client";

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

      const response = await apiClient.get('/api/telegram/status');
      return response.data.subscription as Subscription | null;
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

      const response = await apiClient.post('/api/telegram/subscribe', {
        telegram_user_id: telegramUser.id,
        telegram_username: telegramUser.username,
        telegram_first_name: telegramUser.first_name,
        telegram_last_name: telegramUser.last_name,
      });

      // Получаем обновленную подписку
      const statusResponse = await apiClient.get('/api/telegram/status');
      return statusResponse.data.subscription as Subscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.invalidateQueries({ queryKey: ["bot-subscription"] });
    },
  });
};

/**
 * Check if user is subscribed to bot
 */
export const useBotSubscription = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["bot-subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const response = await apiClient.get('/api/telegram/status');
      const status = response.data;
      
      if (!status.is_subscribed || !status.subscription) {
        return null;
      }

      return {
        id: status.subscription.id,
        telegram_user_id: status.subscription.telegram_user_id,
        telegram_username: status.subscription.telegram_username,
        telegram_first_name: null,
        is_subscribed: status.is_subscribed,
        last_interaction_at: status.subscription.subscribed_at,
      } as BotUser;
    },
    enabled: !!user,
  });
};

/**
 * Get bot statistics (admin only)
 * TODO: Реализовать через API endpoint
 */
export const useBotStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["bot-stats"],
    queryFn: async () => {
      // TODO: Создать API endpoint /api/telegram/stats для администраторов
      return {
        totalUsers: 0,
        subscribedUsers: 0,
        subscriptions: 0,
      };
    },
    enabled: !!user,
  });
};

