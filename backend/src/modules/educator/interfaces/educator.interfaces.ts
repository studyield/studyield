export interface Course {
  id: string;
  educator_id: string;
  title: string;
  description: string;
  subject: string;
  level: string;
  is_published: boolean;
  created_at: Date;
}

export interface CourseSection {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  created_at: Date;
}

export type ContentType = 'study_set' | 'quiz' | 'exam';

export interface SectionContent {
  id: string;
  section_id: string;
  content_type: ContentType;
  content_id: string;
  order_index: number;
  created_at: Date;
}

export interface ClassRoom {
  id: string;
  course_id: string;
  educator_id: string;
  name: string;
  enrollment_code: string;
  is_active: boolean;
  created_at: Date;
}

export interface ClassEnrollment {
  id: string;
  class_id: string;
  student_id: string;
  enrolled_at: Date;
}

export interface ClassDeadline {
  id: string;
  class_id: string;
  content_id: string;
  due_date: Date;
  created_at: Date;
}

export interface ClassAnalytics {
  totalStudents: number;
  averageScoresBySection: Array<{
    sectionId: string;
    sectionTitle: string;
    averageScore: number;
  }>;
  completionRates: Array<{
    sectionId: string;
    sectionTitle: string;
    completionRate: number;
  }>;
  atRiskStudents: Array<{
    studentId: string;
    studentName: string;
    averageScore: number;
  }>;
}
