import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { academicService } from '../services/academicService';
import { gradesService } from '../services/gradesService';
import type { AcademicYear, Subject, ExamType } from '../types';
import { Badge } from '../components/common/Badge';
import {
  FileSpreadsheet,
  Save,
  CheckCircle2,
  GraduationCap,
  BookOpen
} from 'lucide-react';

export const GradesPage: React.FC = () => {
  const { role, activeSchoolYear } = useAuth();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Selected filters
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedExamType, setSelectedExamType] = useState<ExamType>('final');

  // Grades table data
  const [gradeRows, setGradeRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedYearId) {
      loadSubjectsForYear(selectedYearId);
    } else {
      setSubjects([]);
      setSelectedSubjectId('');
    }
  }, [selectedYearId]);

  useEffect(() => {
    if (selectedYearId && selectedSubjectId && activeSchoolYear?.id) {
      loadGrades();
    } else {
      setGradeRows([]);
    }
  }, [selectedYearId, selectedSubjectId, selectedExamType, activeSchoolYear]);

  const loadInitialData = async () => {
    try {
      const years = await academicService.getAcademicYears();
      setAcademicYears(years);
      if (years.length > 0) {
        setSelectedYearId(years[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadSubjectsForYear = async (yearId: string) => {
    try {
      const subs = await academicService.getSubjects(yearId);
      setSubjects(subs);
      if (subs.length > 0) {
        setSelectedSubjectId(subs[0].id);
      } else {
        setSelectedSubjectId('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadGrades = async () => {
    if (!selectedYearId || !selectedSubjectId || !activeSchoolYear?.id) return;
    try {
      setLoading(true);
      setSuccessMessage(null);
      const rows = await gradesService.getGradesForSubject({
        academicYearId: selectedYearId,
        schoolYearId: activeSchoolYear.id,
        subjectId: selectedSubjectId,
        examType: selectedExamType
      });
      setGradeRows(rows);
    } catch (err) {
      console.error('Error fetching grades:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (enrollmentId: string, value: string) => {
    setGradeRows(prev => prev.map(row => {
      if (row.enrollment_id === enrollmentId) {
        const numVal = value === '' ? null : Number(value);
        return { ...row, score: numVal };
      }
      return row;
    }));
  };

  const handleSaveAll = async () => {
    if (gradeRows.length === 0) return;
    try {
      setSaving(true);
      setSuccessMessage(null);

      const payload = gradeRows.map(row => ({
        enrollment_id: row.enrollment_id,
        subject_id: selectedSubjectId,
        score: row.score,
        exam_type: selectedExamType,
        notes: row.notes
      }));

      await gradesService.saveGradesBulk(payload);
      setSuccessMessage('تم حفظ وتحديث علامات الطلاب بنجاح في قاعدة البيانات.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert('خطأ أثناء حفظ الدرجات: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const activeSubject = subjects.find(s => s.id === selectedSubjectId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">علامات ودرجات الطلاب</h2>
          <p className="text-xs text-slate-500 mt-1">
            جدول سريع للدرجات بحسب السنة الدراسية والمادة المقررة
          </p>
        </div>

        {role === 'admin' && gradeRows.length > 0 && (
          <button
            onClick={handleSaveAll}
            disabled={saving || loading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ الدرجات المرصودة'}</span>
          </button>
        )}
      </div>

      {/* Filter / Selector Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. Academic Year */}
        <div>
          <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
            <span>السنة الدراسية:</span>
          </label>
          <select
            value={selectedYearId}
            onChange={(e) => setSelectedYearId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
          >
            {academicYears.map((yr) => (
              <option key={yr.id} value={yr.id}>{yr.name}</option>
            ))}
          </select>
        </div>

        {/* 2. Subject */}
        <div>
          <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>المادة المقررة:</span>
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            disabled={subjects.length === 0}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 disabled:bg-slate-100"
          >
            {subjects.length === 0 ? (
              <option value="">لا توجد مواد لهذه السنة</option>
            ) : (
              subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} (عظمى: {sub.max_score} | نجاح: {sub.passing_score})
                </option>
              ))
            )}
          </select>
        </div>

        {/* 3. Exam Type */}
        <div>
          <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>نوع الامتحان:</span>
          </label>
          <select
            value={selectedExamType}
            onChange={(e) => setSelectedExamType(e.target.value as ExamType)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
          >
            <option value="final">الامتحان النهائي</option>
            <option value="midterm">الامتحان النصفي</option>
            <option value="oral">الامتحان الشفهي / العملي</option>
            <option value="coursework">أعمال السنة والمتابعة</option>
          </select>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Grading Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {activeSubject && (
          <div className="px-6 py-3.5 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-600">
            <div>
              <span>المادة: <b>{activeSubject.name}</b></span>
              <span className="mx-2">|</span>
              <span>الدرجة العظمى: <b>{activeSubject.max_score}</b></span>
              <span className="mx-2">|</span>
              <span>حد النجاح: <b>{activeSubject.passing_score}</b></span>
            </div>
            <span className="text-slate-400">إجمالي طلاب الفصل: {gradeRows.length}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs min-w-155">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-3.5 w-12 text-center">#</th>
                <th className="px-6 py-3.5">اسم الطالب</th>
                <th className="px-6 py-3.5 w-48 text-center">العلامة المرصودة</th>
                <th className="px-6 py-3.5 w-32 text-center">التقييم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    جاري تحميل كشف الطلاب...
                  </td>
                </tr>
              ) : gradeRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    لا يوجد طلاب مقيدين في هذه السنة للعام الدراسي الحالي.
                  </td>
                </tr>
              ) : (
                gradeRows.map((row, idx) => {
                  const score = row.score;
                  const max = activeSubject?.max_score || 100;
                  const passing = activeSubject?.passing_score || 50;
                  const isPassed = score !== null && score >= passing;
                  const isFailed = score !== null && score < passing;

                  return (
                    <tr key={row.enrollment_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3.5 text-center text-slate-400 font-normal">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-3.5 font-bold text-slate-900">
                        {row.student_name}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        {role === 'admin' ? (
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="number"
                              min={0}
                              max={max}
                              step="any"
                              value={score ?? ''}
                              onChange={(e) => handleScoreChange(row.enrollment_id, e.target.value)}
                              placeholder="-"
                              className={`w-24 text-center py-1.5 px-2 bg-slate-50 border rounded-xl font-bold text-xs focus:outline-none transition-all ${isPassed
                                ? 'border-emerald-300 text-emerald-700 bg-emerald-50/30'
                                : isFailed
                                  ? 'border-rose-300 text-rose-700 bg-rose-50/30'
                                  : 'border-slate-200 text-slate-800 focus:border-emerald-500'
                                }`}
                            />
                            <span className="text-[11px] text-slate-400">/ {max}</span>
                          </div>
                        ) : (
                          <span className="font-bold text-slate-800">
                            {score ?? '-'} / {max}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        {score === null ? (
                          <span className="text-slate-400 text-[11px]">لم ترصد بعد</span>
                        ) : isPassed ? (
                          <Badge variant="emerald">ناجح</Badge>
                        ) : (
                          <Badge variant="rose">دون حد النجاح</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
