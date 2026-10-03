import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { academicService } from '../services/academicService';
import type { Subject, AcademicYear } from '../types';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Filter,
  CheckCircle
} from 'lucide-react';

export const SubjectsPage: React.FC = () => {
  const { role } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [filterYearId, setFilterYearId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Modal: Add/Edit Subject
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    academic_year_id: '',
    name: '',
    max_score: 100,
    passing_score: 50,
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAcademicYears();
  }, []);

  useEffect(() => {
    loadSubjects();
  }, [filterYearId]);

  const loadAcademicYears = async () => {
    try {
      const data = await academicService.getAcademicYears();
      setAcademicYears(data);
      if (data.length > 0 && !formData.academic_year_id) {
        setFormData(prev => ({ ...prev, academic_year_id: data[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const data = await academicService.getSubjects(filterYearId === 'all' ? undefined : filterYearId);
      setSubjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.academic_year_id) return;

    try {
      setSubmitting(true);
      const cleanDescription = formData.description.trim() ? formData.description.trim() : null;

      if (editingSubject) {
        await academicService.updateSubject(editingSubject.id, {
          name: formData.name.trim(),
          academic_year_id: formData.academic_year_id,
          max_score: Number(formData.max_score),
          passing_score: Number(formData.passing_score),
          description: cleanDescription
        });
      } else {
        await academicService.createSubject({
          name: formData.name.trim(),
          academic_year_id: formData.academic_year_id,
          max_score: Number(formData.max_score),
          passing_score: Number(formData.passing_score),
          description: cleanDescription
        });
      }

      setIsModalOpen(false);
      setEditingSubject(null);
      setFormData({
        academic_year_id: academicYears[0]?.id || '',
        name: '',
        max_score: 100,
        passing_score: 50,
        description: ''
      });
      loadSubjects();
    } catch (err: any) {
      alert('خطأ أثناء حفظ المادة: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف مادة (${name})؟ سيتم حذف جميع الدرجات المرصودة لها.`)) return;
    try {
      await academicService.deleteSubject(id);
      loadSubjects();
    } catch (err: any) {
      alert('خطأ في الحذف: ' + err.message);
    }
  };

  const openEdit = (subj: Subject) => {
    setEditingSubject(subj);
    setFormData({
      academic_year_id: subj.academic_year_id,
      name: subj.name,
      max_score: subj.max_score,
      passing_score: subj.passing_score,
      description: subj.description || ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">المواد والمناهج المقررة</h2>
          <p className="text-xs text-slate-500 mt-1">
            تعريف المناهج والمقررات والدرجات العظمى ودرجة النجاح لكل سنة دراسية
          </p>
        </div>

        {role === 'admin' && (
          <button
            onClick={() => {
              setEditingSubject(null);
              setFormData({
                academic_year_id: academicYears[0]?.id || '',
                name: '',
                max_score: 100,
                passing_score: 50,
                description: ''
              });
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مادة مقررة</span>
          </button>
        )}
      </div>

      {/* Filter by Academic Year */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
        <span className="text-xs font-bold text-slate-600">تصفية حسب السنة الدراسية:</span>
        <select
          value={filterYearId}
          onChange={(e) => setFilterYearId(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
        >
          <option value="all">جميع السنوات والمستويات</option>
          {academicYears.map((yr) => (
            <option key={yr.id} value={yr.id}>{yr.name}</option>
          ))}
        </select>
      </div>

      {/* Subjects Cards / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-slate-400 text-xs">جاري تحميل المواد...</div>
        ) : subjects.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-dashed border-slate-200">
            لم يتم العثور على مواد دراسية مقررة لهذه السنة.
          </div>
        ) : (
          subjects.map((subj) => (
            <div
              key={subj.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-200 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="blue">
                    {(subj.academic_year as any)?.name || 'سنة دراسية'}
                  </Badge>
                  <span className="text-[11px] text-slate-400">
                    النجاح: {subj.passing_score} / {subj.max_score}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>{subj.name}</span>
                </h3>

                {subj.description && (
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                    {subj.description}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-600 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>الدرجة العظمى: <b>{subj.max_score}</b></span>
                </div>

                {role === 'admin' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(subj)}
                      className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="تعديل المادة"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(subj.id, subj.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="حذف المادة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Add/Edit Subject */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? 'تعديل مادة دراسية' : 'إضافة مادة دراسية مقررة'}
        subtitle="تحديد السنة المرتبطة والدرجة العظمى ودرجة النجاح"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">اسم المادة<span className="text-rose-500">*</span></label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">السنة الدراسية المقررة فيها <span className="text-rose-500">*</span></label>
            <select
              required
              value={formData.academic_year_id}
              onChange={(e) => setFormData({ ...formData, academic_year_id: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
            >
              {academicYears.map((yr) => (
                <option key={yr.id} value={yr.id}>{yr.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الدرجة العظمى <span className="text-rose-500">*</span></label>
              <input
                type="number"
                required
                min={1}
                value={formData.max_score}
                onChange={(e) => setFormData({ ...formData, max_score: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">درجة النجاح <span className="text-rose-500">*</span></label>
              <input
                type="number"
                required
                min={1}
                value={formData.passing_score}
                onChange={(e) => setFormData({ ...formData, passing_score: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات / وصف المقرر</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

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
              className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
            >
              {submitting ? 'جاري الحفظ...' : 'حفظ المادة'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
