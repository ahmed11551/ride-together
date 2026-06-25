import { useEffect, useState } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { logError, getUserFriendlyError } from '@/lib/error-handler';

/**
 * Авторизация через Telegram Mini App
 */
export const useTelegramAuth = () => {
  const { user: telegramUser, isTelegram, isReady, webApp } = useTelegram();
  const { user, signInWithToken } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isReady || !isTelegram || !telegramUser || user || isAuthenticating) {
      return;
    }

    const authenticate = async () => {
      setIsAuthenticating(true);
      try {
        const data = await apiClient.post<{
          user: { id: string; email: string; user_metadata?: { full_name?: string } };
          token: string;
          is_new_user?: boolean;
        }>('/api/auth/telegram', {
          init_data: webApp?.initData || '',
          user: {
            id: telegramUser.id,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name,
            username: telegramUser.username,
            photo_url: telegramUser.photo_url,
          },
        });

        await signInWithToken(data.token, data.user);

        toast({
          title: data.is_new_user ? 'Добро пожаловать!' : 'С возвращением!',
          description: `Привет, ${telegramUser.first_name}!`,
        });
      } catch (error) {
        logError(error, 'telegramAuth');
        const friendlyError = getUserFriendlyError(error);
        toast({
          variant: 'destructive',
          title: friendlyError.title,
          description: friendlyError.description || 'Ошибка авторизации через Telegram',
        });
      } finally {
        setIsAuthenticating(false);
      }
    };

    authenticate();
  }, [isReady, isTelegram, telegramUser, user, isAuthenticating, webApp, signInWithToken, toast]);

  return { isAuthenticating, telegramUser, isTelegram };
};
