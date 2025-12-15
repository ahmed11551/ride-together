/**
 * API endpoint для регистрации пользователя
 * Замена Supabase Auth.signUp()
 */

import { hash } from 'bcrypt';
import { generateToken, generateRefreshToken } from '../utils/jwt';
import { db } from '../utils/database';
import { createProfile } from '../utils/profile';

export async function signUp(req: Request): Promise<Response> {
  try {
    const { email, password, fullName } = await req.json();

    // Валидация
    if (!email || !password || !fullName) {
      return new Response(
        JSON.stringify({ error: 'Email, password и fullName обязательны' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Проверка существующего пользователя
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Пользователь с таким email уже существует' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Хеширование пароля
    const passwordHash = await hash(password, 10);

    // Создание пользователя
    const userResult = await db.query(
      `INSERT INTO users (email, password_hash, email_verified)
       VALUES ($1, $2, $3)
       RETURNING id, email, email_verified, created_at`,
      [email, passwordHash, false]
    );

    const user = userResult.rows[0];

    // Создание профиля
    await createProfile(user.id, fullName);

    // Генерация токенов
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Создание сессии
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 часа

    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30); // 30 дней

    await db.query(
      `INSERT INTO sessions (user_id, token, refresh_token, expires_at, refresh_expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
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

    // Получаем профиль
    const profileResult = await db.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [user.id]
    );

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          full_name: fullName,
          email_verified: user.email_verified,
        },
        profile: profileResult.rows[0],
        token,
        refresh_token: refreshToken,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка при регистрации' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
