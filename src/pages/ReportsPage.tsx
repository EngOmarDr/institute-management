import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { academicService } from '../services/academicService';
import { reportsService } from '../services/reportsService';
import type { AcademicYear } from '../types';
import { Badge } from '../components/common/Badge';
import {
  Printer,
  BarChart3,
  Award,
  CheckCircle,
  GraduationCap
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { activeSchoolYear } = useAuth();
  const { settings } = useSettings();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAcademicYears();
  }, []);

  useEffect(() => {
    if (academicYears.length > 0 && !selectedYearId) {
      setSelectedYearId(academicYears[0].id);
    }
  }, [academicYears]);

  useEffect(() => {
    if (selectedYearId && activeSchoolYear?.id) {
      loadReport();
    }
  }, [selectedYearId, activeSchoolYear]);

  const loadAcademicYears = async () => {
    try {
      const years = await academicService.getAcademicYears();
      setAcademicYears(years);
    } catch (err) {
      console.error(err);
    }
  };

  const loadReport = async () => {
    if (!selectedYearId || !activeSchoolYear?.id) return;
    try {
      setLoading(true);
      const data = await reportsService.getAcademicResultsReport(selectedYearId, activeSchoolYear.id);
      setReportData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const totalStudents = reportData.length;
  const passedStudents = reportData.filter(r => r.isOverallPassed).length;
  const passRate = totalStudents > 0 ? Math.round((passedStudents / totalStudents) * 100) : 0;
  const topStudents = reportData.slice(0, 3);
  const activeYearObj = academicYears.find(y => y.id === selectedYearId);

  return (
    <div className="space-y-6">
      {/* Header and Print Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-900">تقارير النتائج الأكاديمية والتحصيل العلمي</h2>
          <p className="text-xs text-slate-500 mt-1">
            كشف درجات معتمد ومفصل للمعهد والجهات الداعمة والكفلاء
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedYearId}
            onChange={(e) => setSelectedYearId(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 shadow-xs cursor-pointer"
          >
            {academicYears.map((yr) => (
              <option key={yr.id} value={yr.id}>{yr.name}</option>
            ))}
          </select>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير (PDF)</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Container */}
      <div id="printable-report" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-8 print:p-0 print:border-none print:shadow-none print:m-0 space-y-6 print:space-y-4">
        {/* Official Header for Print & Screen */}
        <div className="border-b-2 border-emerald-800/20 pb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold overflow-hidden shrink-0">
                {settings.logo_url ? (
                  <img src={settings.logo_url} alt="شعار" className="w-full h-full object-contain p-1" />
                ) : (
                  <GraduationCap className="w-6 h-6 text-emerald-200" />
                )}
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">{settings.name || 'إدارة الشؤون الأكاديمية'}</h1>
                <p className="text-xs text-emerald-800 font-semibold">{settings.report_header || 'تقرير التحصيل العلمي والنتائج الرسمية'}</p>
                {(settings.phone || settings.address) && (
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {settings.phone && <span>هاتف: {settings.phone} </span>}
                    {settings.address && <span>| {settings.address}</span>}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="text-left text-xs text-slate-500 space-y-0.5">
            <p>المستوى الأكاديمي: <b className="text-slate-800">{activeYearObj?.name || '-'}</b></p>
            <p>العام الدراسي: <b className="text-slate-800">{activeSchoolYear?.name || '-'}</b></p>
            <p>تاريخ استخراج التقرير: <b>{new Date().toLocaleDateString('ar-EG')}</b></p>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-800 font-medium">إجمالي طلاب المستوى</p>
              <h4 className="text-2xl font-bold text-emerald-950 mt-1">{totalStudents}</h4>
            </div>
            <GraduationCap className="w-8 h-8 text-emerald-600/50" />
          </div>

          <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-800 font-medium">الطلاب الناجحون</p>
              <h4 className="text-2xl font-bold text-blue-950 mt-1">{passedStudents}</h4>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-600/50" />
          </div>

          <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-800 font-medium">نسبة النجاح العامة</p>
              <h4 className="text-2xl font-bold text-purple-950 mt-1">{passRate}%</h4>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-600/50" />
          </div>
        </div>

        {/* Top 3 Honor Roll (لوحة شرف الأوائل) */}
        {topStudents.length > 0 && topStudents[0].average > 0 && (
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-3">
              <Award className="w-4 h-4 text-amber-500" />
              <span>لوحة الشرف (الطلاب الأوائل والمتفوقون):</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {topStudents.map((st, i) => (
                <div key={st.studentId} className="bg-white p-3.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{st.studentName}</p>
                      <p className="text-[10px] text-slate-400">المركز {i + 1}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {st.average}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full Grades Breakdown Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border border-slate-200 rounded-xl overflow-hidden min-w-[700px] print:min-w-0">
            <thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-10 text-center">#</th>
                <th className="px-4 py-3">اسم الطالب</th>
                <th className="px-4 py-3 text-center">المواد الناجحة</th>
                <th className="px-4 py-3 text-center">المعدل العام</th>
                <th className="px-4 py-3 text-center">النتيجة النهائية</th>
                <th className="px-4 py-3">تفصيل درجات المواد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    جاري إعداد تقرير النتائج...
                  </td>
                </tr>
              ) : reportData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    لا توجد بيانات علامات مسجلة لهذه السنة بعد.
                  </td>
                </tr>
              ) : (
                reportData.map((row, idx) => (
                  <tr key={row.studentId} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-center text-slate-400 font-normal">{idx + 1}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{row.studentName}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-slate-700 font-semibold">
                        {row.passedSubjects} / {row.subjectsDetails?.length || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-900">
                      {row.average > 0 ? `${row.average}%` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.isOverallPassed ? (
                        <Badge variant="emerald">ناجح</Badge>
                      ) : row.failedSubjects > 0 ? (
                        <Badge variant="rose">راسب / مكمل</Badge>
                      ) : (
                        <Badge variant="amber">قيد الرصد</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {row.subjectsDetails?.map((s: any, sIdx: number) => (
                          <span
                            key={sIdx}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                              s.passed ? 'bg-slate-100 text-slate-700' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {s.subjectName}: <b>{s.score}</b>
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Official Footer Signature Block for Print */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-3 text-center text-xs text-slate-600 print:grid">
          <div>
            <p className="font-bold">مسؤول شؤون الطلاب</p>
            <p className="mt-8 text-slate-400">........................</p>
          </div>
          <div>
            <p className="font-bold">{settings.report_footer || 'المشرف الأكاديمي والتعليمي'}</p>
            <p className="mt-8 text-slate-400">........................</p>
          </div>
          <div>
            <p className="font-bold">مدير المعهد</p>
            <p className="mt-8 text-slate-400">........................</p>
          </div>
        </div>
      </div>
    </div>
  );
};
