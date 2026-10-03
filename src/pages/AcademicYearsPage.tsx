import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { academicService } from '../services/academicService';
import type { AcademicYear, SchoolYear } from '../types';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const AcademicYearsPage: React.FC = () => {
  const { role, schoolYears, refreshSchoolYears, activeSchoolYear, setActiveSchoolYear } = useAuth();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal: Add / Edit Academic Level
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<AcademicYear | null>(null);
  const [levelForm, setLevelForm] = useState({ name: '', sequence_order: 1, description: '' });

  // Modal: Add / Edit Calendar School Year
  const [isSchoolYearModalOpen, setIsSchoolYearModalOpen] = useState(false);
  const [editingSchoolYear, setEditingSchoolYear] = useState<SchoolYear | null>(null);
  const [schoolYearForm, setSchoolYearForm] = useState({ name: '', is_current: false });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await academicService.getAcademicYears();
      setAcademicYears(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddLevel = () => {
    setEditingLevel(null);
    setLevelForm({
      name: '',
      sequence_order: academicYears.length + 1,
      description: ''
    });
    setIsLevelModalOpen(true);
  };

  const openEditLevel = (lvl: AcademicYear) => {
    setEditingLevel(lvl);
    setLevelForm({
      name: lvl.name,
      sequence_order: lvl.sequence_order,
      description: lvl.description || ''
    });
    setIsLevelModalOpen(true);
  };

  const handleSaveLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!levelForm.name.trim()) return;

    try {
      const cleanDesc = levelForm.description.trim() ? levelForm.description.trim() : null;

      if (editingLevel) {
        await academicService.updateAcademicYear(editingLevel.id, {
          name: levelForm.name.trim(),
          sequence_order: Number(levelForm.sequence_order),
          description: cleanDesc
        });
      } else {
        await academicService.createAcademicYear({
          name: levelForm.name.trim(),
          sequence_order: Number(levelForm.sequence_order),
          description: cleanDesc
        });
      }

      setIsLevelModalOpen(false);
      setEditingLevel(null);
      loadData();
    } catch (err: any) {
      alert('خطأ أثناء حفظ السنة الدراسية: ' + err.message);
    }
  };

  const openAddSchoolYear = () => {
    setEditingSchoolYear(null);
    setSchoolYearForm({ name: '', is_current: false });
    setIsSchoolYearModalOpen(true);
  };

  const openEditSchoolYear = (sy: SchoolYear) => {
    setEditingSchoolYear(sy);
    setSchoolYearForm({ name: sy.name, is_current: sy.is_current });
    setIsSchoolYearModalOpen(true);
  };

  const handleSaveSchoolYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolYearForm.name.trim()) return;

    try {
      if (editingSchoolYear) {
        await academicService.updateSchoolYear(editingSchoolYear.id, {
          name: schoolYearForm.name.trim(),
          is_current: schoolYearForm.is_current
        });
      } else {
        await academicService.createSchoolYear({
          name: schoolYearForm.name.trim(),
          is_current: schoolYearForm.is_current
        });
      }

      setIsSchoolYearModalOpen(false);
      setEditingSchoolYear(null);
      await refreshSchoolYears();
    } catch (err: any) {
      alert('خطأ أثناء حفظ العام الدراسي: ' + err.message);
    }
  };

  const handleDeleteLevel = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف (${name})؟ سيتم حذف جميع المواد والقيود المرتبطة بها.`)) return;
    try {
      await academicService.deleteAcademicYear(id);
      loadData();
    } catch (err: any) {
      alert('خطأ في الحذف: ' + err.message);
    }
  };

  const handleDeleteSchoolYear = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف العام الدراسي (${name})؟`)) return;
    try {
      await academicService.deleteSchoolYear(id);
      await refreshSchoolYears();
    } catch (err: any) {
      alert('خطأ في الحذف: ' + err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Academic Levels (المراحل والسنوات الأكاديمية) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">المراحل والسنوات الأكاديمية</h2>
            <p className="text-xs text-slate-500 mt-1">
              إدارة وتعديل السنوات الدراسية المعتمدة في المعهد (مثل: السنة الأولى، الثانية...) وترتيب تسلسل الترفيع
            </p>
          </div>

          {role === 'admin' && (
            <button
              onClick={openAddLevel}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مرحلة / سنة دراسية</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-3 py-12 text-center text-slate-400 text-xs">جاري تحميل البيانات...</div>
          ) : academicYears.length === 0 ? (
            <div className="col-span-3 py-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-dashed border-slate-200">
              لا توجد سنوات دراسية مضافة.
            </div>
          ) : (
            academicYears.map((year, index) => (
              <div
                key={year.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                      {year.sequence_order}
                    </span>
                    <Badge variant="emerald">الترتيب الأكاديمي {index + 1}</Badge>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">{year.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {year.description || 'لا يوجد وصف مضاف لهذه السنة.'}
                  </p>
                </div>

                {role === 'admin' && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditLevel(year)}
                      className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="تعديل بيانات السنة"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteLevel(year.id, year.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="حذف السنة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. Calendar School Years (الأعوام التقويمية: 2025-2026) */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">الأعوام التقويمية (School Years)</h2>
            <p className="text-xs text-slate-500 mt-1">
              الفترات الزمنية للعام الدراسي لربط القيود وتعديل العام النشط وحفظ أرشيف العلامات
            </p>
          </div>

          {role === 'admin' && (
            <button
              onClick={openAddSchoolYear}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto"
            >
              <Calendar className="w-4 h-4" />
              <span>إضافة عام دراسي تقويمي</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs min-w-125">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold">
                <tr>
                  <th className="px-6 py-4">اسم العام الدراسي</th>
                  <th className="px-6 py-4">الحالة الحالية</th>
                  <th className="px-6 py-4 text-center">الإجراءات والتحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {schoolYears.map((sy) => (
                  <tr key={sy.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>{sy.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {sy.is_current ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          العام الدراسي النشط
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs font-normal">عام سابق / مؤرشف</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {activeSchoolYear?.id !== sy.id && (
                          <button
                            onClick={() => setActiveSchoolYear(sy)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                          >
                            تحديد كعرض حالي
                          </button>
                        )}

                        {role === 'admin' && (
                          <>
                            <button
                              onClick={() => openEditSchoolYear(sy)}
                              className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="تعديل العام الدراسي"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSchoolYear(sy.id, sy.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="حذف العام الدراسي"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: Add / Edit Level */}
      <Modal
        isOpen={isLevelModalOpen}
        onClose={() => setIsLevelModalOpen(false)}
        title={editingLevel ? 'تعديل المرحلة / السنة الدراسية' : 'إضافة مرحلة / سنة دراسية جديدة'}
        subtitle="تحديد الاسم وترتيب الترفيع والوصف"
        maxWidth="md"
      >
        <form onSubmit={handleSaveLevel} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">اسم السنة الدراسية <span className="text-rose-500">*</span></label>
            <input
              type="text"
              required
              value={levelForm.name}
              onChange={(e) => setLevelForm({ ...levelForm, name: e.target.value })}
              placeholder="مثال: السنة الثالثة"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">رقم الترتيب الأكاديمي <span className="text-rose-500">*</span></label>
            <input
              type="number"
              required
              min={0}
              value={levelForm.sequence_order}
              onChange={(e) => setLevelForm({ ...levelForm, sequence_order: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">يُستخدم هذا الرقم لتحديد تسلسل الترفيع التلقائي (1 يليه 2 ثم 3).</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الوصف والمقررات العامة (اختياري)</label>
            <textarea
              rows={2}
              value={levelForm.description}
              onChange={(e) => setLevelForm({ ...levelForm, description: e.target.value })}
              placeholder="وصف مختصر لمرحلة التدريس (يمكن تركه فارغاً)"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsLevelModalOpen(false)}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
            >
              {editingLevel ? 'حفظ التعديلات' : 'حفظ السنة الدراسية'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add / Edit School Year */}
      <Modal
        isOpen={isSchoolYearModalOpen}
        onClose={() => setIsSchoolYearModalOpen(false)}
        title={editingSchoolYear ? 'تعديل العام الدراسي التقويمي' : 'إضافة عام دراسي تقويمي جديد'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveSchoolYear} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">اسم العام الدراسي <span className="text-rose-500">*</span></label>
            <input
              type="text"
              required
              value={schoolYearForm.name}
              onChange={(e) => setSchoolYearForm({ ...schoolYearForm, name: e.target.value })}
              placeholder="مثال: 2026 - 2027"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_current_cb"
              checked={schoolYearForm.is_current}
              onChange={(e) => setSchoolYearForm({ ...schoolYearForm, is_current: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded-sm"
            />
            <label htmlFor="is_current_cb" className="text-xs font-semibold text-slate-700 cursor-pointer">
              تعيين كعام دراسي نشط حالياً للمعهد
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSchoolYearModalOpen(false)}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-xs"
            >
              {editingSchoolYear ? 'حفظ التعديلات' : 'حفظ العام الدراسي'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
