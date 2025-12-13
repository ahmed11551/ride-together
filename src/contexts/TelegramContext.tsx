import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Telegram Web App types
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        enableClosingConfirmation: () => void;
        disableClosingConfirmation: () => void;
        onEvent: (eventType: string, eventHandler: () => void) => void;
        offEvent: (eventType: string, eventHandler: () => void) => void;
        sendData: (data: string) => void;
        openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
        openTelegramLink: (url: string) => void;
        openInvoice: (url: string, callback?: (status: string) => void) => void;
        showPopup: (params: { title?: string; message: string; buttons?: Array<{ id?: string; type: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'; text: string }> }, callback?: (id: string) => void) => void;
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
        showScanQrPopup: (params: { text?: string }, callback?: (data: string) => void) => void;
        closeScanQrPopup: () => void;
        readTextFromClipboard: (callback?: (text: string) => void) => void;
        requestWriteAccess: (callback?: (granted: boolean) => void) => void;
        requestContact: (callback?: (granted: boolean, contact?: { phone_number: string; first_name: string; last_name?: string; user_id?: number }) => void) => void;
        version: string;
        platform: string;
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        isClosingConfirmationEnabled: boolean;
        initData: string;
        initDataUnsafe: {
          user?: TelegramUser;
          auth_date?: number;
          hash?: string;
        };
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        MainButton: {
          setText: (text: string) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: () => void;
          hideProgress: () => void;
          setParams: (params: { color?: string; text_color?: string }) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    auth_date?: number;
    hash?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  BackButton: typeof BackButton;
  MainButton: typeof MainButton;
  HapticFeedback: typeof HapticFeedback;
  ready: () => void;
  expand: () => void;
  close: () => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  onEvent: (eventType: string, eventHandler: () => void) => void;
  offEvent: (eventType: string, eventHandler: () => void) => void;
  sendData: (data: string) => void;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;
  openInvoice: (url: string, callback?: (status: string) => void) => void;
  showPopup: (params: { title?: string; message: string; buttons?: Array<{ id?: string; type: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'; text: string }> }, callback?: (id: string) => void) => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  showScanQrPopup: (params: { text?: string }, callback?: (data: string) => void) => void;
  closeScanQrPopup: () => void;
  readTextFromClipboard: (callback?: (text: string) => void) => void;
  requestWriteAccess: (callback?: (granted: boolean) => void) => void;
  requestContact: (callback?: (granted: boolean, contact?: { phone_number: string; first_name: string; last_name?: string; user_id?: number }) => void) => void;
}

interface TelegramContextType {
  webApp: TelegramWebApp | null;
  user: TelegramUser | null;
  isReady: boolean;
  isTelegram: boolean;
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

export const useTelegram = () => {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram must be used within TelegramProvider');
  }
  return context;
};

interface TelegramProviderProps {
  children: ReactNode;
}

export const TelegramProvider = ({ children }: TelegramProviderProps) => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    // Проверяем, запущено ли приложение в Telegram
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      setIsTelegram(true);
      
      // Инициализируем WebApp
      tg.ready();
      tg.expand();

      // Создаем объект с методами Telegram WebApp
      const webAppInstance: TelegramWebApp = {
        initData: initDataRaw,
        initDataUnsafe: initData,
        version: tg.version || '6.0',
        platform: tg.platform || 'unknown',
        colorScheme: tg.colorScheme || 'light',
        themeParams: themeParams || {},
        isExpanded: tg.isExpanded || false,
        viewportHeight: viewport.height,
        viewportStableHeight: viewport.stableHeight,
        headerColor: tg.headerColor || '#ffffff',
        backgroundColor: tg.backgroundColor || '#ffffff',
        isClosingConfirmationEnabled: tg.isClosingConfirmationEnabled || false,
        BackButton,
        MainButton,
        HapticFeedback,
        ready: () => tg.ready(),
        expand: () => tg.expand(),
        close: () => tg.close(),
        enableClosingConfirmation: () => tg.enableClosingConfirmation(),
        disableClosingConfirmation: () => tg.disableClosingConfirmation(),
        onEvent: (eventType: string, eventHandler: () => void) => tg.onEvent(eventType, eventHandler),
        offEvent: (eventType: string, eventHandler: () => void) => tg.offEvent(eventType, eventHandler),
        sendData: (data: string) => tg.sendData(data),
        openLink: (url: string, options?: { try_instant_view?: boolean }) => tg.openLink(url, options),
        openTelegramLink: (url: string) => tg.openTelegramLink(url),
        openInvoice: (url: string, callback?: (status: string) => void) => tg.openInvoice(url, callback),
        showPopup: (params: { title?: string; message: string; buttons?: Array<{ id?: string; type: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'; text: string }> }, callback?: (id: string) => void) => tg.showPopup(params, callback),
        showAlert: (message: string, callback?: () => void) => tg.showAlert(message, callback),
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => tg.showConfirm(message, callback),
        showScanQrPopup: (params: { text?: string }, callback?: (data: string) => void) => tg.showScanQrPopup(params, callback),
        closeScanQrPopup: () => tg.closeScanQrPopup(),
        readTextFromClipboard: (callback?: (text: string) => void) => tg.readTextFromClipboard(callback),
        requestWriteAccess: (callback?: (granted: boolean) => void) => tg.requestWriteAccess(callback),
        requestContact: (callback?: (granted: boolean, contact?: { phone_number: string; first_name: string; last_name?: string; user_id?: number }) => void) => tg.requestContact(callback),
      };

      setWebApp(webAppInstance);

      // Получаем данные пользователя
      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
      }

      // Применяем тему Telegram
      const theme = tg.themeParams || {};
      if (theme.bg_color) {
        document.documentElement.style.setProperty('--tg-theme-bg-color', theme.bg_color);
      }
      if (theme.text_color) {
        document.documentElement.style.setProperty('--tg-theme-text-color', theme.text_color);
      }
      if (theme.hint_color) {
        document.documentElement.style.setProperty('--tg-theme-hint-color', theme.hint_color);
      }
      if (theme.link_color) {
        document.documentElement.style.setProperty('--tg-theme-link-color', theme.link_color);
      }
      if (theme.button_color) {
        document.documentElement.style.setProperty('--tg-theme-button-color', theme.button_color);
      }
      if (theme.button_text_color) {
        document.documentElement.style.setProperty('--tg-theme-button-text-color', theme.button_text_color);
      }

      // Скрываем адресную строку и настраиваем viewport
      document.documentElement.style.setProperty('--tg-viewport-height', `${tg.viewportHeight}px`);
      document.documentElement.style.setProperty('--tg-viewport-stable-height', `${tg.viewportStableHeight}px`);

      setIsReady(true);

      // Обработка изменений viewport
      tg.onEvent('viewportChanged', () => {
        document.documentElement.style.setProperty('--tg-viewport-height', `${tg.viewportHeight}px`);
        document.documentElement.style.setProperty('--tg-viewport-stable-height', `${tg.viewportStableHeight}px`);
      });
    } else {
      // Не в Telegram - работаем как обычное веб-приложение
      setIsTelegram(false);
      setIsReady(true);
    }
  }, []);

  return (
    <TelegramContext.Provider value={{ webApp, user, isReady, isTelegram }}>
      {children}
    </TelegramContext.Provider>
  );
};

