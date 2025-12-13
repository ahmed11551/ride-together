import { useEffect } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';
import { useNavigate } from 'react-router-dom';

interface TelegramBackButtonProps {
  onClick?: () => void;
  fallbackPath?: string;
}

/**
 * Компонент кнопки "Назад" для Telegram Mini App
 * Автоматически показывает/скрывает кнопку в зависимости от истории навигации
 */
export const TelegramBackButton = ({ onClick, fallbackPath = '/' }: TelegramBackButtonProps) => {
  const { webApp, isTelegram } = useTelegram();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isTelegram || !webApp) {
      return;
    }

    const handleBackClick = () => {
      if (onClick) {
        onClick();
      } else {
        // Проверяем, можем ли вернуться назад
        if (window.history.length > 1) {
          navigate(-1);
        } else {
          navigate(fallbackPath);
        }
      }
    };

    // Показываем кнопку "Назад"
    webApp.BackButton.show();
    webApp.BackButton.onClick(handleBackClick);

    // Скрываем кнопку при размонтировании
    return () => {
      webApp.BackButton.hide();
      webApp.BackButton.offClick(handleBackClick);
    };
  }, [webApp, isTelegram, navigate, onClick, fallbackPath]);

  return null; // Кнопка рендерится Telegram SDK
};

