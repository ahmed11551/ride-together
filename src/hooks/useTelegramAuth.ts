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
          .maybeSingle();

        // PGRST116 - это код "не найдено", это нормально для новых пользователей
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile lookup error:', profileError);
          // Не бросаем ошибку, если это просто "не найдено"
          // Продолжаем создание нового профиля
        }

        if (existingProfile) {
          // Пользователь существует - обновляем данные Telegram
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              telegram_username: telegramUser.username || null,
              telegram_first_name: telegramUser.first_name || null,
              telegram_last_name: telegramUser.last_name || null,
              telegram_photo_url: telegramUser.photo_url || null,
              updated_at: new Date().toISOString(),
            })
            .eq('telegram_id', telegramUser.id.toString());

          if (updateError) {
            throw updateError;
          }

          // Если есть user_id, значит пользователь уже авторизован через Supabase Auth
          if (existingProfile.user_id && !supabaseUser) {
            // Пользователь существует, но не авторизован - нужно войти
            // Для этого используем email из профиля, если он есть
            // Или просто обновляем данные и показываем сообщение
            toast({
              title: 'Добро пожаловать!',
              description: `Привет, ${telegramUser.first_name}! Ваш профиль обновлен.`,
            });
          } else {
            toast({
              title: 'Добро пожаловать!',
              description: `Привет, ${telegramUser.first_name}!`,
            });
          }
        } else {
          // Новый пользователь - создаем профиль через Supabase Auth
          // Создаем уникальный email на основе telegram_id
          const telegramEmail = `telegram_${telegramUser.id}@telegram.local`;
          const randomPassword = crypto.randomUUID(); // Временный пароль
          
          // Создаем аккаунт в Supabase Auth
          const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email: telegramEmail,
            password: randomPassword,
            options: {
              data: {
                full_name: `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
                telegram_id: telegramUser.id.toString(),
              },
            },
          });

          if (signUpError) {
            throw signUpError;
          }

          if (authData.user) {
            // Создаем профиль
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: authData.user.id,
                user_id: authData.user.id,
                telegram_id: telegramUser.id.toString(),
                telegram_username: telegramUser.username || null,
                telegram_first_name: telegramUser.first_name || null,
                telegram_last_name: telegramUser.last_name || null,
                telegram_photo_url: telegramUser.photo_url || null,
                full_name: `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
                display_name: telegramUser.first_name || 'Пользователь',
                email: telegramEmail,
                avatar_url: telegramUser.photo_url || null,
              });

            if (profileError) {
              const { logger } = await import('@/lib/logger');
              logger.error('Profile creation error', profileError);
              // Если профиль уже существует (дубликат), пытаемся обновить
              if (profileError.code === '23505') { // Unique violation
                logger.debug('Profile already exists, updating...');
                const { error: updateError } = await supabase
                  .from('profiles')
                  .update({
                    telegram_username: telegramUser.username || null,
                    telegram_first_name: telegramUser.first_name || null,
                    telegram_last_name: telegramUser.last_name || null,
                    telegram_photo_url: telegramUser.photo_url || null,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('user_id', authData.user.id);
                
                if (updateError) {
                  throw new Error('Не удалось обновить профиль. Попробуйте еще раз.');
                }
              } else {
                throw new Error('Не удалось создать профиль. Попробуйте еще раз.');
              }
            }

            toast({
              title: 'Добро пожаловать!',
              description: `Привет, ${telegramUser.first_name}! Ваш аккаунт создан.`,
            });
          }
        }
      } catch (error) {
        logError(error, 'telegramAuth');
        const { logger } = await import('@/lib/logger');
        logger.error('Telegram auth error', error);
        
        // Более детальная обработка ошибок
        let errorMessage = 'Произошла ошибка при авторизации';
        if (error instanceof Error) {
          if (error.message.includes('user') && error.message.includes('exist')) {
            errorMessage = 'Пользователь не найден. Попробуйте обновить страницу.';
          } else if (error.message.includes('duplicate') || error.message.includes('unique')) {
            errorMessage = 'Профиль уже существует. Попробуйте обновить страницу.';
          } else {
            errorMessage = error.message;
          }
        }
        
        const friendlyError = getUserFriendlyError(error);
        toast({
          variant: 'destructive',
          title: friendlyError.title,
          description: friendlyError.description || errorMessage,
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

