import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';

export interface User {
  id: string;
  email: string;
  password: string | null;
  name: string;
  avatarUrl: string | null;
  role: string;
  googleId: string | null;
  appleId: string | null;
  emailVerified: boolean;
  educationLevel: string | null;
  subjects: string[];
  profileCompleted: boolean;
  preferences: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

export interface CreateUserDto {
  email: string;
  password?: string;
  name: string;
  googleId?: string;
  appleId?: string;
  avatarUrl?: string;
  emailVerified?: boolean;
}

export interface UpdateUserDto {
  name?: string;
  avatarUrl?: string;
  educationLevel?: string;
  subjects?: string[];
  profileCompleted?: boolean;
  preferences?: Record<string, unknown>;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreateUserDto): Promise<User> {
    const id = uuidv4();
    const now = new Date();

    const result = await this.db.queryOne<User>(
      `INSERT INTO users (id, email, password, name, avatar_url, google_id, apple_id, email_verified, preferences, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        id,
        dto.email.toLowerCase(),
        dto.password || null,
        dto.name,
        dto.avatarUrl || null,
        dto.googleId || null,
        dto.appleId || null,
        dto.emailVerified || false,
        JSON.stringify({}),
        now,
        now,
      ],
    );

    this.logger.log(`User created: ${result!.id}`);
    return this.mapUser(result!);
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.db.queryOne<User>('SELECT * FROM users WHERE id = $1', [id]);
    return result ? this.mapUser(result) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db.queryOne<User>('SELECT * FROM users WHERE email = $1', [
      email.toLowerCase(),
    ]);
    return result ? this.mapUser(result) : null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const result = await this.db.queryOne<User>('SELECT * FROM users WHERE google_id = $1', [
      googleId,
    ]);
    return result ? this.mapUser(result) : null;
  }

  async findByAppleId(appleId: string): Promise<User | null> {
    const result = await this.db.queryOne<User>('SELECT * FROM users WHERE apple_id = $1', [
      appleId,
    ]);
    return result ? this.mapUser(result) : null;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (dto.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(dto.name);
    }
    if (dto.avatarUrl !== undefined) {
      updates.push(`avatar_url = $${paramIndex++}`);
      values.push(dto.avatarUrl);
    }
    if (dto.educationLevel !== undefined) {
      updates.push(`education_level = $${paramIndex++}`);
      values.push(dto.educationLevel);
    }
    if (dto.subjects !== undefined) {
      updates.push(`subjects = $${paramIndex++}`);
      values.push(JSON.stringify(dto.subjects));
    }
    if (dto.profileCompleted !== undefined) {
      updates.push(`profile_completed = $${paramIndex++}`);
      values.push(dto.profileCompleted);
    }
    if (dto.preferences !== undefined) {
      updates.push(`preferences = $${paramIndex++}`);
      values.push(JSON.stringify(dto.preferences));
    }

    updates.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());

    values.push(id);

    const result = await this.db.queryOne<User>(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values,
    );

    return this.mapUser(result!);
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.db.query('UPDATE users SET password = $1, updated_at = $2 WHERE id = $3', [
      hashedPassword,
      new Date(),
      id,
    ]);
    this.logger.log(`Password updated for user: ${id}`);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.db.query('UPDATE users SET last_login_at = $1 WHERE id = $2', [new Date(), id]);
  }

  async verifyEmail(id: string): Promise<void> {
    await this.db.query('UPDATE users SET email_verified = true, updated_at = $1 WHERE id = $2', [
      new Date(),
      id,
    ]);
    this.logger.log(`Email verified for user: ${id}`);
  }

  async linkGoogleAccount(id: string, googleId: string): Promise<void> {
    await this.db.query('UPDATE users SET google_id = $1, updated_at = $2 WHERE id = $3', [
      googleId,
      new Date(),
      id,
    ]);
    this.logger.log(`Google account linked for user: ${id}`);
  }

  async linkAppleAccount(id: string, appleId: string): Promise<void> {
    await this.db.query('UPDATE users SET apple_id = $1, updated_at = $2 WHERE id = $3', [
      appleId,
      new Date(),
      id,
    ]);
    this.logger.log(`Apple account linked for user: ${id}`);
  }

  async delete(id: string): Promise<void> {
    const result = await this.db.query('DELETE FROM users WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      throw new NotFoundException('User not found');
    }
    this.logger.log(`User deleted: ${id}`);
  }

  async getStats(id: string): Promise<{
    studySetsCount: number;
    flashcardsCount: number;
    quizzesCompleted: number;
    streakDays: number;
  }> {
    const [studySets, flashcards, quizzes, streak] = await Promise.all([
      this.db.queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM study_sets WHERE user_id = $1',
        [id],
      ),
      this.db.queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM flashcards f JOIN study_sets s ON f.study_set_id = s.id WHERE s.user_id = $1',
        [id],
      ),
      this.db.queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM quiz_attempts WHERE user_id = $1',
        [id],
      ),
      this.calculateStreak(id),
    ]);

    return {
      studySetsCount: parseInt(studySets?.count || '0', 10),
      flashcardsCount: parseInt(flashcards?.count || '0', 10),
      quizzesCompleted: parseInt(quizzes?.count || '0', 10),
      streakDays: streak,
    };
  }

  async getGamification(id: string): Promise<{
    totalXp: number;
    level: number;
    streakDays: number;
    dailyXp: number;
    dailyGoal: number;
    nextLevelXp: number;
    currentLevelXp: number;
  }> {
    const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000];

    const [xpResult, dailyXpResult, streak] = await Promise.all([
      this.db
        .queryOne<{
          total_xp: string;
        }>(`SELECT COALESCE(SUM(xp), 0) as total_xp FROM user_xp_events WHERE user_id = $1`, [id])
        .catch(() => ({ total_xp: '0' })),
      this.db
        .queryOne<{
          daily_xp: string;
        }>(
          `SELECT COALESCE(SUM(xp), 0) as daily_xp FROM user_xp_events WHERE user_id = $1 AND created_at >= CURRENT_DATE`,
          [id],
        )
        .catch(() => ({ daily_xp: '0' })),
      this.calculateStreak(id),
    ]);

    const totalXp = parseInt((xpResult as { total_xp: string })?.total_xp || '0', 10);
    const dailyXp = parseInt((dailyXpResult as { daily_xp: string })?.daily_xp || '0', 10);

    // Compute level
    let level = 0;
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (totalXp >= LEVEL_THRESHOLDS[i]) {
        level = i;
        break;
      }
    }
    const currentLevelXp = LEVEL_THRESHOLDS[level] || 0;
    const nextLevelXp = LEVEL_THRESHOLDS[level + 1] || LEVEL_THRESHOLDS[level] + 2500;

    return {
      totalXp,
      level,
      streakDays: streak,
      dailyXp,
      dailyGoal: 100,
      nextLevelXp,
      currentLevelXp,
    };
  }

  async addXp(id: string, type: string, xp: number): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO user_xp_events (id, user_id, type, xp, created_at) VALUES ($1, $2, $3, $4, $5)`,
        [uuidv4(), id, type, xp, new Date()],
      );
    } catch (error) {
      this.logger.warn(`Failed to record XP event: ${error}`);
    }
  }

  private async calculateStreak(userId: string): Promise<number> {
    try {
      // Get distinct study dates (from flashcard reviews and quiz attempts)
      const result = await this.db.queryMany<{ study_date: string }>(
        `SELECT DISTINCT DATE(last_reviewed_at) as study_date
         FROM flashcards f JOIN study_sets s ON f.study_set_id = s.id
         WHERE s.user_id = $1 AND f.last_reviewed_at IS NOT NULL
         UNION
         SELECT DISTINCT DATE(created_at) as study_date
         FROM quiz_attempts WHERE user_id = $1
         ORDER BY study_date DESC
         LIMIT 365`,
        [userId],
      );

      if (!result || result.length === 0) return 0;

      const dates = result.map((r) => {
        const d = new Date(r.study_date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      });

      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      // Streak must start from today or yesterday
      if (!dates.includes(todayStr) && !dates.includes(yesterdayStr)) return 0;

      let streak = 0;
      const startDate = dates.includes(todayStr) ? today : yesterday;
      const dateSet = new Set(dates);

      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(startDate);
        checkDate.setDate(checkDate.getDate() - i);
        const checkStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        if (dateSet.has(checkStr)) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      this.logger.warn(`Failed to calculate streak: ${error}`);
      return 0;
    }
  }

  private mapUser(row: unknown): User {
    const r = row as Record<string, unknown>;
    let subjects: string[] = [];
    if (r.subjects) {
      if (typeof r.subjects === 'string') {
        try {
          subjects = JSON.parse(r.subjects);
        } catch {
          subjects = [];
        }
      } else if (Array.isArray(r.subjects)) {
        subjects = r.subjects as string[];
      }
    }

    return {
      id: r.id as string,
      email: r.email as string,
      password: r.password as string | null,
      name: r.name as string,
      avatarUrl: r.avatar_url as string | null,
      role: (r.role as string) || 'user',
      googleId: r.google_id as string | null,
      appleId: r.apple_id as string | null,
      emailVerified: r.email_verified as boolean,
      educationLevel: r.education_level as string | null,
      subjects: subjects,
      profileCompleted: (r.profile_completed as boolean) || false,
      preferences:
        typeof r.preferences === 'string'
          ? JSON.parse(r.preferences)
          : (r.preferences as Record<string, unknown>) || {},
      createdAt: new Date(r.created_at as string),
      updatedAt: new Date(r.updated_at as string),
      lastLoginAt: r.last_login_at ? new Date(r.last_login_at as string) : null,
    };
  }
}
