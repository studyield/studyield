import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import { RegisterPlatformDto } from './dto';

export interface LtiPlatform {
  id: string;
  name: string;
  platformUrl: string;
  clientId: string;
  authEndpoint: string;
  tokenEndpoint: string;
  jwksUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LtiContext {
  id: string;
  userId: string;
  platformId: string;
  ltiUserId: string;
  courseId: string | null;
  resourceLinkId: string | null;
  roles: string[];
  lastLaunchAt: Date;
  createdAt: Date;
}

@Injectable()
export class LtiConfigService {
  private readonly logger = new Logger(LtiConfigService.name);

  constructor(private readonly db: DatabaseService) {}

  async registerPlatform(dto: RegisterPlatformDto): Promise<LtiPlatform> {
    // Check for duplicate client_id on the same platform URL
    const existing = await this.db.queryOne(
      'SELECT id FROM lti_platforms WHERE client_id = $1 AND platform_url = $2',
      [dto.clientId, dto.platformUrl],
    );
    if (existing) {
      throw new ConflictException(
        'A platform with this client_id and URL is already registered',
      );
    }

    const id = uuidv4();
    const now = new Date();

    const row = await this.db.queryOne(
      `INSERT INTO lti_platforms (id, name, platform_url, client_id, auth_endpoint, token_endpoint, jwks_url, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        id,
        dto.name,
        dto.platformUrl,
        dto.clientId,
        dto.authEndpoint,
        dto.tokenEndpoint,
        dto.jwksUrl,
        now,
        now,
      ],
    );

    this.logger.log(`LTI platform registered: ${dto.name} (${id})`);
    return this.mapPlatform(row!);
  }

  async listPlatforms(): Promise<LtiPlatform[]> {
    const rows = await this.db.queryMany(
      'SELECT * FROM lti_platforms ORDER BY created_at DESC',
    );
    return rows.map((r) => this.mapPlatform(r));
  }

  async findPlatformById(id: string): Promise<LtiPlatform | null> {
    const row = await this.db.queryOne(
      'SELECT * FROM lti_platforms WHERE id = $1',
      [id],
    );
    return row ? this.mapPlatform(row) : null;
  }

  async findPlatformByClientId(clientId: string): Promise<LtiPlatform | null> {
    const row = await this.db.queryOne(
      'SELECT * FROM lti_platforms WHERE client_id = $1',
      [clientId],
    );
    return row ? this.mapPlatform(row) : null;
  }

  async deletePlatform(id: string): Promise<void> {
    const result = await this.db.query(
      'DELETE FROM lti_platforms WHERE id = $1',
      [id],
    );
    if (result.rowCount === 0) {
      throw new NotFoundException('Platform not found');
    }
    this.logger.log(`LTI platform deleted: ${id}`);
  }

  /**
   * Upsert an LTI context record that links an LTI user to a Studyield user.
   */
  async upsertContext(params: {
    userId: string;
    platformId: string;
    ltiUserId: string;
    courseId: string | null;
    resourceLinkId: string | null;
    roles: string[];
  }): Promise<LtiContext> {
    const id = uuidv4();
    const now = new Date();

    const row = await this.db.queryOne(
      `INSERT INTO lti_contexts (id, user_id, platform_id, lti_user_id, course_id, resource_link_id, roles, last_launch_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id, platform_id)
       DO UPDATE SET
         lti_user_id = EXCLUDED.lti_user_id,
         course_id = EXCLUDED.course_id,
         resource_link_id = EXCLUDED.resource_link_id,
         roles = EXCLUDED.roles,
         last_launch_at = EXCLUDED.last_launch_at
       RETURNING *`,
      [
        id,
        params.userId,
        params.platformId,
        params.ltiUserId,
        params.courseId,
        params.resourceLinkId,
        JSON.stringify(params.roles),
        now,
        now,
      ],
    );

    return this.mapContext(row!);
  }

  async findContextByUser(userId: string): Promise<LtiContext | null> {
    const row = await this.db.queryOne(
      'SELECT * FROM lti_contexts WHERE user_id = $1 ORDER BY last_launch_at DESC LIMIT 1',
      [userId],
    );
    return row ? this.mapContext(row) : null;
  }

  async findContextByUserAndPlatform(
    userId: string,
    platformId: string,
  ): Promise<LtiContext | null> {
    const row = await this.db.queryOne(
      'SELECT * FROM lti_contexts WHERE user_id = $1 AND platform_id = $2',
      [userId, platformId],
    );
    return row ? this.mapContext(row) : null;
  }

  private mapPlatform(row: unknown): LtiPlatform {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      name: r.name as string,
      platformUrl: r.platform_url as string,
      clientId: r.client_id as string,
      authEndpoint: r.auth_endpoint as string,
      tokenEndpoint: r.token_endpoint as string,
      jwksUrl: r.jwks_url as string,
      createdAt: new Date(r.created_at as string),
      updatedAt: new Date(r.updated_at as string),
    };
  }

  private mapContext(row: unknown): LtiContext {
    const r = row as Record<string, unknown>;
    let roles: string[] = [];
    if (r.roles) {
      if (typeof r.roles === 'string') {
        try {
          roles = JSON.parse(r.roles);
        } catch {
          roles = [];
        }
      } else if (Array.isArray(r.roles)) {
        roles = r.roles as string[];
      }
    }

    return {
      id: r.id as string,
      userId: r.user_id as string,
      platformId: r.platform_id as string,
      ltiUserId: r.lti_user_id as string,
      courseId: r.course_id as string | null,
      resourceLinkId: r.resource_link_id as string | null,
      roles,
      lastLaunchAt: new Date(r.last_launch_at as string),
      createdAt: new Date(r.created_at as string),
    };
  }
}
