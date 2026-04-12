import { ContentType } from '../interfaces/educator.interfaces';

export class CreateCourseDto {
  title!: string;
  description!: string;
  subject!: string;
  level!: string;
}

export class AddSectionDto {
  title!: string;
  orderIndex?: number;
}

export class AddContentDto {
  contentType!: ContentType;
  contentId!: string;
  orderIndex?: number;
}

export class CreateClassDto {
  name!: string;
}

export class EnrollStudentDto {
  enrollmentCode!: string;
}

export class AssignDeadlineDto {
  contentId!: string;
  dueDate!: string;
}
