import { supabase } from '../lib/supabase';

export interface InstituteStats {
  totalStudents: number;
  activeStudents: number;
  totalAcademicYears: number;
  totalSubjects: number;
  totalSponsors: number;
  totalContributionsUSD: number;
  studentsPerYear: { yearName: string; count: number }[];
}

export const reportsService = {
  // جلب إحصائيات عامة للمعهد
  async getDashboardStats(schoolYearId?: string): Promise<InstituteStats> {
    // 1. عدد الطلاب
    const { count: totalStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });

    const { count: activeStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // 2. السنوات والمواد
    const { count: totalAcademicYears } = await supabase
      .from('academic_years')
      .select('*', { count: 'exact', head: true });

    const { count: totalSubjects } = await supabase
      .from('subjects')
      .select('*', { count: 'exact', head: true });

    // 3. الكفلاء والمساهمات
    const { count: totalSponsors } = await supabase
      .from('sponsors')
      .select('*', { count: 'exact', head: true });

    const { data: contributions } = await supabase
      .from('sponsorship_contributions')
      .select('amount');

    const totalContributions = (contributions || []).reduce((sum, c) => sum + Number(c.amount || 0), 0);

    // 4. توزيع الطلاب حسب السنة الدراسية الحالية
    let enrollQuery = supabase
      .from('enrollments')
      .select(`
        id,
        academic_year:academic_years (name)
      `);

    if (schoolYearId) {
      enrollQuery = enrollQuery.eq('school_year_id', schoolYearId);
    }

    const { data: enrollments } = await enrollQuery;

    const countByYear: Record<string, number> = {};
    (enrollments || []).forEach((e: any) => {
      const yearName = e.academic_year?.name || 'غير محدد';
      countByYear[yearName] = (countByYear[yearName] || 0) + 1;
    });

    const studentsPerYear = Object.entries(countByYear).map(([yearName, count]) => ({
      yearName,
      count
    }));

    return {
      totalStudents: totalStudents || 0,
      activeStudents: activeStudents || 0,
      totalAcademicYears: totalAcademicYears || 0,
      totalSubjects: totalSubjects || 0,
      totalSponsors: totalSponsors || 0,
      totalContributionsUSD: totalContributions,
      studentsPerYear
    };
  },

  // تقرير النتائج والتفوق لسنة معينة (مخصص للكفيل وللإدارة)
  async getAcademicResultsReport(academicYearId: string, schoolYearId: string) {
    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        status,
        student:students (id, full_name, phone),
        academic_year:academic_years (name),
        school_year:school_years (name),
        grades (
          id,
          score,
          exam_type,
          subject:subjects (id, name, max_score, passing_score)
        )
      `)
      .eq('academic_year_id', academicYearId)
      .eq('school_year_id', schoolYearId);

    if (error) throw error;

    return (enrollments || []).map((enrollment: any) => {
      const grades = enrollment.grades || [];
      let totalScore = 0;
      let totalMax = 0;
      let failedSubjects = 0;
      let passedSubjects = 0;

      const subjectsDetails = grades.map((g: any) => {
        const score = Number(g.score || 0);
        const passing = Number(g.subject?.passing_score || 50);
        const max = Number(g.subject?.max_score || 100);

        totalScore += score;
        totalMax += max;

        if (score >= passing) {
          passedSubjects++;
        } else {
          failedSubjects++;
        }

        return {
          subjectName: g.subject?.name,
          score,
          max,
          passed: score >= passing
        };
      });

      const average = subjectsDetails.length > 0
        ? Math.round((totalScore / subjectsDetails.length) * 10) / 10
        : 0;

      return {
        studentId: enrollment.student?.id,
        studentName: enrollment.student?.full_name || 'بدون اسم',
        phone: enrollment.student?.phone,
        average,
        totalScore,
        passedSubjects,
        failedSubjects,
        isOverallPassed: failedSubjects === 0 && subjectsDetails.length > 0,
        subjectsDetails
      };
    }).sort((a, b) => b.average - a.average); // ترتيب حسب المعدل (الأوائل)
  }
};
