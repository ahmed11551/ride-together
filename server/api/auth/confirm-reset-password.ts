/**
 * Установка нового пароля по токену сброса
 * POST /api/auth/confirm-reset-password
 */

import { hash } from 'bcrypt';
import { Request, Response } from 'express';
import { db } from '../../utils/database.js';
import { validatePassword } from '../../middleware/validator.js';

export async function confirmResetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { token, password } = req.body as { token?: string; password?: string };

    if (!token || !password) {
      res.status(400).json({ error: 'Токен и новый пароль обязательны' });
      return;
    }

    if (!validatePassword(password)) {
      res.status(400).json({
        error: 'Пароль должен быть не менее 8 символов и содержать букву и цифру',
      });
      return;
    }

    const userResult = await db.query(
      `SELECT id FROM users
       WHERE password_reset_token = $1
         AND password_reset_expires_at > NOW()`,
      [token]
    );

    if (userResult.rows.length === 0) {
      res.status(400).json({ error: 'Ссылка недействительна или истекла' });
      return;
    }

    const userId = userResult.rows[0].id;
    const passwordHash = await hash(password, 10);

    await db.query(
      `UPDATE users SET
         password_hash = $1,
         password_reset_token = NULL,
         password_reset_expires_at = NULL,
         updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, userId]
    );

    // Инвалидируем старые сессии
    await db.query('DELETE FROM sessions WHERE user_id = $1', [userId]);

    res.status(200).json({ message: 'Пароль успешно изменён' });
  } catch (error) {
    console.error('Confirm reset password error:', error);
    res.status(500).json({ error: 'Ошибка при смене пароля' });
  }
}
