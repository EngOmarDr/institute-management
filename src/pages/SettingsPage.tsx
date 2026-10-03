import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import {
  Building2,
  Image,
  Upload,
  Phone,
  Mail,
  MapPin,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Sparkles
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { role, userEmail } = useAuth();
  const { settings, updateSettings } = useSettings();

  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    phone: '',
    email: '',
    address: '',
    report_header: '',
    report_footer: ''
  });

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setFormData({
        name: settings.name || '',
        logo_url: settings.logo_url || '',
        phone: settings.phone || '',
        email: settings.email || '',
        address: settings.address || '',
        report_header: settings.report_header || '',
        report_footer: settings.report_footer || ''
      });
    }
  }, [settings]);

  // Handle Logo file upload (convert to Base64 data URL for instant zero-config storage)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('حجم ملف الشعار يجب ألا يتجاوز 2 ميغابايت.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData(prev => ({ ...prev, logo_url: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMessage('اسم المعهد حقل إلزامي.');
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);
      await updateSettings(
        {
          name: formData.name.trim(),
          logo_url: formData.logo_url || null,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          address: formData.address.trim() || null,
          report_header: formData.report_header.trim() || null,
          report_footer: formData.report_footer.trim() || null
        },
        userEmail || undefined,
        role
      );

      setSuccessMessage('تم حفظ إعدادات المعهد والشعار بنجاح وتحديث النظام.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'حدث خطأ أثناء حفظ الإعدادات.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">إعدادات المعهد وتخصيص الهوية</h2>
          <p className="text-xs text-slate-500 mt-1">
            تخصيص اسم المعهد، الشعار الرسمي، بيانات التواصل، وترويسة كشوف الدرجات والشهادات المعتمدة
          </p>
        </div>

        {role === 'admin' && (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: General & Branding */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Basic Identity */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-right">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">الهوية والاسم الرسمي للمعهد</h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                اسم المعهد / المؤسسة التعليمية <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: معهد الرواد للغات والعلوم، معهد التقنية العالي..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                سيظهر هذا الاسم في أعلى صفحات النظام، شاشة الدخول، وتذييل القوائم.
              </p>
            </div>

            {/* Logo Settings */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Image className="w-4 h-4 text-emerald-600" />
                <span>شعار المعهد الرسمي (Logo)</span>
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                {/* Logo Preview */}
                <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                  {formData.logo_url ? (
                    <img
                      src={formData.logo_url}
                      alt="شعار المعهد"
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <GraduationCap className="w-10 h-10 text-slate-300" />
                  )}
                </div>

                <div className="flex-1 space-y-2 text-right w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors flex items-center gap-1.5 shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-emerald-600" />
                      <span>رفع صورة الشعار</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>

                    {formData.logo_url ? (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logo_url: '' })}
                        className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        إزالة الشعار
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logo_url: '/institute-logo.jpg' })}
                        className="px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>استخدام الشعار المصمم</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    صيغ مدعومة: PNG, JPG, SVG, WebP. الحجم الأقصى: 2 ميغابايت.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Contact Information */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-right">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Phone className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">بيانات الاتصال والعنوان</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم الهاتف / الواتساب</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+963 9XXXXXXXX"
                    className="w-full pr-9 pl-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">البريد الإلكتروني الرسمي</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="info@institute.edu"
                    className="w-full pr-9 pl-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 text-left"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان المعهد ومقره</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="المدينة، الحي، بجانب..."
                  className="w-full pr-9 pl-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Reports & Certificate Customization */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-right">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <FileText className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">تخصيص التقارير الرسمية للطباعة</h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                نص ترويسة التقرير (Header)
              </label>
              <input
                type="text"
                value={formData.report_header}
                onChange={(e) => setFormData({ ...formData, report_header: e.target.value })}
                placeholder="إدارة الشؤون الأكاديمية والتعليمية"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">يظهر في أعلى كشوف الدرجات والشهادات المطبوعة.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                مسمى توقيع المشرف (Signature Title)
              </label>
              <input
                type="text"
                value={formData.report_footer}
                onChange={(e) => setFormData({ ...formData, report_footer: e.target.value })}
                placeholder="المشرف الأكاديمي والتعليمي"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">يظهر في خانة الاعتماد والتوقيع أسفل الكشف.</p>
            </div>

            {/* Live Preview Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 mt-4">
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                معاينة ترويسة الطباعة:
              </span>
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-center space-y-1 shadow-2xs">
                {formData.logo_url && (
                  <img src={formData.logo_url} alt="شعار" className="w-8 h-8 object-contain mx-auto mb-1" />
                )}
                <h4 className="text-xs font-bold text-slate-900">{formData.name || 'اسم المعهد'}</h4>
                <p className="text-[10px] text-emerald-800 font-semibold">{formData.report_header || 'إدارة الشؤون الأكاديمية'}</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
