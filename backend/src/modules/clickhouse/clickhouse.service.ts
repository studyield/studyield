import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClickHouse } from 'clickhouse';

export interface AnalyticsEvent {
  eventType: string;
  userId: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
  timestamp?: Date;
}

@Injectable()
export class ClickhouseService implements OnModuleInit {
  private readonly logger = new Logger(ClickhouseService.name);
  private client: ClickHouse;
  private database: string;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>('CLICKHOUSE_HOST', 'localhost');
    const port = this.configService.get<number>('CLICKHOUSE_PORT', 8123);
    const user = this.configService.get<string>('CLICKHOUSE_USER', 'default');
    const password = this.configService.get<string>('CLICKHOUSE_PASSWORD', '');
    this.database = this.configService.get<string>('CLICKHOUSE_DATABASE', 'studyield');

    this.client = new ClickHouse({
      url: `http://${host}`,
      port,
      basicAuth: password ? { username: user, password } : undefined,
      format: 'json',
      config: {
        database: this.database,
      },
    });

    try {
      await this.query('SELECT 1');
      this.logger.log('ClickHouse connection established');
    } catch (error) {
      this.logger.warn('ClickHouse connection failed - analytics disabled', error);
    }
  }

  async query<T = unknown>(sql: string): Promise<T[]> {
    try {
      const result = await this.client.query(sql).toPromise();
      return result as T[];
    } catch (error) {
      this.logger.error(`ClickHouse query failed: ${sql}`, error);
      throw error;
    }
  }

  async insert(table: string, data: Record<string, unknown>[]): Promise<void> {
    if (data.length === 0) return;

    try {
      await this.client.insert(`INSERT INTO ${table}`, data).toPromise();
      this.logger.debug(`Inserted ${data.length} rows into ${table}`);
    } catch (error) {
      this.logger.error(`ClickHouse insert failed for ${table}`, error);
      throw error;
    }
  }

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      await this.insert('events', [
        {
          event_type: event.eventType,
          user_id: event.userId,
          session_id: event.sessionId || '',
          metadata: JSON.stringify(event.metadata || {}),
          timestamp: event.timestamp || new Date(),
        },
      ]);
    } catch (error) {
      this.logger.warn('Failed to track event', error);
    }
  }

  async trackEvents(events: AnalyticsEvent[]): Promise<void> {
    try {
      await this.insert(
        'events',
        events.map((e) => ({
          event_type: e.eventType,
          user_id: e.userId,
          session_id: e.sessionId || '',
          metadata: JSON.stringify(e.metadata || {}),
          timestamp: e.timestamp || new Date(),
        })),
      );
    } catch (error) {
      this.logger.warn('Failed to track events', error);
    }
  }

  async getEventCount(
    eventType: string,
    userId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    let query = `SELECT count() as count FROM events WHERE event_type = '${eventType}'`;
    if (userId) {
      query += ` AND user_id = '${userId}'`;
    }
    if (startDate) {
      query += ` AND timestamp >= '${startDate.toISOString()}'`;
    }
    if (endDate) {
      query += ` AND timestamp <= '${endDate.toISOString()}'`;
    }

    const result = await this.query<{ count: string }>(query);
    return parseInt(result[0]?.count || '0', 10);
  }

  async getUserActivity(
    userId: string,
    days = 30,
  ): Promise<Array<{ date: string; count: number }>> {
    const query = `
      SELECT
        toDate(timestamp) as date,
        count() as count
      FROM events
      WHERE user_id = '${userId}'
        AND timestamp >= today() - ${days}
      GROUP BY date
      ORDER BY date
    `;

    const result = await this.query<{ date: string; count: string }>(query);
    return result.map((r) => ({
      date: r.date,
      count: parseInt(r.count, 10),
    }));
  }

  async getTopEvents(limit = 10, days = 7): Promise<Array<{ eventType: string; count: number }>> {
    const query = `
      SELECT
        event_type,
        count() as count
      FROM events
      WHERE timestamp >= today() - ${days}
      GROUP BY event_type
      ORDER BY count DESC
      LIMIT ${limit}
    `;

    const result = await this.query<{ event_type: string; count: string }>(query);
    return result.map((r) => ({
      eventType: r.event_type,
      count: parseInt(r.count, 10),
    }));
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
