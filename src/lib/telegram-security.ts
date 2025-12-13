import crypto from 'crypto';

/**
 * Проверка валидности данных от Telegram Web App
 * 
 * @param initData - Строка initData от Telegram
 * @param botToken - Токен бота
 * @returns true если данные валидны, false в противном случае
 */
export function validateTelegramWebAppData(initData: string, botToken: string): boolean {
  try {
    // Парсим initData
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    
    if (!hash) {
      return false;
    }

    // Удаляем hash из параметров
    urlParams.delete('hash');

    // Сортируем параметры по ключу
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Создаем секретный ключ
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Вычисляем хеш
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Сравниваем хеши
    return calculatedHash === hash;
  } catch (error) {
    console.error('Error validating Telegram Web App data:', error);
    return false;
  }
}

/**
 * Парсинг initData от Telegram
 * 
 * @param initData - Строка initData от Telegram
 * @returns Объект с данными пользователя или null
 */
export function parseTelegramInitData(initData: string): {
  user?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    language_code?: string;
  };
  auth_date?: number;
  hash?: string;
} | null {
  try {
    const urlParams = new URLSearchParams(initData);
    const userParam = urlParams.get('user');
    
    if (!userParam) {
      return null;
    }

    const user = JSON.parse(userParam);
    const authDate = urlParams.get('auth_date');
    const hash = urlParams.get('hash');

    return {
      user,
      auth_date: authDate ? parseInt(authDate, 10) : undefined,
      hash: hash || undefined,
    };
  } catch (error) {
    console.error('Error parsing Telegram initData:', error);
    return null;
  }
}

