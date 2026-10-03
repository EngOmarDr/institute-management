import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { checkSupabaseConnection } from '../../lib/supabase';
import { auditService } from '../../services/auditService';
import type { AuditLog } from '../../types';
import { Modal } from './Modal';
import {
  Shield,
  Eye,
  Calendar,
  Database,
  CheckCircle2,
  AlertCircle,
  LogOut,
  History,
  Menu,
  X,
  GraduationCap
} from 'lucide-react';

import { useSettings } from '../../context/SettingsContext';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu, isMobileMenuOpen }) => {
  const {
    role,
    activeSchoolYear,
    setActiveSchoolYear,
    schoolYears,
    userEmail,
    logout
  } = useAuth();
  const { settings } = useSettings();

  const [dbStatus, setDbStatus] = useState<{ connected: boolean; message: string } | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    checkSupabaseConnection().then(setDbStatus);
  }, []);

  const openAuditLogs = async () => {
    try {
      setIsAuditModalOpen(true);
      setAuditLoading(true);
      const logs = await auditService.getRecentLogs(40);
      setAuditLogs(logs);
    } catch (err) {
      console.error(err);
    } finally {
      setAuditLoading(false);
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Brand & Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Hamburger button on mobile (< 1024px) */}
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
            aria-label="القائمة الرئيسية"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-slate-900" /> : <Menu className="w-5 h-5 text-slate-700" />}
          </button>

          {/* Academic Logo (Custom or Default) */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm shrink-0 overflow-hidden">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt="شعار" className="w-full h-full object-contain p-1" />
            ) : (
              <GraduationCap className="w-5 h-5" />
            )}
          </div>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
              {settings.name || 'نظام إدارة المعاهد التعليمية'}
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 hidden sm:block truncate">
              نظام إدارة شؤون الطلاب والنتائج الأكاديمية
            </p>
          </div>
        </div>

        {/* Right Controls: School Year Selector, Supabase status & Role */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Supabase Status Indicator (Desktop only) */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-lg border border-slate-200/60 text-xs">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600">قاعدة البيانات:</span>
            {dbStatus === null ? (
              <span className="text-slate-400">جاري الفحص...</span>
            ) : dbStatus.connected ? (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> متصل
              </span>
            ) : (
              <span className="text-rose-600 font-medium flex items-center gap-1" title={dbStatus.message}>
                <AlertCircle className="w-3.5 h-3.5" /> غير متصل
              </span>
            )}
          </div>

          {/* Current School Year Selector */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-50 px-2 sm:px-3 py-1.5 rounded-xl border border-slate-200/80">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-xs text-slate-500 font-medium hidden md:inline">العام:</span>
            <select
              value={activeSchoolYear?.id || ''}
              onChange={(e) => {
                const selected = schoolYears.find(y => y.id === e.target.value);
                if (selected) setActiveSchoolYear(selected);
              }}
              className="text-[11px] sm:text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer max-w-21.25 sm:max-w-none truncate"
            >
              {schoolYears.map(year => (
                <option key={year.id} value={year.id}>
                  {year.name} {year.is_current ? '(الحالي)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Role Badge (Tablet & Desktop) */}
          <div className="hidden sm:flex items-center">
            {role === 'admin' ? (
              <span className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 sm:px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-bold">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>مدير المعهد</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2.5 sm:px-3 py-1.5 rounded-xl border border-amber-200 text-xs font-bold">
                <Eye className="w-3.5 h-3.5 text-amber-600" />
                <span>كفيل</span>
              </span>
            )}
          </div>

          {/* Audit Logs button (For Admins) */}
          {role === 'admin' && (
            <button
              onClick={openAuditLogs}
              title="سجل التتبع والعمليات (Audit Logs)"
              className="p-1.5 sm:p-2 text-slate-500 hover:text-emerald-700 hover:bg-slate-50 rounded-xl transition-colors border border-slate-200"
            >
              <History className="w-4 h-4" />
            </button>
          )}

          {/* User Profile & Logout */}
          <div className="flex items-center gap-1 sm:gap-2 pr-1 sm:pr-2 border-r border-slate-200">
            <div className="hidden 2xl:block text-left text-xs">
              <p className="font-bold text-slate-800 text-[11px] truncate max-w-32.5">{userEmail}</p>
              <p className="text-[10px] text-slate-400 font-medium">
                {role === 'admin' ? 'مدير النظام' : 'كفيل داعم'}
              </p>
            </div>
            <button
              onClick={logout}
              title="تسجيل الخروج"
              className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Modal: Audit Logs (سجل العمليات والتتبع) */}
      <Modal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        title="سجل التتبع وتاريخ العمليات (Audit Trail)"
        subtitle="توثيق الحركات والتعديلات التي تمت في النظام لمعرفة من قام بكل تغيير"
        maxWidth="4xl"
      >
        <div className="space-y-4 text-right">
          {auditLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">جاري تحميل سجل التتبع...</div>
          ) : auditLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">لا توجد عمليات مسجلة حتى الآن.</div>
          ) : (
            <div className="max-h-96 overflow-y-auto overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-right text-xs min-w-137.5">
                <thead className="bg-slate-100 text-slate-600 sticky top-0 font-bold">
                  <tr>
                    <th className="px-4 py-3">الوقت والتاريخ</th>
                    <th className="px-4 py-3">المستخدم</th>
                    <th className="px-4 py-3">نوع الحركة</th>
                    <th className="px-4 py-3">الجدول / القسم</th>
                    <th className="px-4 py-3">التفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('ar-EG')}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-slate-800">
                        {log.user_email || 'مستخدم غير محدد'}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${log.action === 'CREATE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : log.action === 'UPDATE'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : log.action === 'DELETE'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {log.table_name}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 text-[11px] max-w-xs truncate" title={JSON.stringify(log.details)}>
                        {log.details ? JSON.stringify(log.details) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};
