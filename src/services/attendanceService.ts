import { supabase } from '../lib/supabase';
import type { AttendanceStatus, AttendanceStudentRow } from '../types';
import { auditService } from './auditService';

export const attendanceService = {
  // جلب كشف حضور الطلاب لمستوى وتاريخ محددين
  async getAttendanceForDate(params: {
    academicYearId: string;
    schoolYearId: string;
    date: string; // 'YYYY-MM-DD'
  }): Promise<AttendanceStudentRow[]> {
    // 1. جلب القيود النشطة في هذا المستوى والعام
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select(`
        id,
        student_id,
        status,
        student:students(id, full_name, national_id, phone, status)
      `)
      .eq('academic_year_id', params.academicYearId)
      .eq('school_year_id', params.schoolYearId)
      .in('status', ['enrolled', 'passed', 'failed']);

    if (enrollError) throw enrollError;
    if (!enrollments || enrollments.length === 0) return [];

    // Filter only active students
    const activeEnrollments = enrollments.filter(e => (e.student as any)?.status === 'active');
    const enrollmentIds = activeEnrollments.map(e => e.id);

    // 2. جلب سجلات الحضور المسجلة لهذا اليوم إن وجدت
    const { data: attendanceRecords, error: attError } = await supabase
      .from('attendance')
      .select('*')
      .in('enrollment_id', enrollmentIds)
      .eq('attendance_date', params.date);

    if (attError) throw attError;

    const recordMap = new Map<string, any>();
    attendanceRecords?.forEach(rec => {
      recordMap.set(rec.enrollment_id, rec);
    });

    // 3. بناء القائمة الكاملة (مع قيمة افتراضية 'present' في حال لم يتم تسجيله بعد)
    const result: AttendanceStudentRow[] = activeEnrollments.map(e => {
      const student = e.student as any;
      const existing = recordMap.get(e.id);
      return {
        enrollment_id: e.id,
        student_id: student.id,
        student_name: student.full_name,
        national_id: student.national_id,
        phone: student.phone,
        status: (existing?.status as AttendanceStatus) || 'present',
        notes: existing?.notes || '',
        attendance_id: existing?.id
      };
    });

    // فرز الطلاب هجائياً
    result.sort((a, b) => a.student_name.localeCompare(b.student_name, 'ar'));
    return result;
  },

  // حفظ سجلات الحضور دفعة واحدة (Upsert)
  async saveAttendance(
    records: {
      enrollment_id: string;
      attendance_date: string;
      status: AttendanceStatus;
      notes?: string;
    }[],
    userEmail?: string,
    userRole?: string
  ): Promise<void> {
    if (records.length === 0) return;

    const upsertData = records.map(r => ({
      enrollment_id: r.enrollment_id,
      attendance_date: r.attendance_date,
      status: r.status,
      notes: r.notes?.trim() || null
    }));

    const { error } = await supabase
      .from('attendance')
      .upsert(upsertData, { onConflict: 'enrollment_id,attendance_date' });

    if (error) throw error;

    if (userEmail) {
      await auditService.logAction({
        action: 'UPDATE',
        tableName: 'attendance',
        details: {
          event: 'BATCH_ATTENDANCE_RECORDED',
          date: records[0]?.attendance_date,
          count: records.length
        },
        userEmail,
        userRole
      });
    }
  }
};
