import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { sponsorsService } from '../services/sponsorsService';
import type { Sponsor, SponsorshipContribution } from '../types';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import {
  Plus,
  Phone,
  Mail,
  Trash2
} from 'lucide-react';

export const SponsorsPage: React.FC = () => {
  const { role, activeSchoolYear } = useAuth();
  const [sponsors, setSponsors] = useState<(Sponsor & { contributions: SponsorshipContribution[] })[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddSponsorModalOpen, setIsAddSponsorModalOpen] = useState(false);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);

  // Forms
  const [sponsorForm, setSponsorForm] = useState({ name: '', phone: '', email: '', notes: '' });
  const [contributionForm, setContributionForm] = useState({ amount: '', currency: 'USD', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSponsors();
  }, []);

  const loadSponsors = async () => {
    try {
      setLoading(true);
      const data = await sponsorsService.getSponsors();
      setSponsors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sponsorForm.name.trim()) return;

    try {
      setSubmitting(true);
      await sponsorsService.createSponsor({
        name: sponsorForm.name.trim(),
        phone: sponsorForm.phone.trim() || undefined,
        email: sponsorForm.email.trim() || undefined,
        notes: sponsorForm.notes.trim() || undefined
      });
      setIsAddSponsorModalOpen(false);
      setSponsorForm({ name: '', phone: '', email: '', notes: '' });
      loadSponsors();
    } catch (err: any) {
      alert('خطأ أثناء إضافة الكفيل: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSponsor || !contributionForm.amount) return;

    try {
      setSubmitting(true);
      await sponsorsService.addContribution({
        sponsor_id: selectedSponsor.id,
        school_year_id: activeSchoolYear?.id,
        amount: Number(contributionForm.amount),
        currency: contributionForm.currency,
        contribution_date: new Date().toISOString().split('T')[0],
        description: contributionForm.description.trim() || undefined
      });
      setIsContributionModalOpen(false);
      setContributionForm({ amount: '', currency: 'USD', description: '' });
      loadSponsors();
    } catch (err: any) {
      alert('خطأ أثناء تسجيل الدعم: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSponsor = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف الكفيل (${name})؟`)) return;
    try {
      await sponsorsService.deleteSponsor(id);
      loadSponsors();
    } catch (err: any) {
      alert('خطأ في الحذف: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">سجل الكفلاء والداعمين</h2>
          <p className="text-xs text-slate-500 mt-1">
            إدارة الكفلاء الذين يتولون كفالة مقاعد الطلاب والأساتذة ومتابعة سجل مساهماتهم
          </p>
        </div>

        {role === 'admin' && (
          <button
            onClick={() => setIsAddSponsorModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة كفيل / متبرع</span>
          </button>
        )}
      </div>

      {/* Sponsors Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-slate-400 text-xs">جاري تحميل الكفلاء...</div>
        ) : sponsors.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-dashed border-slate-200">
            لم يتم تسجيل أي كفلاء حتى الآن.
          </div>
        ) : (
          sponsors.map((sponsor) => (
            <div
              key={sponsor.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                    {sponsor.name.charAt(0)}
                  </div>
                  <Badge variant="amber">
                    إجمالي الدعم: ${sponsor.contributions_total || 0}
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1">{sponsor.name}</h3>

                <div className="space-y-1 text-xs text-slate-500 mt-3">
                  {sponsor.phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sponsor.phone}</span>
                    </p>
                  )}
                  {sponsor.email && (
                    <p className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sponsor.email}</span>
                    </p>
                  )}
                  {sponsor.notes && (
                    <p className="text-[11px] text-slate-400 mt-2 bg-slate-50 p-2 rounded-lg">
                      {sponsor.notes}
                    </p>
                  )}
                </div>
              </div>

              {role === 'admin' && (
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedSponsor(sponsor);
                      setIsContributionModalOpen(true);
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>تسجيل دفعة تبرع</span>
                  </button>

                  <button
                    onClick={() => handleDeleteSponsor(sponsor.id, sponsor.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal: Add Sponsor */}
      <Modal
        isOpen={isAddSponsorModalOpen}
        onClose={() => setIsAddSponsorModalOpen(false)}
        title="إضافة كفيل أو داعم جديد"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSponsor} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">اسم الكفيل / المتبرع <span className="text-rose-500">*</span></label>
            <input
              type="text"
              required
              value={sponsorForm.name}
              onChange={(e) => setSponsorForm({ ...sponsorForm, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
              <input
                type="tel"
                value={sponsorForm.phone}
                onChange={(e) => setSponsorForm({ ...sponsorForm, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                value={sponsorForm.email}
                onChange={(e) => setSponsorForm({ ...sponsorForm, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات الكفالة</label>
            <textarea
              rows={2}
              value={sponsorForm.notes}
              onChange={(e) => setSponsorForm({ ...sponsorForm, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddSponsorModalOpen(false)}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
            >
              {submitting ? 'جاري الحفظ...' : 'حفظ بيانات الكفيل'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Contribution */}
      <Modal
        isOpen={isContributionModalOpen}
        onClose={() => setIsContributionModalOpen(false)}
        title={`تسجيل مساهمة كفالة: ${selectedSponsor?.name || ''}`}
        maxWidth="md"
      >
        <form onSubmit={handleAddContribution} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ <span className="text-rose-500">*</span></label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                required
                min={1}
                value={contributionForm.amount}
                onChange={(e) => setContributionForm({ ...contributionForm, amount: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
              />
              <select
                value={contributionForm.currency}
                onChange={(e) => setContributionForm({ ...contributionForm, currency: e.target.value })}
                className="w-24 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              >
                <option value="USD">USD ($)</option>
                <option value="SAR">SAR (ر.س)</option>
                <option value="TRY">TRY (₺)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الوصف أو بنود الصرف</label>
            <input
              type="text"
              value={contributionForm.description}
              onChange={(e) => setContributionForm({ ...contributionForm, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsContributionModalOpen(false)}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
            >
              {submitting ? 'جاري الحفظ...' : 'تسجيل التبرع'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
