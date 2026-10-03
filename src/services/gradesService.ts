import { supabase } from '../lib/supabase';
import type { ExamType } from '../types';

export const gradesService = {
  // جلب درجات مادة معينة لجميع طلاب سنة دراسية معينة
  async getGradesForSubject(params: {
    academicYearId: string;
    schoolYearId: string;
    subjectId: string;
    examType: ExamType;
  }) {
    // 1. جلب الطلاب المقيدين في هذه السنة وهذا العام
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select(`
        id,
        student_id,
        status,
        student:students (id, full_name, phone)
      `)
      .eq('academic_year_id', params.academicYearId)
      .eq('school_year_id', params.schoolYearId);

    if (enrollError) throw enrollError;

    const enrollmentIds = (enrollments || []).map(e => e.id);
    if (enrollmentIds.length === 0) {
      return [];
    }

    // 2. جلب الدرجات المرصودة مسبقاً
    const { data: existingGrades, error: gradeError } = await supabase
      .from('grades')
      .select('*')
      .eq('subject_id', params.subjectId)
      .eq('exam_type', params.examType)
      .in('enrollment_id', enrollmentIds);

    if (gradeError) throw gradeError;

    // 3. دمج البيانات لسهولة العرض في جدول الرصد
    const gradesMap = new Map((existingGrades || []).map(g => [g.enrollment_id, g]));

    return (enrollments || []).map(enrollment => {
      const existing = gradesMap.get(enrollment.id);
      return {
        enrollment_id: enrollment.id,
        student_id: (enrollment.student as any)?.id,
        student_name: (enrollment.student as any)?.full_name || 'بدون اسم',
        student_phone: (enrollment.student as any)?.phone,
        grade_id: existing?.id,
        score: existing?.score ?? null,
        notes: existing?.notes ?? '',
        subject_id: params.subjectId,
        exam_type: params.examType
      };
    });
  },

  // حفظ مجموعة علامات دفعة واحدة (Bulk Upsert)
  async saveGradesBulk(grades: {
    enrollment_id: string;
    subject_id: string;
    score: number | null;
    exam_type: ExamType;
    notes?: string;
  }[]): Promise<void> {
    const validGrades = grades
      .filter(g => g.score !== null && !isNaN(Number(g.score)))
      .map(g => ({
        enrollment_id: g.enrollment_id,
        subject_id: g.subject_id,
        score: Number(g.score),
        exam_type: g.exam_type,
        notes: g.notes || '',
        updated_at: new Date().toISOString()
      }));

    if (validGrades.length === 0) return;

    const { error } = await supabase
      .from('grades')
      .upsert(validGrades, {
        onConflict: 'enrollment_id,subject_id,exam_type'
      });

    if (error) throw error;
  },

  // جلب الكشف الشامل لجميع مواد الطلاب في سنة معينة
  async getFullYearGrades(params: {
    academicYearId: string;
    schoolYearId: string;
  }) {
    // جلب القيود
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select(`
        id,
        student_id,
        status,
        student:students (id, full_name, phone),
        grades (
          id,
          score,
          exam_type,
          subject_id
        )
      `)
      .eq('academic_year_id', params.academicYearId)
      .eq('school_year_id', params.schoolYearId);

    if (enrollError) throw enrollError;
    return enrollments || [];
  }
};
