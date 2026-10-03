import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersService } from '../services/usersService';
import { sponsorsService } from '../services/sponsorsService';
import type { Profile, Sponsor, UserRole } from '../types';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import {
  UserCheck,
  UserPlus,
  Shield,
  Eye,
  Trash2,
  Mail,
  Phone,
  Key,
  Calendar,
  AlertCircle,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { role, userEmail } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'sponsor' as UserRole,
    phone: '',
    sponsor_id: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
    loadSponsors();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await usersService.getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error(err);
      setLoadError(err.message || 'تعذر تحميل قائمة المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const loadSponsors = async () => {
    try {
      const data = await sponsorsService.getSponsors();
      setSponsors(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password || !formData.full_name.trim()) {
      setFormError('يرجى ملء كافة الحقول الإلزامية.');
      return;
    }

    if (formData.password.length < 6) {
      setFormError('كلمة المرور يجب أن لا تقل عن 6 أحرف أو أرقام.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      await usersService.createUser({
        email: formData.email.trim(),
        password: formData.password,
        full_name: formData.full_name.trim(),
        role: formData.role,
        phone: formData.phone.trim() || undefined,
        sponsor_id: formData.sponsor_id || undefined
      });

      setIsModalOpen(false);
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: 'sponsor',
        phone: '',
        sponsor_id: ''
      });
      setSuccessMessage(`تم إنشاء حساب المستخدم (${formData.full_name.trim()}) بنجاح.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadUsers();
    } catch (err: any) {
      setFormError(err.message || 'خطأ أثناء إنشاء الحساب.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string, email?: string) => {
    if (email === userEmail) {
      alert('لا يمكنك حذف حسابك الحالي الذي تستخدمه لتسجيل الدخول.');
      return;
    }
    if (!window.confirm(`هل أنت متأكد من حذف الحساب (${email || 'المستخدم'})؟`)) return;

    try {
      await usersService.deleteUser(id);
      setSuccessMessage('تم حذف الحساب بنجاح.');
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadUsers();
    } catch (err: any) {
      alert('خطأ أثناء الحذف: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">إدارة المستخدمين والصلاحيات</h2>
          <p className="text-xs text-slate-500 mt-1">
            إنشاء وإدارة حسابات مدراء المعهد والكفلاء وتحديد صلاحيات كل مستخدم بدقة
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => loadUsers()}
            disabled={loading}
            title="تحديث القائمة"
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {role === 'admin' && (
            <button
              onClick={() => {
                setFormError(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>إنشاء حساب مستخدم جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 shadow-xs transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Load Error Notification */}
      {loadError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            onClick={() => loadUsers()}
            className="px-2.5 py-1 bg-white border border-rose-300 hover:bg-rose-100 rounded-lg text-rose-700 font-bold text-[11px]"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs min-w-[650px]">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-4">المستخدم والاسم</th>
                <th className="px-6 py-4">البريد الإلكتروني</th>
                <th className="px-6 py-4">الدور والصلاحية</th>
                <th className="px-6 py-4">رقم الهاتف</th>
                <th className="px-6 py-4">تاريخ الإنشاء</th>
                <th className="px-6 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    جاري تحميل حسابات المستخدمين...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    لا يوجد حسابات مسجلة.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrent = u.email === userEmail;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            u.role === 'admin' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {u.role === 'admin' ? <Shield className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="flex items-center gap-1.5">
                              <span>{u.full_name}</span>
                              {isCurrent && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm">
                                  (حسابك الحالي)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-[11px]" dir="ltr">
                        {u.email || '-'}
                      </td>
                      <td className="px-6 py-4">
                        {u.role === 'admin' ? (
                          <Badge variant="emerald">مدير المعهد (كامل الصلاحيات)</Badge>
                        ) : (
                          <Badge variant="amber">كفيل داعم (عرض التقارير فقط)</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {u.phone || '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-[11px]">
                        {new Date(u.created_at).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {!isCurrent && role === 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            title="حذف الحساب"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Modal: Create User Account */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="إنشاء حساب مستخدم جديد"
        subtitle="إضافة مستخدم إلى النظام وتحديد صلاحياته (مدير أو كفيل)"
        maxWidth="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 text-right">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل <span className="text-rose-500">*</span></label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="مثال: الشيخ سعيد أحمد أو فاعل خير..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني <span className="text-rose-500">*</span></label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@institute.edu"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-left"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور <span className="text-rose-500">*</span></label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="6 أحرف أو أرقام على الأقل"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-left"
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الدور والصلاحية <span className="text-rose-500">*</span></label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value="sponsor">كفيل داعم (تقارير فقط)</option>
                <option value="admin">مدير معهد (تحكم كامل)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="05XXXXXXXX"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {formData.role === 'sponsor' && sponsors.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ربط بسجل كفيل معتمد (اختياري)</label>
              <select
                value={formData.sponsor_id}
                onChange={(e) => setFormData({ ...formData, sponsor_id: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- بدون ربط محدد --</option>
                {sponsors.map((sp) => (
                  <option key={sp.id} value={sp.id}>{sp.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs disabled:opacity-50"
            >
              {submitting ? 'جاري الإنشاء...' : 'إنشاء الحساب الآن'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
