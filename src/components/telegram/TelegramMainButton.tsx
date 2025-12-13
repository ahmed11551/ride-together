import { useEffect } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';

interface TelegramMainButtonProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
  progress?: boolean;
  color?: string;
  textColor?: string;
}

/**
 * Компонент главной кнопки для Telegram Mini App
 * Отображается внизу экрана в Telegram
 */
export const TelegramMainButton = ({
  text,
  onClick,
  disabled = false,
  progress = false,
  color,
  textColor,
}: TelegramMainButtonProps) => {
  const { webApp, isTelegram } = useTelegram();

  useEffect(() => {
    if (!isTelegram || !webApp) {
      return;
    }

    // Настраиваем кнопку
    webApp.MainButton.setText(text);
    webApp.MainButton.enable();
    
    if (disabled) {
      webApp.MainButton.disable();
    }

    if (progress) {
      webApp.MainButton.showProgress();
    } else {
      webApp.MainButton.hideProgress();
    }

    if (color) {
      webApp.MainButton.setParams({ color });
    }

    if (textColor) {
      webApp.MainButton.setParams({ text_color: textColor });
    }

    // Показываем кнопку
    webApp.MainButton.show();

    // Обработчик клика
    webApp.MainButton.onClick(onClick);

    // Очистка при размонтировании
    return () => {
      webApp.MainButton.hide();
      webApp.MainButton.offClick(onClick);
    };
  }, [webApp, isTelegram, text, onClick, disabled, progress, color, textColor]);

  return null; // Кнопка рендерится Telegram SDK
};

