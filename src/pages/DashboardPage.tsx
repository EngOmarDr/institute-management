import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { reportsService, type InstituteStats } from '../services/reportsService';
import { StatsCard } from '../components/common/StatsCard';
import {
  Users,
  Layers,
  BookOpen,
  HeartHandshake,
  TrendingUp,
  Award,
  ArrowRight
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { role, activeSchoolYear } = useAuth();
  const [stats, setStats] = useState<InstituteStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [activeSchoolYear]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await reportsService.getDashboardStats(activeSchoolYear?.id);
      setStats(data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-linear-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs">
              {role === 'admin' ? 'لوحة تحكم الإدارة' : 'لوحة متابعة الكفيل'}
            </span>
            <span className="text-emerald-200 text-xs">
              العام الدراسي: {activeSchoolYear?.name || 'غير محدد'}
            </span>
          </div>
          <h2 className="text-2xl font-bold">مرحباً بكم في نظام إدارة المعاهد التعليمية</h2>
          <p className="text-emerald-100 text-sm mt-1 max-w-xl">
            نظام متكامل لمتابعة قيد الطلاب، النتائج، وإدارة الترفيع السنوي والتقارير الأكاديمية والمالية.
          </p>
        </div>

        {role === 'admin' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('students')}
              className="px-4 py-2.5 bg-white text-emerald-800 font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-50 transition-colors flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" />
              <span>إضافة طالب جديد</span>
            </button>
            <button
              onClick={() => onNavigate('promotion')}
              className="px-4 py-2.5 bg-emerald-600/40 border border-white/20 text-white font-bold text-xs rounded-xl hover:bg-emerald-600/60 transition-colors flex items-center gap-1.5"
            >
              <TrendingUp className="w-4 h-4" />
              <span>الترفيع السنوي</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="إجمالي الطلاب المسجلين"
          value={loading ? '...' : stats?.totalStudents || 0}
          subtitle={`النشطون حالياً: ${stats?.activeStudents || 0}`}
          icon={Users}
          color="emerald"
        />
        <StatsCard
          title="المراحل والسنوات الدراسية"
          value={loading ? '...' : stats?.totalAcademicYears || 0}
          subtitle="سنوات دراسية معتمدة"
          icon={Layers}
          color="blue"
        />
        <StatsCard
          title="المواد والمناهج المقررة"
          value={loading ? '...' : stats?.totalSubjects || 0}
          subtitle="مقرراً دراسياً معتمداً"
          icon={BookOpen}
          color="purple"
        />
        <StatsCard
          title="الكفلاء والداعمين"
          value={loading ? '...' : stats?.totalSponsors || 0}
          subtitle={`إجمالي الدعم: $${stats?.totalContributionsUSD || 0}`}
          icon={HeartHandshake}
          color="amber"
        />
      </div>

      {/* Grid: Distribution of Students & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Distribution by Year */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">توزيع الطلاب حسب السنوات الدراسية</h3>
              <p className="text-xs text-slate-500">عدد الطلاب المقيدين في كل مستوى للعام الدراسي الحالي</p>
            </div>
            {role === 'admin' && (
              <button
                onClick={() => onNavigate('students')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <span>إدارة القيود</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-sm">جاري تحميل البيانات...</div>
          ) : stats?.studentsPerYear && stats.studentsPerYear.length > 0 ? (
            <div className="space-y-3">
              {stats.studentsPerYear.map((item, idx) => {
                const total = stats.totalStudents || 1;
                const percentage = Math.round((item.count / total) * 100);
                return (
                  <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center mb-1.5 text-xs font-semibold">
                      <span className="text-slate-800">{item.yearName}</span>
                      <span className="text-slate-500">{item.count} طالب ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
              لا توجد قيود مسجلة لهذا العام الدراسي حتى الآن.
            </div>
          )}
        </div>

        {/* Shortcuts / Quick Highlights */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">الوصول السريع</h3>
            <p className="text-xs text-slate-500 mb-4">العمليات الأكثر استخداماً في النظام</p>

            <div className="space-y-2">
              {role === 'admin' ? (
                <>
                  <button
                    onClick={() => onNavigate('grades')}
                    className="w-full text-right p-3 bg-slate-50 hover:bg-emerald-50/70 border border-slate-100 hover:border-emerald-200 rounded-xl transition-all group flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-800">علامات الامتحانات</p>
                      <p className="text-[11px] text-slate-500">إدخال درجات الطلاب للمواد بسرعة</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 rotate-180" />
                  </button>

                  <button
                    onClick={() => onNavigate('promotion')}
                    className="w-full text-right p-3 bg-slate-50 hover:bg-emerald-50/70 border border-slate-100 hover:border-emerald-200 rounded-xl transition-all group flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-800">ترفيع الطلاب للسنة التالية</p>
                      <p className="text-[11px] text-slate-500">نقل الناجحين بضغطة زر وأرشفة سجلاتهم</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 rotate-180" />
                  </button>

                  <button
                    onClick={() => onNavigate('reports')}
                    className="w-full text-right p-3 bg-slate-50 hover:bg-emerald-50/70 border border-slate-100 hover:border-emerald-200 rounded-xl transition-all group flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-800">تقارير النتائج والتفوق</p>
                      <p className="text-[11px] text-slate-500">كشوف الدرجات وتقارير الكفلاء والداعمين</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 rotate-180" />
                  </button>
                </>
              ) : (
                <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>ملاحظة الكفيل</span>
                  </div>
                  <p className="text-amber-800 leading-relaxed">
                    بصفتك كفيلاً، يمكنك تصفح كشوف الدرجات ونسب النجاح والطلاب الأوائل مباشرة من قسم التقارير.
                  </p>
                  <button
                    onClick={() => onNavigate('reports')}
                    className="w-full mt-2 py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700 transition-colors"
                  >
                    فتح تقرير النتائج والتفوق
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
            <span>حالة قاعدة البيانات:</span>
            <span className="text-emerald-600 font-bold">نشطة ومحمية عبر RLS</span>
          </div>
        </div>
      </div>
    </div>
  );
};
