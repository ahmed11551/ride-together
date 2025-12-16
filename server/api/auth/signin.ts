/**
 * API endpoint для входа пользователя
 * Замена Supabase Auth.signInWithPassword()
 */

import { compare } from 'bcrypt';
import { generateToken, generateRefreshToken } from '../utils/jwt';
import { db } from '../utils/database';

export async function signIn(req: Request): Promise<Response> {
  try {
    const { email, password } = await req.json();

    // Валидация
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email и password обязательны' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Поиск пользователя
    const userResult = await db.query(
      'SELECT id, email, password_hash, email_verified FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Неверный email или password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user = userResult.rows[0];

    // Проверка пароля
    const passwordMatch = await compare(password, user.password_hash);

    if (!passwordMatch) {
      return new Response(
        JSON.stringify({ error: 'Неверный email или password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Генерация токенов
    const token = generateToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    // Создание сессии
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 часа

    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30); // 30 дней

    await db.query(
      `INSERT INTO sessions (user_id, token, refresh_token, expires_at, refresh_expires_at, ip_address, user_agent, last_used_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (token) DO UPDATE SET last_used_at = NOW()`,
      [
        user.id,
        token,
        refreshToken,
        expiresAt,
        refreshExpiresAt,
        req.headers.get('x-forwarded-for') || 'unknown',
        req.headers.get('user-agent') || 'unknown'
      ]
    );

    // Получаем профиль для user_metadata
    const profileResult = await db.query(
      'SELECT full_name FROM profiles WHERE user_id = $1',
      [user.id]
    );

    const profile = profileResult.rows[0];

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          user_metadata: {
            full_name: profile?.full_name || null,
          },
          email_verified: user.email_verified,
        },
        token,
        refresh_token: refreshToken,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Signin error:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка при входе' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
