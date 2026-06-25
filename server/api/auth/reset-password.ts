/**
 * Запрос сброса пароля
 * POST /api/auth/reset-password
 */

import crypto from 'crypto';
import { Request, Response } from 'express';
import { db } from '../../utils/database.js';
import { emailService } from '../../services/emailService.js';

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body as { email?: string };

    if (!email) {
      res.status(400).json({ error: 'Email обязателен' });
      return;
    }

    const userResult = await db.query('SELECT id, email FROM users WHERE email = $1', [email]);

    // Всегда возвращаем успех — не раскрываем наличие аккаунта
    if (userResult.rows.length === 0) {
      res.status(200).json({ message: 'Если аккаунт существует, письмо отправлено' });
      return;
    }

    const user = userResult.rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await db.query(
      `UPDATE users SET password_reset_token = $1, password_reset_expires_at = $2, updated_at = NOW()
       WHERE id = $3`,
      [resetToken, expiresAt, user.id]
    );

    const frontendUrl = process.env.FRONTEND_URL || 'https://ridetogether.ru';
    const resetUrl = `${frontendUrl}/auth?reset_token=${resetToken}`;

    try {
      await emailService.send({
        to: user.email,
        subject: 'Сброс пароля — Ride Together',
        html: `
          <p>Вы запросили сброс пароля.</p>
          <p><a href="${resetUrl}">Нажмите здесь, чтобы задать новый пароль</a></p>
          <p>Ссылка действительна 1 час. Если вы не запрашивали сброс — проигнорируйте это письмо.</p>
        `,
      });
    } catch {
      // Email не настроен — токен всё равно сохранён в БД
    }

    res.status(200).json({ message: 'Если аккаунт существует, письмо отправлено' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Ошибка при запросе сброса пароля' });
  }
}
