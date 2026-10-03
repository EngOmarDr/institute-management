import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { academicService } from '../services/academicService';
import { promotionService, type PromotionCandidate } from '../services/promotionService';
import type { AcademicYear } from '../types';
import { Badge } from '../components/common/Badge';
import {
  TrendingUp,
  ArrowLeft,
  CheckCircle2,
  GraduationCap,
  Calendar,
  Sparkles
} from 'lucide-react';

export const PromotionPage: React.FC = () => {
  const { role, activeSchoolYear, schoolYears } = useAuth();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);

  // Promotion parameters
  const [sourceYearId, setSourceYearId] = useState<string>('');
  const [targetYearId, setTargetYearId] = useState<string>('');
  const [targetSchoolYearId, setTargetSchoolYearId] = useState<string>('');

  // Candidates list
  const [candidates, setCandidates] = useState<PromotionCandidate[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [promotionResult, setPromotionResult] = useState<{ count: number } | null>(null);

  useEffect(() => {
    loadAcademicYears();
  }, []);

  useEffect(() => {
    if (academicYears.length > 0 && !sourceYearId) {
      setSourceYearId(academicYears[0].id);
    }
  }, [academicYears]);

  // When source year changes, auto-select the next sequential target year
  useEffect(() => {
    if (sourceYearId && academicYears.length > 0) {
      const current = academicYears.find(y => y.id === sourceYearId);
      if (current) {
        const next = academicYears.find(y => y.sequence_order === current.sequence_order + 1);
        if (next) {
          setTargetYearId(next.id);
        } else {
          setTargetYearId('');
        }
      }
      loadCandidates();
    }
  }, [sourceYearId, activeSchoolYear]);

  // Set default target school year
  useEffect(() => {
    if (schoolYears.length > 0 && !targetSchoolYearId) {
      // Pick next school year or current
      setTargetSchoolYearId(activeSchoolYear?.id || schoolYears[0].id);
    }
  }, [schoolYears, activeSchoolYear]);

  const loadAcademicYears = async () => {
    try {
      const data = await academicService.getAcademicYears();
      setAcademicYears(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCandidates = async () => {
    if (!sourceYearId || !activeSchoolYear?.id) return;
    try {
      setLoading(true);
      setPromotionResult(null);
      const data = await promotionService.getCandidates({
        fromAcademicYearId: sourceYearId,
        currentSchoolYearId: activeSchoolYear.id
      });
      setCandidates(data);

      // By default, pre-select all eligible (passing) students!
      const eligibleIds = new Set(data.filter(c => c.is_eligible_by_grades).map(c => c.student_id));
      setSelectedStudentIds(eligibleIds);
    } catch (err) {
      console.error('Error loading promotion candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectStudent = (studentId: string) => {
    const newSet = new Set(selectedStudentIds);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    setSelectedStudentIds(newSet);
  };

  const selectAllEligible = () => {
    const eligibleIds = new Set(candidates.filter(c => c.is_eligible_by_grades).map(c => c.student_id));
    setSelectedStudentIds(eligibleIds);
  };

  const selectAll = () => {
    if (selectedStudentIds.size === candidates.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(candidates.map(c => c.student_id)));
    }
  };

  const handleExecutePromotion = async () => {
    if (selectedStudentIds.size === 0) {
      alert('يرجى تحديد طالب واحد على الأقل للترفيع.');
      return;
    }
    if (!targetYearId || !targetSchoolYearId) {
      alert('يرجى تحديد السنة الدراسية المستهدفة والعام الدراسي.');
      return;
    }

    const targetYearObj = academicYears.find(y => y.id === targetYearId);
    const confirmMsg = `هل تؤكد ترفيع (${selectedStudentIds.size}) طالب إلى (${targetYearObj?.name})؟ سيتم حفظ أرشيف درجاتهم السابقة ونقلهم مباشرة.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setPromoting(true);
      const selectedCandidates = candidates.filter(c => selectedStudentIds.has(c.student_id));
      const studentIds = selectedCandidates.map(c => c.student_id);
      const enrollmentIds = selectedCandidates.map(c => c.enrollment_id);

      const res = await promotionService.promoteStudentsBulk({
        studentIds,
        fromEnrollmentIds: enrollmentIds,
        targetAcademicYearId: targetYearId,
        targetSchoolYearId: targetSchoolYearId
      });

      setPromotionResult(res);
      await loadCandidates();
    } catch (err: any) {
      alert('خطأ أثناء عملية الترفيع: ' + err.message);
    } finally {
      setPromoting(false);
    }
  };

  const targetYear = academicYears.find(y => y.id === targetYearId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">الترفيع السنوي الذكي للطلاب</h2>
          <p className="text-xs text-slate-500 mt-1">
            نقل وترفيع الطلاب الناجحين من سنة إلى السنة التالية بسهولة وبضغطة زر واحدة مع حفظ الأرشيف
          </p>
        </div>

        {role === 'admin' && selectedStudentIds.size > 0 && (
          <button
            onClick={handleExecutePromotion}
            disabled={promoting || !targetYearId}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
          >
            <TrendingUp className="w-4 h-4" />
            <span>
              {promoting
                ? 'جاري ترفيع الطلاب...'
                : `ترفيع (${selectedStudentIds.size}) طالب إلى ${targetYear?.name || 'السنة التالية'}`}
            </span>
          </button>
        )}
      </div>

      {/* Promotion Config Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
          مسار الترفيع والانتقال الأكاديمي:
        </h3>

        <div className="flex flex-col lg:flex-row items-center gap-4">
          {/* 1. Source Level */}
          <div className="flex-1 w-full bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">ترفيع الطلاب الحاليين في:</span>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-emerald-600" />
              <select
                value={sourceYearId}
                onChange={(e) => setSourceYearId(e.target.value)}
                className="w-full bg-transparent font-bold text-sm text-slate-900 focus:outline-none cursor-pointer"
              >
                {academicYears.map((yr) => (
                  <option key={yr.id} value={yr.id}>{yr.name}</option>
                ))}
              </select>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              العام الدراسي الحالي: <b>{activeSchoolYear?.name}</b>
            </span>
          </div>

          {/* Arrow Indicator */}
          <div className="p-3 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </div>

          {/* 2. Target Level */}
          <div className="flex-1 w-full bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
            <span className="text-[11px] font-bold text-emerald-700 block mb-1">الانتقال إلى السنة التالية:</span>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-emerald-700" />
              <select
                value={targetYearId}
                onChange={(e) => setTargetYearId(e.target.value)}
                className="w-full bg-transparent font-bold text-sm text-emerald-950 focus:outline-none cursor-pointer"
              >
                <option value="">-- اختر السنة المستهدفة --</option>
                {academicYears.map((yr) => (
                  <option key={yr.id} value={yr.id}>{yr.name}</option>
                ))}
              </select>
            </div>
            <span className="text-[11px] text-emerald-700/80 mt-1 block">
              المستوى الأكاديمي الجديد
            </span>
          </div>

          {/* 3. Target School Year */}
          <div className="flex-1 w-full bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">للعام الدراسي:</span>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-700" />
              <select
                value={targetSchoolYearId}
                onChange={(e) => setTargetSchoolYearId(e.target.value)}
                className="w-full bg-transparent font-bold text-sm text-slate-900 focus:outline-none cursor-pointer"
              >
                {schoolYears.map((sy) => (
                  <option key={sy.id} value={sy.id}>
                    {sy.name} {sy.is_current ? '(الحالي)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              العام التقويمي للقيد الجديد
            </span>
          </div>
        </div>
      </div>

      {/* Promotion Result Alert */}
      {promotionResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold text-sm">اكتمل الترفيع بنجاح!</p>
            <p className="text-emerald-700">تم نقل وترفيع ({promotionResult.count}) طالب بنجاح وحفظ قيودهم الجديدة.</p>
          </div>
        </div>
      )}

      {/* Candidate Selection Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={selectAllEligible}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>تحديد جميع الناجحين تلقائياً</span>
          </button>

          <button
            onClick={selectAll}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
          >
            {selectedStudentIds.size === candidates.length ? 'إلغاء التحديد' : 'تحديد الكل'}
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          المحددون للترفيع: <b className="text-emerald-700 font-bold">{selectedStudentIds.size}</b> من أصل <b>{candidates.length}</b> طالب
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs min-w-[700px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-4 w-12 text-center">اختيار</th>
                <th className="px-6 py-4">اسم الطالب</th>
                <th className="px-6 py-4 text-center">المواد المكتملة</th>
                <th className="px-6 py-4 text-center">المعدل العام</th>
                <th className="px-6 py-4 text-center">أهلية الترفيع</th>
                <th className="px-6 py-4 text-center">الحالة الحالية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    جاري فحص نتائج الطلاب...
                  </td>
                </tr>
              ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    لا يوجد طلاب مقيدين في هذه السنة حالياً.
                  </td>
                </tr>
              ) : (
                candidates.map((c) => {
                  const isSelected = selectedStudentIds.has(c.student_id);
                  return (
                    <tr
                      key={c.student_id}
                      onClick={() => toggleSelectStudent(c.student_id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-emerald-50/40' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by tr click
                          className="w-4 h-4 text-emerald-600 rounded-sm cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {c.student_name}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600">
                        {c.completed_subjects} / {c.total_subjects}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-900">
                        {c.average_score > 0 ? `${c.average_score}%` : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {c.is_eligible_by_grades ? (
                          <Badge variant="emerald">
                            ناجح ومؤهل للترفيع
                          </Badge>
                        ) : c.failed_subjects_count > 0 ? (
                          <Badge variant="rose">
                            مكمل ({c.failed_subjects_count} مادة)
                          </Badge>
                        ) : (
                          <Badge variant="amber">
                            لم تكتمل الدرجات
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {c.current_status === 'promoted' ? (
                          <Badge variant="purple">تم ترفيعه مسبقاً</Badge>
                        ) : (
                          <span className="text-slate-500 font-normal">قيد الدراسة</span>
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
