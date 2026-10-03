import { supabase } from '../lib/supabase';

export interface PromotionCandidate {
  student_id: string;
  student_name: string;
  enrollment_id: string;
  current_academic_year_id: string;
  current_academic_year_name: string;
  total_subjects: number;
  completed_subjects: number;
  failed_subjects_count: number;
  average_score: number;
  is_eligible_by_grades: boolean; // ناجح في جميع المواد
  current_status: string;
}

export const promotionService = {
  // جلب قائمة المرشحين للترفيع مع تقييم نتائجهم التلقائية
  async getCandidates(params: {
    fromAcademicYearId: string;
    currentSchoolYearId: string;
  }): Promise<PromotionCandidate[]> {
    // 1. جلب المواد المقررة لهذه السنة لتحديد درجات النجاح
    const { data: subjects, error: subjError } = await supabase
      .from('subjects')
      .select('id, name, passing_score, max_score')
      .eq('academic_year_id', params.fromAcademicYearId);

    if (subjError) throw subjError;
    const totalSubjectsCount = (subjects || []).length;

    // 2. جلب قيود الطلاب مع درجاتهم
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select(`
        id,
        student_id,
        status,
        academic_year:academic_years (id, name),
        student:students (id, full_name),
        grades (
          id,
          subject_id,
          score,
          exam_type
        )
      `)
      .eq('academic_year_id', params.fromAcademicYearId)
      .eq('school_year_id', params.currentSchoolYearId);

    if (enrollError) throw enrollError;

    // 3. تحليل نتائج كل طالب لتحديد الأهلية للترفيع
    return (enrollments || []).map((enrollment: any) => {
      const grades = enrollment.grades || [];
      // Final exam or highest score per subject
      const subjectScores = new Map<string, number>();
      grades.forEach((g: any) => {
        if (g.score !== null && (!subjectScores.has(g.subject_id) || g.exam_type === 'final')) {
          subjectScores.set(g.subject_id, Number(g.score));
        }
      });

      let failedCount = 0;
      let totalScores = 0;
      let completedCount = 0;

      subjects?.forEach(subj => {
        const score = subjectScores.get(subj.id);
        if (score !== undefined) {
          completedCount++;
          totalScores += score;
          if (score < subj.passing_score) {
            failedCount++;
          }
        } else {
          // لم ترصد درجته بعد
          failedCount++;
        }
      });

      const average = completedCount > 0 ? Math.round((totalScores / completedCount) * 10) / 10 : 0;
      const isEligible = totalSubjectsCount > 0 && failedCount === 0 && completedCount === totalSubjectsCount;

      return {
        student_id: enrollment.student?.id || enrollment.student_id,
        student_name: enrollment.student?.full_name || 'طالب بدون اسم',
        enrollment_id: enrollment.id,
        current_academic_year_id: enrollment.academic_year?.id || params.fromAcademicYearId,
        current_academic_year_name: enrollment.academic_year?.name || '',
        total_subjects: totalSubjectsCount,
        completed_subjects: completedCount,
        failed_subjects_count: failedCount,
        average_score: average,
        is_eligible_by_grades: isEligible,
        current_status: enrollment.status
      };
    });
  },

  // تنفيذ عملية الترفيع الجماعي للطلاب المحددين بضغطة زر
  async promoteStudentsBulk(payload: {
    studentIds: string[];
    fromEnrollmentIds: string[];
    targetAcademicYearId: string;
    targetSchoolYearId: string;
  }): Promise<{ count: number }> {
    const { data, error } = await supabase.rpc('promote_students_bulk', {
      p_student_ids: payload.studentIds,
      p_from_enrollment_ids: payload.fromEnrollmentIds,
      p_target_academic_year_id: payload.targetAcademicYearId,
      p_target_school_year_id: payload.targetSchoolYearId
    });

    if (error) throw error;
    return { count: data || 0 };
  }
};
