import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { StudentsPage } from './pages/StudentsPage';
import { AttendancePage } from './pages/AttendancePage';
import { AcademicYearsPage } from './pages/AcademicYearsPage';
import { SubjectsPage } from './pages/SubjectsPage';
import { GradesPage } from './pages/GradesPage';
import { PromotionPage } from './pages/PromotionPage';
import { SponsorsPage } from './pages/SponsorsPage';
import { UsersPage } from './pages/UsersPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  BarChart3,
  Menu,
  GraduationCap
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { role, isAuthenticated, loading } = useAuth();
  const { settings } = useSettings();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Prevent login page flash during session restoration
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-emerald-500 selection:text-white" dir="rtl">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-xl shadow-emerald-950/60 ring-4 ring-emerald-500/20">
              <GraduationCap className="w-8 h-8 text-emerald-100" />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-emerald-500/20 blur-md -z-10 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">نظام إدارة المعاهد التعليمية</h1>
            <p className="text-xs text-slate-400 mt-1">جاري التحقق من الجلسة واسترجاع البيانات...</p>
          </div>
          <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mt-2" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Enforce sponsor permissions: if role is sponsor, restrict to dashboard & reports
  const effectivePage = (role === 'sponsor' && !['dashboard', 'reports'].includes(currentPage))
    ? 'reports'
    : currentPage;

  const renderPage = () => {
    switch (effectivePage) {
      case 'dashboard':
        return <DashboardPage onNavigate={setCurrentPage} />;
      case 'students':
        return <StudentsPage />;
      case 'attendance':
        return <AttendancePage />;
      case 'academic_years':
        return <AcademicYearsPage />;
      case 'subjects':
        return <SubjectsPage />;
      case 'grades':
        return <GradesPage />;
      case 'promotion':
        return <PromotionPage />;
      case 'sponsors':
        return <SponsorsPage />;
      case 'users':
        return <UsersPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 print:bg-white print:min-h-0">
      {/* Top Navigation */}
      <div className="print:hidden">
        <Navbar
          onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
          isMobileMenuOpen={isMobileMenuOpen}
        />
      </div>

      {/* Main Container with Sidebar and Content Area */}
      <div className="flex flex-1 print:block">
        {/* Right Sidebar in RTL (Desktop persistent + Mobile drawer) */}
        <div className="print:hidden shrink-0">
          <Sidebar
            currentPage={effectivePage}
            onNavigate={(page) => {
              setCurrentPage(page);
              setIsMobileMenuOpen(false);
            }}
            isOpenMobile={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
          />
        </div>

        {/* Dynamic Page Content (Generous padding + bottom spacer so mobile fixed bar never covers content) */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden pb-28 sm:pb-32 lg:pb-8 print:p-0 print:m-0 print:max-w-none print:w-full print:pb-0">
          {renderPage()}
          {/* Explicit spacing block on mobile devices ensuring complete clearance */}
          <div className="h-20 sm:h-24 lg:hidden print:hidden shrink-0 pointer-events-none" aria-hidden="true" />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar for Quick Navigation (< 1024px) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex justify-around items-center print:hidden shadow-lg shadow-slate-900/10">
        <button
          onClick={() => {
            setCurrentPage('dashboard');
            setIsMobileMenuOpen(false);
          }}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg text-[10px] font-bold transition-colors ${effectivePage === 'dashboard' ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'
            }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>المؤشرات</span>
        </button>

        {role === 'admin' && (
          <button
            onClick={() => {
              setCurrentPage('students');
              setIsMobileMenuOpen(false);
            }}
            className={`flex flex-col items-center gap-0.5 p-1 rounded-lg text-[10px] font-bold transition-colors ${effectivePage === 'students' ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'
              }`}
          >
            <Users className="w-5 h-5" />
            <span>الطلاب</span>
          </button>
        )}

        {role === 'admin' && (
          <button
            onClick={() => {
              setCurrentPage('grades');
              setIsMobileMenuOpen(false);
            }}
            className={`flex flex-col items-center gap-0.5 p-1 rounded-lg text-[10px] font-bold transition-colors ${effectivePage === 'grades' ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'
              }`}
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span>العلامات</span>
          </button>
        )}

        <button
          onClick={() => {
            setCurrentPage('reports');
            setIsMobileMenuOpen(false);
          }}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg text-[10px] font-bold transition-colors ${effectivePage === 'reports' ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'
            }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span>التقارير</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(prev => !prev)}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg text-[10px] font-bold transition-colors ${isMobileMenuOpen ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'
            }`}
        >
          <Menu className="w-5 h-5" />
          <span>المزيد</span>
        </button>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
