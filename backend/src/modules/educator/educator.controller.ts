import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/decorators/roles.decorator';
import { EducatorService } from './educator.service';
import {
  CreateCourseDto,
  AddSectionDto,
  AddContentDto,
  CreateClassDto,
  EnrollStudentDto,
  AssignDeadlineDto,
} from './dto/educator.dto';

@Controller('courses')
export class EducatorController {
  constructor(private readonly educatorService: EducatorService) {}

  // ============================================
  // Courses
  // ============================================

  @Post()
  @Roles(Role.EDUCATOR, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createCourse(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCourseDto,
  ) {
    return this.educatorService.createCourse(user.sub, dto);
  }

  @Get()
  @Roles(Role.EDUCATOR, Role.ADMIN)
  async listCourses(@CurrentUser() user: JwtPayload) {
    return this.educatorService.listCourses(user.sub);
  }

  // ============================================
  // Sections
  // ============================================

  @Post(':id/sections')
  @Roles(Role.EDUCATOR, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async addSection(
    @CurrentUser() user: JwtPayload,
    @Param('id') courseId: string,
    @Body() dto: AddSectionDto,
  ) {
    return this.educatorService.addSection(user.sub, courseId, dto);
  }

  // ============================================
  // Content
  // ============================================

  @Post('sections/:id/content')
  @Roles(Role.EDUCATOR, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async addContent(
    @CurrentUser() user: JwtPayload,
    @Param('id') sectionId: string,
    @Body() dto: AddContentDto,
  ) {
    return this.educatorService.addContent(user.sub, sectionId, dto);
  }
}

@Controller('classes')
export class ClassController {
  constructor(private readonly educatorService: EducatorService) {}

  // ============================================
  // Classes
  // ============================================

  @Post()
  @Roles(Role.EDUCATOR, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createClass(
    @CurrentUser() user: JwtPayload,
    @Body() body: CreateClassDto & { courseId: string },
  ) {
    return this.educatorService.createClass(user.sub, body.courseId, body);
  }

  @Post('enroll')
  @HttpCode(HttpStatus.CREATED)
  async enrollStudent(
    @CurrentUser() user: JwtPayload,
    @Body() dto: EnrollStudentDto,
  ) {
    return this.educatorService.enrollStudent(user.sub, dto.enrollmentCode);
  }

  @Get(':id/roster')
  @Roles(Role.EDUCATOR, Role.ADMIN)
  async getClassRoster(
    @CurrentUser() user: JwtPayload,
    @Param('id') classId: string,
  ) {
    return this.educatorService.getClassRoster(classId, user.sub);
  }

  @Get(':id/analytics')
  @Roles(Role.EDUCATOR, Role.ADMIN)
  async getClassAnalytics(
    @CurrentUser() user: JwtPayload,
    @Param('id') classId: string,
  ) {
    return this.educatorService.getClassAnalytics(classId, user.sub);
  }

  @Post(':id/deadlines')
  @Roles(Role.EDUCATOR, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async assignDeadline(
    @CurrentUser() user: JwtPayload,
    @Param('id') classId: string,
    @Body() dto: AssignDeadlineDto,
  ) {
    return this.educatorService.assignDeadline(user.sub, classId, dto);
  }
}
