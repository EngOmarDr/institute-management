export type UserRole = 'admin' | 'sponsor';

export interface Profile {
  id: string;
  email?: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  sponsor_id?: string;
  created_at: string;
}

export interface AcademicYear {
  id: string;
  name: string; // e.g., 'السنة الأولى', 'السنة الثانية'
  sequence_order: number;
  description?: string | null;
  created_at?: string;
}

export interface SchoolYear {
  id: string;
  name: string; // e.g., '2025 - 2026'
  is_current: boolean;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string;
}

export interface Subject {
  id: string;
  academic_year_id: string;
  name: string;
  max_score: number;
  passing_score: number;
  description?: string | null;
  created_at?: string;
  academic_year?: AcademicYear;
}

export type StudentStatus = 'active' | 'suspended' | 'graduated' | 'withdrawn';

export interface Student {
  id: string;
  full_name: string;
  national_id?: string | null;
  phone?: string | null;
  guardian_phone?: string | null;
  birth_date?: string | null;
  address?: string | null;
  status: StudentStatus;
  notes?: string | null;
  created_at?: string;
  current_enrollment?: Enrollment;
}

export type EnrollmentStatus = 'enrolled' | 'passed' | 'failed' | 'promoted';

export interface Enrollment {
  id: string;
  student_id: string;
  academic_year_id: string;
  school_year_id: string;
  status: EnrollmentStatus;
  notes?: string | null;
  created_at?: string;
  student?: Student;
  academic_year?: AcademicYear;
  school_year?: SchoolYear;
}

export type ExamType = 'midterm' | 'final' | 'oral' | 'coursework';

export interface Grade {
  id: string;
  enrollment_id: string;
  subject_id: string;
  score: number | null;
  exam_type: ExamType;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  subject?: Subject;
  enrollment?: Enrollment;
}

export interface Sponsor {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  created_at?: string;
  contributions_total?: number;
}

export interface SponsorshipContribution {
  id: string;
  sponsor_id: string;
  school_year_id?: string | null;
  amount: number;
  currency: string;
  contribution_date: string;
  description?: string | null;
  created_at?: string;
  sponsor?: Sponsor;
  school_year?: SchoolYear;
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  user_email?: string | null;
  user_role?: string | null;
  action: string;
  table_name: string;
  record_id?: string | null;
  details?: any;
  created_at: string;
}

export interface StudentAcademicSummary {
  enrollment_id: string;
  student_id: string;
  student_name: string;
  academic_year_name: string;
  total_subjects: number;
  graded_subjects: number;
  passed_subjects: number;
  average_score: number;
  overall_status: 'passed' | 'failed' | 'pending';
}

export interface InstituteSettings {
  id: string;
  name: string;
  logo_url?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  report_header?: string | null;
  report_footer?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id?: string;
  enrollment_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  notes?: string | null;
  created_at?: string;
  enrollment?: Enrollment;
}

export interface AttendanceStudentRow {
  enrollment_id: string;
  student_id: string;
  student_name: string;
  national_id?: string | null;
  phone?: string | null;
  status: AttendanceStatus;
  notes?: string;
  attendance_id?: string;
}

