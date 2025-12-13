/**
 * Парсинг initData от Telegram
 * 
 * ВАЖНО: Проверка валидности данных должна выполняться на сервере!
 * Эта функция только парсит данные для клиента.
 * 
 * @param initData - Строка initData от Telegram
 * @returns Объект с данными пользователя или null
 */

/**
 * Парсинг initData от Telegram
 * 
 * ВАЖНО: Проверка валидности данных должна выполняться на сервере!
 * Эта функция только парсит данные для клиента.
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

/**
 * ВАЖНО: Проверка валидности данных от Telegram должна выполняться на сервере!
 * 
 * Для проверки на сервере используйте следующий алгоритм:
 * 
 * 1. Парсите initData и извлеките hash
 * 2. Создайте dataCheckString из всех параметров кроме hash, отсортированных по ключу
 * 3. Создайте secretKey = HMAC-SHA256('WebAppData', botToken)
 * 4. Вычислите calculatedHash = HMAC-SHA256(secretKey, dataCheckString)
 * 5. Сравните calculatedHash с hash из initData
 * 
 * Пример для Node.js:
 * ```typescript
 * import crypto from 'crypto';
 * 
 * function validateTelegramWebAppData(initData: string, botToken: string): boolean {
 *   const urlParams = new URLSearchParams(initData);
 *   const hash = urlParams.get('hash');
 *   if (!hash) return false;
 *   
 *   urlParams.delete('hash');
 *   const dataCheckString = Array.from(urlParams.entries())
 *     .sort(([a], [b]) => a.localeCompare(b))
 *     .map(([key, value]) => `${key}=${value}`)
 *     .join('\n');
 *   
 *   const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
 *   const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
 *   
 *   return calculatedHash === hash;
 * }
 * ```
 */

