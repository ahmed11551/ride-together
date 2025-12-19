/**
 * API endpoint для выхода пользователя
 * Замена Supabase Auth.signOut()
 */

import { Request, Response } from 'express';
import { extractTokenFromHeader } from '../../utils/jwt.js';
import { db } from '../../utils/database.js';

export async function signOut(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({ error: 'Токен не предоставлен' });
      return;
    }

    // Удаление сессии
    await db.query(
      'DELETE FROM sessions WHERE token = $1',
      [token]
    );

    res.status(200).json({ message: 'Выход выполнен успешно' });
  } catch (error: any) {
    console.error('Signout error:', error);
    res.status(500).json({ error: 'Ошибка при выходе' });
  }
}
