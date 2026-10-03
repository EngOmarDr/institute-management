import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { academicService } from '../services/academicService';
import { attendanceService } from '../services/attendanceService';
import type { AcademicYear, AttendanceStatus, AttendanceStudentRow } from '../types';
import { Badge } from '../components/common/Badge';
import {
  CalendarCheck,
  Calendar,
  GraduationCap,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserX,
  UserCheck,
  HelpCircle,
  CheckSquare
} from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { role, activeSchoolYear, userEmail } = useAuth();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [studentRows, setStudentRows] = useState<AttendanceStudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedYearId && activeSchoolYear?.id && selectedDate) {
      loadAttendance();
    } else {
      setStudentRows([]);
    }
  }, [selectedYearId, activeSchoolYear, selectedDate]);

  const loadAcademicYears = async () => {
    try {
      const years = await academicService.getAcademicYears();
      setAcademicYears(years);
      if (years.length > 0) {
        setSelectedYearId(years[0].id);
      }
    } catch (err) {
      console.error('Error loading academic years:', err);
    }
  };

  const loadAttendance = async () => {
    if (!selectedYearId || !activeSchoolYear?.id || !selectedDate) return;
    try {
      setLoading(true);
      setErrorMessage(null);
      const rows = await attendanceService.getAttendanceForDate({
        academicYearId: selectedYearId,
        schoolYearId: activeSchoolYear.id,
        date: selectedDate
      });
      setStudentRows(rows);
    } catch (err: any) {
      console.error('Error fetching attendance:', err);
      setErrorMessage(err.message || 'حدث خطأ أثناء تحميل سجل الحضور.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (enrollmentId: string, newStatus: AttendanceStatus) => {
    setStudentRows(prev => prev.map(row => {
      if (row.enrollment_id === enrollmentId) {
        return { ...row, status: newStatus };
      }
      return row;
    }));
  };

  const handleNotesChange = (enrollmentId: string, notes: string) => {
    setStudentRows(prev => prev.map(row => {
      if (row.enrollment_id === enrollmentId) {
        return { ...row, notes };
      }
      return row;
    }));
  };

  const handleMarkAllPresent = () => {
    setStudentRows(prev => prev.map(row => ({ ...row, status: 'present' })));
  };

  const handleSaveAttendance = async () => {
    if (studentRows.length === 0 || !selectedDate) return;
    try {
      setSaving(true);
      setErrorMessage(null);

      const recordsToSave = studentRows.map(row => ({
        enrollment_id: row.enrollment_id,
        attendance_date: selectedDate,
        status: row.status,
        notes: row.notes
      }));

      await attendanceService.saveAttendance(recordsToSave, userEmail || undefined, role);

      setSuccessMessage(`تم حفظ سجل الحضور ليوم (${selectedDate}) بنجاح.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Error saving attendance:', err);
      setErrorMessage(err.message || 'حدث خطأ أثناء حفظ سجل الحضور.');
    } finally {
      setSaving(false);
    }
  };

  // KPIs
  const totalStudents = studentRows.length;
  const presentCount = studentRows.filter(r => r.status === 'present').length;
  const absentCount = studentRows.filter(r => r.status === 'absent').length;
  const lateCount = studentRows.filter(r => r.status === 'late').length;
  const excusedCount = studentRows.filter(r => r.status === 'excused').length;
  const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">سجل الحضور والغياب اليومي</h2>
          <p className="text-xs text-slate-500 mt-1">
            تسجيل ومتابعة حضور وغياب الطلاب وتوثيق التأخر والأعذار المقبولة
          </p>
        </div>

        {role === 'admin' && (
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={handleMarkAllPresent}
              disabled={loading || studentRows.length === 0}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <span>تحديد الكل حاضر</span>
            </button>

            <button
              onClick={handleSaveAttendance}
              disabled={saving || loading || studentRows.length === 0}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري الحفظ...' : 'حفظ كشف الحضور'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter / Selector Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 1. Academic Level */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
            <span>المرحلة / السنة الدراسية:</span>
          </label>
          <select
            value={selectedYearId}
            onChange={(e) => setSelectedYearId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
          >
            {academicYears.map((yr) => (
              <option key={yr.id} value={yr.id}>{yr.name}</option>
            ))}
          </select>
        </div>

        {/* 2. Date Picker */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>تاريخ اليوم المراد تحضيره:</span>
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Daily Metrics / Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500">إجمالي الطلاب</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{totalStudents}</p>
        </div>

        <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-100 shadow-2xs">
          <p className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>حاضر ({attendanceRate}%)</span>
          </p>
          <p className="text-xl font-bold text-emerald-950 mt-1">{presentCount}</p>
        </div>

        <div className="p-3.5 bg-rose-50/80 rounded-xl border border-rose-100 shadow-2xs">
          <p className="text-[11px] font-semibold text-rose-800 flex items-center gap-1">
            <UserX className="w-3.5 h-3.5 text-rose-600" />
            <span>غائب</span>
          </p>
          <p className="text-xl font-bold text-rose-950 mt-1">{absentCount}</p>
        </div>

        <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-100 shadow-2xs">
          <p className="text-[11px] font-semibold text-amber-800 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>متأخر</span>
          </p>
          <p className="text-xl font-bold text-amber-950 mt-1">{lateCount}</p>
        </div>

        <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-100 shadow-2xs col-span-2 sm:col-span-1">
          <p className="text-[11px] font-semibold text-blue-800 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>معذور</span>
          </p>
          <p className="text-xl font-bold text-blue-950 mt-1">{excusedCount}</p>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs min-w-[700px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="px-5 py-3.5 w-12 text-center">#</th>
                <th className="px-5 py-3.5">اسم الطالب</th>
                <th className="px-5 py-3.5 w-72 text-center">حالة الحضور</th>
                <th className="px-5 py-3.5">ملاحظات وسبب الغياب / التأخر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    جاري تحميل كشف الحضور...
                  </td>
                </tr>
              ) : studentRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    لا يوجد طلاب مسجلون في هذه المرحلة أو السنة الدراسية المحددة.
                  </td>
                </tr>
              ) : (
                studentRows.map((row, index) => (
                  <tr key={row.enrollment_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 text-center text-slate-400 font-mono text-[11px]">
                      {index + 1}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      <div>
                        <p>{row.student_name}</p>
                        {row.phone && (
                          <p className="text-[10px] text-slate-400 font-normal">{row.phone}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {/* Segmented status buttons */}
                      <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200/80 gap-1 w-full justify-center">
                        <button
                          type="button"
                          disabled={role !== 'admin'}
                          onClick={() => handleStatusChange(row.enrollment_id, 'present')}
                          className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all ${
                            row.status === 'present'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          حاضر
                        </button>

                        <button
                          type="button"
                          disabled={role !== 'admin'}
                          onClick={() => handleStatusChange(row.enrollment_id, 'absent')}
                          className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all ${
                            row.status === 'absent'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          غائب
                        </button>

                        <button
                          type="button"
                          disabled={role !== 'admin'}
                          onClick={() => handleStatusChange(row.enrollment_id, 'late')}
                          className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all ${
                            row.status === 'late'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          متأخر
                        </button>

                        <button
                          type="button"
                          disabled={role !== 'admin'}
                          onClick={() => handleStatusChange(row.enrollment_id, 'excused')}
                          className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all ${
                            row.status === 'excused'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          معذور
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <input
                        type="text"
                        disabled={role !== 'admin'}
                        value={row.notes || ''}
                        onChange={(e) => handleNotesChange(row.enrollment_id, e.target.value)}
                        placeholder={row.status === 'present' ? 'اختياري...' : 'اذكر السبب أو الملاحظة...'}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
