import { useEffect, useState } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logError, getUserFriendlyError } from '@/lib/error-handler';

/**
 * Хук для авторизации через Telegram
 * Автоматически создает/обновляет профиль пользователя на основе данных Telegram
 */
export const useTelegramAuth = () => {
  const { user: telegramUser, isTelegram, isReady } = useTelegram();
  const { user: supabaseUser, signOut } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isReady || !isTelegram || !telegramUser) {
      return;
    }

    // Автоматическая авторизация через Telegram
    const authenticateWithTelegram = async () => {
      if (isAuthenticating || supabaseUser) {
        return; // Уже авторизован или идет процесс авторизации
      }

      setIsAuthenticating(true);

      try {
        // Проверяем, есть ли пользователь с таким telegram_id
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('telegram_id', telegramUser.id.toString())
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        if (existingProfile) {
          // Пользователь существует - обновляем данные Telegram
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              telegram_username: telegramUser.username,
              telegram_first_name: telegramUser.first_name,
              telegram_last_name: telegramUser.last_name,
              telegram_photo_url: telegramUser.photo_url,
              updated_at: new Date().toISOString(),
            })
            .eq('telegram_id', telegramUser.id.toString());

          if (updateError) {
            throw updateError;
          }

          // Входим через существующий аккаунт
          // Здесь нужно будет реализовать логику входа через Telegram
          // Пока просто показываем сообщение
          toast({
            title: 'Добро пожаловать!',
            description: `Привет, ${telegramUser.first_name}!`,
          });
        } else {
          // Новый пользователь - создаем профиль
          // Для этого нужно сначала создать аккаунт в Supabase Auth
          // Пока просто показываем сообщение
          toast({
            title: 'Новый пользователь',
            description: 'Для полной регистрации заполните профиль',
          });
        }
      } catch (error) {
        logError(error, 'telegramAuth');
        const friendlyError = getUserFriendlyError(error);
        toast({
          variant: 'destructive',
          title: friendlyError.title,
          description: friendlyError.description,
        });
      } finally {
        setIsAuthenticating(false);
      }
    };

    authenticateWithTelegram();
  }, [isReady, isTelegram, telegramUser, supabaseUser, isAuthenticating, toast]);

  return {
    isAuthenticating,
    telegramUser,
    isTelegram,
  };
};

