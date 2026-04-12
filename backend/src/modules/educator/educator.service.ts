import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import {
  Course,
  CourseSection,
  SectionContent,
  ClassRoom,
  ClassEnrollment,
  ClassDeadline,
  ClassAnalytics,
} from './interfaces/educator.interfaces';
import {
  CreateCourseDto,
  AddSectionDto,
  AddContentDto,
  CreateClassDto,
  AssignDeadlineDto,
} from './dto/educator.dto';

@Injectable()
export class EducatorService {
  private readonly logger = new Logger(EducatorService.name);

  constructor(private readonly db: DatabaseService) {}

  // ============================================
  // Migration / Table Setup
  // ============================================

  async ensureTables(): Promise<void> {
    try {
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS courses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          educator_id UUID NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT DEFAULT '',
          subject VARCHAR(255) NOT NULL,
          level VARCHAR(100) NOT NULL,
          is_published BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_courses_educator_id ON courses(educator_id)
      `);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS course_sections (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          order_index INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_course_sections_course_id ON course_sections(course_id)
      `);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS section_content (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          section_id UUID NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
          content_type VARCHAR(50) NOT NULL,
          content_id UUID NOT NULL,
          order_index INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_section_content_section_id ON section_content(section_id)
      `);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS classes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
          educator_id UUID NOT NULL,
          name VARCHAR(255) NOT NULL,
          enrollment_code VARCHAR(20) NOT NULL UNIQUE,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_classes_educator_id ON classes(educator_id)
      `);
      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_classes_enrollment_code ON classes(enrollment_code)
      `);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS class_enrollments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
          student_id UUID NOT NULL,
          enrolled_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(class_id, student_id)
        )
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_class_enrollments_class_id ON class_enrollments(class_id)
      `);
      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_class_enrollments_student_id ON class_enrollments(student_id)
      `);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS class_deadlines (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
          content_id UUID NOT NULL REFERENCES section_content(id) ON DELETE CASCADE,
          due_date TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_class_deadlines_class_id ON class_deadlines(class_id)
      `);

      this.logger.log('Educator tables ensured');
    } catch (error) {
      this.logger.warn(`Failed to ensure educator tables: ${(error as Error).message}`);
    }
  }

  // ============================================
  // Courses
  // ============================================

  async createCourse(educatorId: string, dto: CreateCourseDto): Promise<Course> {
    if (!dto.title || !dto.subject || !dto.level) {
      throw new BadRequestException('Course must have a title, subject, and level');
    }

    const id = uuidv4();
    const result = await this.db.queryOne<Course>(
      `INSERT INTO courses (id, educator_id, title, description, subject, level, is_published, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, educatorId, dto.title, dto.description || '', dto.subject, dto.level, false, new Date()],
    );

    return this.mapCourse(result!);
  }

  async listCourses(educatorId: string): Promise<Course[]> {
    const rows = await this.db.queryMany<Course>(
      'SELECT * FROM courses WHERE educator_id = $1 ORDER BY created_at DESC',
      [educatorId],
    );
    return rows.map((r) => this.mapCourse(r));
  }

  async getCourseById(educatorId: string, courseId: string): Promise<Course> {
    const row = await this.db.queryOne<Course>(
      'SELECT * FROM courses WHERE id = $1',
      [courseId],
    );
    if (!row) {
      throw new NotFoundException('Course not found');
    }
    const course = this.mapCourse(row);
    if (course.educator_id !== educatorId) {
      throw new ForbiddenException('You do not own this course');
    }
    return course;
  }

  // ============================================
  // Sections
  // ============================================

  async addSection(educatorId: string, courseId: string, dto: AddSectionDto): Promise<CourseSection> {
    // Verify ownership
    await this.getCourseById(educatorId, courseId);

    if (!dto.title) {
      throw new BadRequestException('Section must have a title');
    }

    // Get next order index if not provided
    let orderIndex = dto.orderIndex;
    if (orderIndex === undefined || orderIndex === null) {
      const maxResult = await this.db.queryOne<{ max_order: string }>(
        'SELECT COALESCE(MAX(order_index), -1) as max_order FROM course_sections WHERE course_id = $1',
        [courseId],
      );
      orderIndex = parseInt(maxResult?.max_order || '-1', 10) + 1;
    }

    const id = uuidv4();
    const result = await this.db.queryOne<CourseSection>(
      `INSERT INTO course_sections (id, course_id, title, order_index, created_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, courseId, dto.title, orderIndex, new Date()],
    );

    return this.mapSection(result!);
  }

  // ============================================
  // Content
  // ============================================

  async addContent(
    educatorId: string,
    sectionId: string,
    dto: AddContentDto,
  ): Promise<SectionContent> {
    // Verify section exists and educator owns the course
    const section = await this.db.queryOne<{ course_id: string }>(
      'SELECT * FROM course_sections WHERE id = $1',
      [sectionId],
    );
    if (!section) {
      throw new NotFoundException('Section not found');
    }
    await this.getCourseById(educatorId, section.course_id);

    if (!dto.contentType || !dto.contentId) {
      throw new BadRequestException('Content must have a contentType and contentId');
    }

    const validTypes = ['study_set', 'quiz', 'exam'];
    if (!validTypes.includes(dto.contentType)) {
      throw new BadRequestException('contentType must be study_set, quiz, or exam');
    }

    let orderIndex = dto.orderIndex;
    if (orderIndex === undefined || orderIndex === null) {
      const maxResult = await this.db.queryOne<{ max_order: string }>(
        'SELECT COALESCE(MAX(order_index), -1) as max_order FROM section_content WHERE section_id = $1',
        [sectionId],
      );
      orderIndex = parseInt(maxResult?.max_order || '-1', 10) + 1;
    }

    const id = uuidv4();
    const result = await this.db.queryOne<SectionContent>(
      `INSERT INTO section_content (id, section_id, content_type, content_id, order_index, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, sectionId, dto.contentType, dto.contentId, orderIndex, new Date()],
    );

    return this.mapContent(result!);
  }

  // ============================================
  // Classes
  // ============================================

  async createClass(
    educatorId: string,
    courseId: string,
    dto: CreateClassDto,
  ): Promise<ClassRoom> {
    await this.getCourseById(educatorId, courseId);

    if (!dto.name) {
      throw new BadRequestException('Class must have a name');
    }

    const enrollmentCode = this.generateEnrollmentCode();
    const id = uuidv4();

    const result = await this.db.queryOne<ClassRoom>(
      `INSERT INTO classes (id, course_id, educator_id, name, enrollment_code, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, courseId, educatorId, dto.name, enrollmentCode, true, new Date()],
    );

    return this.mapClass(result!);
  }

  async enrollStudent(studentId: string, enrollmentCode: string): Promise<ClassEnrollment> {
    const classRoom = await this.db.queryOne<{ id: string; is_active: boolean }>(
      'SELECT * FROM classes WHERE enrollment_code = $1 AND is_active = true',
      [enrollmentCode],
    );

    if (!classRoom) {
      throw new NotFoundException('Class not found or is no longer active');
    }

    // Check if already enrolled
    const existing = await this.db.queryOne<{ id: string }>(
      'SELECT * FROM class_enrollments WHERE class_id = $1 AND student_id = $2',
      [classRoom.id, studentId],
    );

    if (existing) {
      throw new ConflictException('You are already enrolled in this class');
    }

    const id = uuidv4();
    const result = await this.db.queryOne<ClassEnrollment>(
      `INSERT INTO class_enrollments (id, class_id, student_id, enrolled_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, classRoom.id, studentId, new Date()],
    );

    return this.mapEnrollment(result!);
  }

  async getClassRoster(
    classId: string,
    educatorId: string,
  ): Promise<Array<{ studentId: string; studentName: string; enrolledAt: Date }>> {
    // Verify educator owns this class
    const classRoom = await this.db.queryOne<{ id: string; educator_id: string }>(
      'SELECT * FROM classes WHERE id = $1',
      [classId],
    );
    if (!classRoom) {
      throw new NotFoundException('Class not found');
    }
    if (classRoom.educator_id !== educatorId) {
      throw new ForbiddenException('You do not own this class');
    }

    const rows = await this.db.queryMany<{
      student_id: string;
      name: string;
      enrolled_at: string;
    }>(
      `SELECT ce.student_id, u.name, ce.enrolled_at
       FROM class_enrollments ce
       JOIN users u ON u.id = ce.student_id
       WHERE ce.class_id = $1
       ORDER BY ce.enrolled_at ASC`,
      [classId],
    );

    return rows.map((r) => ({
      studentId: r.student_id,
      studentName: r.name,
      enrolledAt: new Date(r.enrolled_at),
    }));
  }

  // ============================================
  // Analytics
  // ============================================

  async getClassAnalytics(classId: string, educatorId: string): Promise<ClassAnalytics> {
    // Verify educator owns this class
    const classRoom = await this.db.queryOne<{ id: string; educator_id: string; course_id: string }>(
      'SELECT * FROM classes WHERE id = $1',
      [classId],
    );
    if (!classRoom) {
      throw new NotFoundException('Class not found');
    }
    if (classRoom.educator_id !== educatorId) {
      throw new ForbiddenException('You do not own this class');
    }

    const courseId = classRoom.course_id;

    // Total students
    const totalResult = await this.db.queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM class_enrollments WHERE class_id = $1',
      [classId],
    );
    const totalStudents = parseInt(totalResult?.count || '0', 10);

    // Average quiz scores per section
    const scoreRows = await this.db.queryMany<{
      section_id: string;
      section_title: string;
      avg_score: string;
    }>(
      `SELECT cs.id as section_id, cs.title as section_title,
              COALESCE(AVG(qa.score), 0) as avg_score
       FROM course_sections cs
       LEFT JOIN section_content sc ON sc.section_id = cs.id
       LEFT JOIN quiz_attempts qa ON qa.quiz_id::text = sc.content_id::text
         AND qa.user_id IN (SELECT student_id FROM class_enrollments WHERE class_id = $1)
       WHERE cs.course_id = $2
       GROUP BY cs.id, cs.title
       ORDER BY cs.order_index ASC`,
      [classId, courseId],
    );

    const averageScoresBySection = scoreRows.map((r) => ({
      sectionId: r.section_id,
      sectionTitle: r.section_title,
      averageScore: parseFloat(r.avg_score) || 0,
    }));

    // Completion rates per section
    const completionRows = await this.db.queryMany<{
      section_id: string;
      section_title: string;
      total_content: string;
      completed_content: string;
    }>(
      `SELECT cs.id as section_id, cs.title as section_title,
              COUNT(DISTINCT sc.id) as total_content,
              COUNT(DISTINCT CASE WHEN qa.id IS NOT NULL THEN sc.id END) as completed_content
       FROM course_sections cs
       LEFT JOIN section_content sc ON sc.section_id = cs.id
       LEFT JOIN quiz_attempts qa ON qa.quiz_id::text = sc.content_id::text
         AND qa.user_id IN (SELECT student_id FROM class_enrollments WHERE class_id = $1)
       WHERE cs.course_id = $2
       GROUP BY cs.id, cs.title, cs.order_index
       ORDER BY cs.order_index ASC`,
      [classId, courseId],
    );

    const completionRates = completionRows.map((r) => {
      const total = parseInt(r.total_content, 10);
      const completed = parseInt(r.completed_content, 10);
      return {
        sectionId: r.section_id,
        sectionTitle: r.section_title,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });

    // At-risk students (average score below 60%)
    const atRiskRows = await this.db.queryMany<{
      student_id: string;
      name: string;
      avg_score: string;
    }>(
      `SELECT ce.student_id, u.name, COALESCE(AVG(qa.score), 0) as avg_score
       FROM class_enrollments ce
       JOIN users u ON u.id = ce.student_id
       LEFT JOIN quiz_attempts qa ON qa.user_id = ce.student_id
         AND qa.quiz_id::text IN (
           SELECT sc.content_id::text FROM section_content sc
           JOIN course_sections cs ON cs.id = sc.section_id
           WHERE cs.course_id = $2
         )
       WHERE ce.class_id = $1
       GROUP BY ce.student_id, u.name
       HAVING COALESCE(AVG(qa.score), 0) < 60
       ORDER BY avg_score ASC`,
      [classId, courseId],
    );

    const atRiskStudents = atRiskRows.map((r) => ({
      studentId: r.student_id,
      studentName: r.name,
      averageScore: parseFloat(r.avg_score) || 0,
    }));

    return {
      totalStudents,
      averageScoresBySection,
      completionRates,
      atRiskStudents,
    };
  }

  // ============================================
  // Deadlines
  // ============================================

  async assignDeadline(
    educatorId: string,
    classId: string,
    dto: AssignDeadlineDto,
  ): Promise<ClassDeadline> {
    // Verify educator owns this class
    const classRoom = await this.db.queryOne<{ id: string; educator_id: string }>(
      'SELECT * FROM classes WHERE id = $1',
      [classId],
    );
    if (!classRoom) {
      throw new NotFoundException('Class not found');
    }
    if (classRoom.educator_id !== educatorId) {
      throw new ForbiddenException('You do not own this class');
    }

    if (!dto.contentId || !dto.dueDate) {
      throw new BadRequestException('Deadline must have a contentId and dueDate');
    }

    const id = uuidv4();
    const result = await this.db.queryOne<ClassDeadline>(
      `INSERT INTO class_deadlines (id, class_id, content_id, due_date, created_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, classId, dto.contentId, new Date(dto.dueDate), new Date()],
    );

    return this.mapDeadline(result!);
  }

  // ============================================
  // Helpers
  // ============================================

  private generateEnrollmentCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private mapCourse(row: unknown): Course {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      educator_id: r.educator_id as string,
      title: r.title as string,
      description: (r.description as string) || '',
      subject: r.subject as string,
      level: r.level as string,
      is_published: r.is_published as boolean,
      created_at: new Date(r.created_at as string),
    };
  }

  private mapSection(row: unknown): CourseSection {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      course_id: r.course_id as string,
      title: r.title as string,
      order_index: r.order_index as number,
      created_at: new Date(r.created_at as string),
    };
  }

  private mapContent(row: unknown): SectionContent {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      section_id: r.section_id as string,
      content_type: r.content_type as SectionContent['content_type'],
      content_id: r.content_id as string,
      order_index: r.order_index as number,
      created_at: new Date(r.created_at as string),
    };
  }

  private mapClass(row: unknown): ClassRoom {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      course_id: r.course_id as string,
      educator_id: r.educator_id as string,
      name: r.name as string,
      enrollment_code: r.enrollment_code as string,
      is_active: r.is_active as boolean,
      created_at: new Date(r.created_at as string),
    };
  }

  private mapEnrollment(row: unknown): ClassEnrollment {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      class_id: r.class_id as string,
      student_id: r.student_id as string,
      enrolled_at: new Date(r.enrolled_at as string),
    };
  }

  private mapDeadline(row: unknown): ClassDeadline {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      class_id: r.class_id as string,
      content_id: r.content_id as string,
      due_date: new Date(r.due_date as string),
      created_at: new Date(r.created_at as string),
    };
  }
}
