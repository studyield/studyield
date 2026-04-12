import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';

export interface CreateStudyGroupDto {
  name: string;
  description?: string;
  isPrivate?: boolean;
}

export interface ShareStudySetDto {
  studySetId: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  isPrivate: boolean;
  createdBy: string;
  createdAt: Date;
  memberCount?: number;
}

export interface GroupMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: 'admin' | 'member';
  joinedAt: Date;
}

export interface GroupStudySet {
  id: string;
  studySetId: string;
  title: string;
  description: string | null;
  sharedBy: string;
  sharedByName: string;
  sharedAt: Date;
}

export interface GroupActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

@Injectable()
export class StudyGroupsService {
  private readonly logger = new Logger(StudyGroupsService.name);

  constructor(private readonly db: DatabaseService) {}

  private generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async createGroup(userId: string, dto: CreateStudyGroupDto): Promise<StudyGroup> {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new BadRequestException('Group name is required');
    }

    const id = uuidv4();
    let inviteCode = this.generateInviteCode();

    // Ensure invite code is unique
    let existing = await this.db.queryOne('SELECT id FROM study_groups WHERE invite_code = $1', [inviteCode]);
    while (existing) {
      inviteCode = this.generateInviteCode();
      existing = await this.db.queryOne('SELECT id FROM study_groups WHERE invite_code = $1', [inviteCode]);
    }

