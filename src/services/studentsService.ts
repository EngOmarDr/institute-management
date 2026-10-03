import { supabase } from '../lib/supabase';
import type { Student, Enrollment } from '../types';

export const studentsService = {
  // جلب الطلاب مع تفاصيل قيدهم الحالي
  async getStudents(filters?: {
    academicYearId?: string;
    schoolYearId?: string;
    status?: string;
    search?: string;
  }): Promise<(Student & { current_enrollment?: Enrollment })[]> {
    let query = supabase
      .from('students')
      .select(`
        *,
        enrollments (
          id,
          academic_year_id,
          school_year_id,
          status,
          notes,
          created_at,
          academic_year:academic_years (*),
          school_year:school_years (*)
        )
      `)
      .order('full_name', { ascending: true });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.search && filters.search.trim()) {
      query = query.or(`full_name.ilike.%${filters.search.trim()}%,phone.ilike.%${filters.search.trim()}%,national_id.ilike.%${filters.search.trim()}%,address.ilike.%${filters.search.trim()}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((student: any) => {
      const enrollments: Enrollment[] = student.enrollments || [];
      let currentEnrollment: Enrollment | undefined;
      if (filters?.schoolYearId) {
        currentEnrollment = enrollments.find(e => e.school_year_id === filters.schoolYearId);
      } else {
        currentEnrollment = enrollments.find(e => (e as any).school_year?.is_current) || enrollments[0];
      }

      return {
        ...student,
        current_enrollment: currentEnrollment
      };
    }).filter(student => {
      if (filters?.academicYearId && filters.academicYearId !== 'all') {
        return student.current_enrollment?.academic_year_id === filters.academicYearId;
      }
      return true;
    });
  },

  // إضافة طالب جديد مع قيده في السنة الدراسية المختارة
  async createStudentWithEnrollment(payload: {
    student: Omit<Student, 'id' | 'created_at' | 'current_enrollment'>;
    academic_year_id: string;
    school_year_id: string;
  }): Promise<Student> {
    const { data: newStudent, error: studentError } = await supabase
      .from('students')
      .insert([payload.student])
      .select()
      .single();

    if (studentError) throw studentError;

    const { error: enrollmentError } = await supabase
      .from('enrollments')
      .insert([{
        student_id: newStudent.id,
        academic_year_id: payload.academic_year_id,
        school_year_id: payload.school_year_id,
        status: 'enrolled'
      }]);

    if (enrollmentError) throw enrollmentError;

    return newStudent;
  },

  // تعديل بيانات طالب كاملة مع إمكانية تعديل السنة المقيد بها
  async updateStudent(
    id: string,
    updates: Partial<Student>,
    academicYearId?: string,
    schoolYearId?: string
  ): Promise<Student> {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // إذا طلب تعديل السنة الدراسية الحالية
    if (academicYearId && schoolYearId) {
      await supabase
        .from('enrollments')
        .upsert({
          student_id: id,
          school_year_id: schoolYearId,
          academic_year_id: academicYearId,
          status: 'enrolled'
        }, {
          onConflict: 'student_id,school_year_id'
        });
    }

    return data;
  },

  // استيراد جماعي للطلاب من Excel
  async importStudentsBulk(
    studentsList: Array<{
      full_name: string;
      national_id?: string | null;
      phone?: string | null;
      guardian_phone?: string | null;
      birth_date?: string | null;
      address?: string | null;
      notes?: string | null;
    }>,
    academic_year_id: string,
    school_year_id: string
  ): Promise<{ successCount: number; errors: string[] }> {
    const errors: string[] = [];
    let successCount = 0;

    for (const item of studentsList) {
      try {
        if (!item.full_name || !item.full_name.trim()) continue;

        const { data: newStudent, error: sErr } = await supabase
          .from('students')
          .insert([{
            full_name: item.full_name.trim(),
            national_id: item.national_id?.trim() || null,
            phone: item.phone?.trim() || null,
            guardian_phone: item.guardian_phone?.trim() || null,
            birth_date: item.birth_date || null,
            address: item.address?.trim() || null,
            notes: item.notes?.trim() || null,
            status: 'active'
          }])
          .select()
          .single();

        if (sErr) throw sErr;

        const { error: eErr } = await supabase
          .from('enrollments')
          .insert([{
            student_id: newStudent.id,
            academic_year_id: academic_year_id,
            school_year_id: school_year_id,
            status: 'enrolled'
          }]);

        if (eErr) throw eErr;

        successCount++;
      } catch (err: any) {
        errors.push(`فشل استيراد (${item.full_name}): ${err.message}`);
      }
    }

    return { successCount, errors };
  },

  // حذف طالب
  async deleteStudent(id: string): Promise<void> {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // جلب سجل الطالب التاريخي والدرجات لجميع السنوات
  async getStudentTranscript(studentId: string) {
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        *,
        enrollments (
          id,
          status,
          created_at,
          academic_year:academic_years (*),
          school_year:school_years (*),
          grades (
            id,
            score,
            exam_type,
            notes,
            subject:subjects (*)
          )
        )
      `)
      .eq('id', studentId)
      .single();

    if (studentError) throw studentError;
    return student;
  }
};
