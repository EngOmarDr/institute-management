import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Layers,
  BookOpen,
  FileSpreadsheet,
  TrendingUp,
  HeartHandshake,
  BarChart3,
  ShieldAlert,
  UserCheck,
  X,
  GraduationCap,
  CalendarCheck,
  Settings
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const { role, userEmail } = useAuth();

  const adminNavItems = [
    { id: 'dashboard', label: 'لوحة المؤشرات', icon: LayoutDashboard },
    { id: 'students', label: 'شؤون الطلاب', icon: Users },
    { id: 'attendance', label: 'سجل الحضور والغياب', icon: CalendarCheck },
    { id: 'academic_years', label: 'المراحل والسنوات', icon: Layers },
    { id: 'subjects', label: 'المواد الدراسية', icon: BookOpen },
    { id: 'grades', label: 'العلامات والنتائج', icon: FileSpreadsheet },
    { id: 'promotion', label: 'الترفيع السنوي للطلاب', icon: TrendingUp },
    { id: 'sponsors', label: 'الكفلاء والداعمين', icon: HeartHandshake },
    { id: 'users', label: 'المستخدمين والحسابات', icon: UserCheck },
    { id: 'reports', label: 'التقارير المتقدمة', icon: BarChart3 },
    { id: 'settings', label: 'إعدادات المعهد والشعار', icon: Settings },
  ];

  const sponsorNavItems = [
    { id: 'dashboard', label: 'ملخص إحصائيات المعهد', icon: LayoutDashboard },
    { id: 'reports', label: 'تقارير النتائج والتفوق', icon: BarChart3 },
  ];

  const navItems = role === 'admin' ? adminNavItems : sponsorNavItems;

  const handleItemClick = (id: string) => {
    onNavigate(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const menuContent = (
    <div className="p-4 flex-1 flex flex-col justify-between">
      <div>
        {/* Role Banner */}
        {role === 'sponsor' ? (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-800 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-bold">حساب كفيل (صلاحية قراءة)</p>
              <p className="text-[11px] text-amber-700 mt-0.5">معاينة التقارير وإحصائيات الطلاب والنتائج فقط.</p>
            </div>
          </div>
        ) : (
          <div className="mb-4 px-3 py-2 bg-emerald-50/60 border border-emerald-100 rounded-xl text-emerald-800 text-xs flex items-center justify-between">
            <span className="font-semibold">صلاحية المدير:</span>
            <span className="font-bold text-emerald-700">تحكم كامل</span>
          </div>
        )}

        {/* Menu list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${isActive
                  ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
        <p>نظام إدارة المعاهد التعليمية v1.0</p>
        <p className="text-[10px] text-slate-400 mt-0.5">متصل بـ Supabase Cloud</p>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar (>= 1024px) */}
      <aside className="hidden lg:flex w-64 bg-white border-l border-slate-200/80 flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
        {menuContent}
      </aside>

      {/* 2. Mobile Drawer (< 1024px) with smooth open & close transitions */}
      <div 
        className={`fixed inset-0 z-50 lg:hidden flex transition-all duration-300 ${
          isOpenMobile ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
        }`}
        aria-hidden={!isOpenMobile}
      >
        {/* Backdrop Overlay with smooth fade */}
        <div
          className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
            isOpenMobile ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onCloseMobile}
        />

        {/* Drawer Content with smooth slide in/out from right (RTL) */}
        <div 
          className={`relative w-72 max-w-[85vw] bg-white h-full shadow-2xl z-10 flex flex-col justify-between transition-transform duration-300 ease-in-out transform ${
            isOpenMobile ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">نظام إدارة المعهد</h3>
                <p className="text-[10px] text-slate-400 truncate max-w-35">{userEmail}</p>
              </div>
            </div>
            <button
              onClick={onCloseMobile}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="إغلاق القائمة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menu items */}
          <div className="flex-1 overflow-y-auto">
            {menuContent}
          </div>
        </div>
      </div>
    </>
  );
};