    return this.db.transaction(async (client) => {
      // Create the group
      await client.query(
        `INSERT INTO study_groups (id, name, description, invite_code, is_private, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, dto.name.trim(), dto.description?.trim() || null, inviteCode, dto.isPrivate ?? false, userId],
      );

      // Add creator as admin
      await client.query(
        `INSERT INTO study_group_members (id, group_id, user_id, role)
         VALUES ($1, $2, $3, 'admin')`,
        [uuidv4(), id, userId],
      );

      // Log activity
      await client.query(
        `INSERT INTO group_activity (id, group_id, user_id, action, metadata)
         VALUES ($1, $2, $3, 'group_created', $4)`,
        [uuidv4(), id, userId, JSON.stringify({ groupName: dto.name.trim() })],
      );

      return {
        id,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        inviteCode,
        isPrivate: dto.isPrivate ?? false,
        createdBy: userId,
        createdAt: new Date(),
        memberCount: 1,
      };
    });
  }

  async joinGroup(userId: string, inviteCode: string): Promise<StudyGroup> {
    const group = await this.db.queryOne<{
      id: string;
      name: string;
      description: string | null;
      invite_code: string;
      is_private: boolean;
      created_by: string;
      created_at: Date;
    }>('SELECT * FROM study_groups WHERE invite_code = $1', [inviteCode]);

    if (!group) {
      throw new NotFoundException('Invalid invite code');
    }

    // Check if already a member
    const existingMember = await this.db.queryOne(
      'SELECT id FROM study_group_members WHERE group_id = $1 AND user_id = $2',
      [group.id, userId],
    );

    if (existingMember) {
      throw new ConflictException('You are already a member of this group');
    }

    await this.db.query(
      `INSERT INTO study_group_members (id, group_id, user_id, role)
       VALUES ($1, $2, $3, 'member')`,
      [uuidv4(), group.id, userId],
    );

    // Log activity
    const user = await this.db.queryOne<{ name: string }>('SELECT name FROM users WHERE id = $1', [userId]);
    await this.db.query(
      `INSERT INTO group_activity (id, group_id, user_id, action, metadata)
       VALUES ($1, $2, $3, 'member_joined', $4)`,
      [uuidv4(), group.id, userId, JSON.stringify({ userName: user?.name || 'Unknown' })],
    );

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      inviteCode: group.invite_code,
      isPrivate: group.is_private,
      createdBy: group.created_by,
      createdAt: group.created_at,
    };
  }

  async leaveGroup(userId: string, groupId: string): Promise<void> {
    const member = await this.db.queryOne<{ role: string }>(
      'SELECT role FROM study_group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId],
    );

    if (!member) {
      throw new NotFoundException('You are not a member of this group');
    }

    // If the user is the last admin, prevent leaving
    if (member.role === 'admin') {
      const adminCount = await this.db.queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM study_group_members WHERE group_id = $1 AND role = 'admin'`,
        [groupId],
      );
      if (parseInt(adminCount?.count || '0', 10) <= 1) {
        const memberCount = await this.db.queryOne<{ count: string }>(
          'SELECT COUNT(*) as count FROM study_group_members WHERE group_id = $1',
          [groupId],
        );
        if (parseInt(memberCount?.count || '0', 10) > 1) {
          throw new ForbiddenException(
            'You are the last admin. Promote another member before leaving.',
          );
        }
      }
    }

    await this.db.query(
      'DELETE FROM study_group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId],
    );

    // If no members left, delete the group
    const remaining = await this.db.queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM study_group_members WHERE group_id = $1',
      [groupId],
    );
    if (parseInt(remaining?.count || '0', 10) === 0) {
      await this.db.query('DELETE FROM study_groups WHERE id = $1', [groupId]);
    }
  }

  async listGroups(userId: string): Promise<StudyGroup[]> {
    const rows = await this.db.queryMany<{
      id: string;
      name: string;
      description: string | null;
      invite_code: string;
      is_private: boolean;
      created_by: string;
      created_at: Date;
      member_count: string;
    }>(
      `SELECT sg.*, COUNT(sgm.id) as member_count
       FROM study_groups sg
       JOIN study_group_members sgm ON sg.id = sgm.group_id
       WHERE sg.id IN (SELECT group_id FROM study_group_members WHERE user_id = $1)
       GROUP BY sg.id
       ORDER BY sg.created_at DESC`,
      [userId],
    );

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      inviteCode: r.invite_code,
      isPrivate: r.is_private,
      createdBy: r.created_by,
      createdAt: r.created_at,
      memberCount: parseInt(r.member_count, 10),
    }));
  }

  async getGroupDetails(userId: string, groupId: string): Promise<StudyGroup> {
    // Verify membership
    await this.verifyMembership(userId, groupId);

    const row = await this.db.queryOne<{
      id: string;
      name: string;
      description: string | null;
      invite_code: string;
      is_private: boolean;
      created_by: string;
      created_at: Date;
      member_count: string;
    }>(
      `SELECT sg.*, COUNT(sgm.id) as member_count
       FROM study_groups sg
       JOIN study_group_members sgm ON sg.id = sgm.group_id
       WHERE sg.id = $1
       GROUP BY sg.id`,
      [groupId],
    );

    if (!row) {
      throw new NotFoundException('Group not found');
    }

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      inviteCode: row.invite_code,
      isPrivate: row.is_private,
      createdBy: row.created_by,
      createdAt: row.created_at,
      memberCount: parseInt(row.member_count, 10),
    };
  }

  async getGroupMembers(userId: string, groupId: string): Promise<GroupMember[]> {
    await this.verifyMembership(userId, groupId);

    return this.db.queryMany<GroupMember>(
      `SELECT sgm.id, sgm.user_id as "userId", u.name, u.email,
              u.avatar_url as "avatarUrl", sgm.role, sgm.joined_at as "joinedAt"
       FROM study_group_members sgm
       JOIN users u ON sgm.user_id = u.id
       WHERE sgm.group_id = $1
       ORDER BY sgm.role ASC, sgm.joined_at ASC`,
      [groupId],
    );
  }

  async shareStudySet(userId: string, groupId: string, dto: ShareStudySetDto): Promise<void> {
    await this.verifyMembership(userId, groupId);

    // Check if already shared
    const existing = await this.db.queryOne(
      'SELECT id FROM group_study_sets WHERE group_id = $1 AND study_set_id = $2',
      [groupId, dto.studySetId],
    );

    if (existing) {
      throw new ConflictException('This study set is already shared with the group');
    }

    await this.db.query(
      `INSERT INTO group_study_sets (id, group_id, study_set_id, shared_by)
       VALUES ($1, $2, $3, $4)`,
      [uuidv4(), groupId, dto.studySetId, userId],
    );

    // Log activity
    const user = await this.db.queryOne<{ name: string }>('SELECT name FROM users WHERE id = $1', [userId]);
    await this.db.query(
      `INSERT INTO group_activity (id, group_id, user_id, action, metadata)
       VALUES ($1, $2, $3, 'study_set_shared', $4)`,
      [uuidv4(), groupId, userId, JSON.stringify({ studySetId: dto.studySetId, userName: user?.name || 'Unknown' })],
    );
  }

  async getGroupStudySets(userId: string, groupId: string): Promise<GroupStudySet[]> {
    await this.verifyMembership(userId, groupId);

    return this.db.queryMany<GroupStudySet>(
      `SELECT gss.id, gss.study_set_id as "studySetId",
              COALESCE(ss.title, 'Untitled') as title,
              ss.description,
              gss.shared_by as "sharedBy",
              u.name as "sharedByName",
              gss.shared_at as "sharedAt"
       FROM group_study_sets gss
       LEFT JOIN study_sets ss ON gss.study_set_id = ss.id
       JOIN users u ON gss.shared_by = u.id
       WHERE gss.group_id = $1
       ORDER BY gss.shared_at DESC`,
      [groupId],
    );
  }

  async getGroupActivity(userId: string, groupId: string): Promise<GroupActivity[]> {
    await this.verifyMembership(userId, groupId);

    return this.db.queryMany<GroupActivity>(
      `SELECT ga.id, ga.user_id as "userId", u.name as "userName",
              ga.action, ga.metadata, ga.created_at as "createdAt"
       FROM group_activity ga
       JOIN users u ON ga.user_id = u.id
       WHERE ga.group_id = $1
       ORDER BY ga.created_at DESC
       LIMIT 50`,
      [groupId],
    );
  }

  private async verifyMembership(userId: string, groupId: string): Promise<void> {
    const member = await this.db.queryOne(
      'SELECT id FROM study_group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId],
    );

    if (!member) {
      throw new ForbiddenException('You are not a member of this group');
    }
  }
}
