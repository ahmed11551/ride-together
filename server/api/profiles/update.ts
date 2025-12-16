/**
 * API endpoint для обновления профиля
 * PUT /api/profiles/me
 */

import { db } from '../../utils/database';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt';

export async function updateProfile(req: Request): Promise<Response> {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      return new Response(
        JSON.stringify({ error: 'Не авторизован' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const updates: any = {};

    // Разрешенные поля для обновления
    const allowedFields = ['full_name', 'phone', 'bio', 'avatar_url'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return new Response(
        JSON.stringify({ error: 'Нет полей для обновления' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Если обновляется full_name, обновляем и display_name
    if (updates.full_name) {
      updates.display_name = updates.full_name;
    }

    updates.updated_at = new Date();

    // Проверяем, существует ли профиль
    const existingProfile = await db.query(
      'SELECT id FROM profiles WHERE user_id = $1',
      [payload.userId]
    );

    if (existingProfile.rows.length === 0) {
      // Создаем профиль, если не существует
      const defaultName = updates.full_name || payload.email?.split('@')[0] || 'Пользователь';
      const result = await db.query(
        `INSERT INTO profiles (id, user_id, full_name, display_name, phone, bio, avatar_url, rating, passenger_rating, trips_count, is_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET
           full_name = EXCLUDED.full_name,
           display_name = EXCLUDED.display_name,
           phone = EXCLUDED.phone,
           bio = EXCLUDED.bio,
           avatar_url = EXCLUDED.avatar_url,
           updated_at = NOW()
         RETURNING *`,
        [
          payload.userId,
          payload.userId,
          updates.full_name || defaultName,
          updates.display_name || defaultName,
          updates.phone || null,
          updates.bio || null,
          updates.avatar_url || null,
          5.0,
          5.0,
          0,
          false,
        ]
      );

      const profile = result.rows[0];
      return new Response(
        JSON.stringify({
          id: profile.id,
          user_id: profile.user_id,
          full_name: profile.full_name,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          rating: parseFloat(profile.rating),
          passenger_rating: profile.passenger_rating ? parseFloat(profile.passenger_rating) : undefined,
          trips_count: profile.trips_count || 0,
          is_verified: profile.is_verified || false,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Обновляем существующий профиль
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const result = await db.query(
      `UPDATE profiles SET ${setClause} WHERE user_id = $1 RETURNING *`,
      [payload.userId, ...Object.values(updates)]
    );

    const profile = result.rows[0];

    return new Response(
      JSON.stringify({
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        rating: parseFloat(profile.rating),
        passenger_rating: profile.passenger_rating ? parseFloat(profile.passenger_rating) : undefined,
        trips_count: profile.trips_count || 0,
        is_verified: profile.is_verified || false,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Update profile error:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка при обновлении профиля' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
