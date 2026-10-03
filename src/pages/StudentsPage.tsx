import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentsService } from '../services/studentsService';
import { academicService } from '../services/academicService';
import type { Student, AcademicYear, Enrollment } from '../types';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import {
  downloadStudentExcelTemplate,
  parseStudentsExcelFile,
  type ExcelStudentRow
} from '../utils/excelHelper';
import {
  UserPlus,
  Search,
  Filter,
  GraduationCap,
  Trash2,
  Edit2,
  FileText,
  FileSpreadsheet,
  Download,
  Upload,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const StudentsPage: React.FC = () => {
  const { role, activeSchoolYear } = useAuth();
  const [students, setStudents] = useState<(Student & { current_enrollment?: Enrollment })[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);

  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
  const [transcriptData, setTranscriptData] = useState<any | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  // Excel Import state
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [excelStudents, setExcelStudents] = useState<ExcelStudentRow[]>([]);
  const [excelTargetYearId, setExcelTargetYearId] = useState<string>('');
  const [excelImporting, setExcelImporting] = useState(false);
  const [excelError, setExcelError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    national_id: '',
    phone: '',
    guardian_phone: '',
    birth_date: '',
    address: '',
    status: 'active' as any,
    notes: '',
    academic_year_id: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    loadAcademicYears();
  }, []);

  useEffect(() => {
    loadStudents();
  }, [selectedYearId, statusFilter, searchQuery, activeSchoolYear]);

  const loadAcademicYears = async () => {
    try {
      const years = await academicService.getAcademicYears();
      setAcademicYears(years);
      if (years.length > 0) {
        if (!formData.academic_year_id) {
          setFormData(prev => ({ ...prev, academic_year_id: years[0].id }));
        }
        if (!excelTargetYearId) {
          setExcelTargetYearId(years[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading academic years:', err);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await studentsService.getStudents({
        academicYearId: selectedYearId,
        schoolYearId: activeSchoolYear?.id,
        status: statusFilter,
        search: searchQuery
      });
      setStudents(data);
    } catch (err) {
      console.error('Error loading students:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddStudent = () => {
    setFormData({
      full_name: '',
      national_id: '',
      phone: '',
      guardian_phone: '',
      birth_date: '',
      address: '',
      status: 'active',
      notes: '',
      academic_year_id: academicYears[0]?.id || ''
    });
    setIsAddModalOpen(true);
  };

  const openEditStudent = (student: any) => {
    setEditingStudent(student);
    const currEnrollYear = student.current_enrollment?.academic_year_id || academicYears[0]?.id || '';
    setFormData({
      full_name: student.full_name || '',
      national_id: student.national_id || '',
      phone: student.phone || '',
      guardian_phone: student.guardian_phone || '',
      birth_date: student.birth_date || '',
      address: student.address || '',
      status: student.status || 'active',
      notes: student.notes || '',
      academic_year_id: currEnrollYear
    });
    setIsEditModalOpen(true);
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.academic_year_id || !activeSchoolYear?.id) {
      alert('يرجى ملء اسم الطالب والسنة الدراسية');
      return;
    }

    try {
      setFormSubmitting(true);
      await studentsService.createStudentWithEnrollment({
        student: {
          full_name: formData.full_name.trim(),
          national_id: formData.national_id.trim() || null,
          phone: formData.phone.trim() || null,
          guardian_phone: formData.guardian_phone.trim() || null,
          birth_date: formData.birth_date || null,
          address: formData.address.trim() || null,
          notes: formData.notes.trim() || null,
          status: formData.status
        },
        academic_year_id: formData.academic_year_id,
        school_year_id: activeSchoolYear.id
      });

      setIsAddModalOpen(false);
      loadStudents();
    } catch (err: any) {
      alert('خطأ أثناء إضافة الطالب: ' + err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !formData.full_name.trim()) return;

    try {
      setFormSubmitting(true);
      await studentsService.updateStudent(
        editingStudent.id,
        {
          full_name: formData.full_name.trim(),
          national_id: formData.national_id.trim() || null,
          phone: formData.phone.trim() || null,
          guardian_phone: formData.guardian_phone.trim() || null,
          birth_date: formData.birth_date || null,
          address: formData.address.trim() || null,
          status: formData.status,
          notes: formData.notes.trim() || null
        },
        formData.academic_year_id,
        activeSchoolYear?.id
      );

      setIsEditModalOpen(false);
      setEditingStudent(null);
      loadStudents();
    } catch (err: any) {
      alert('خطأ أثناء تعديل بيانات الطالب: ' + err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف الطالب (${name})؟ سيتم حذف جميع قيوده وعلاماته المسجلة.`)) {
      return;
    }
    try {
      await studentsService.deleteStudent(id);
      loadStudents();
    } catch (err: any) {
      alert('خطأ أثناء الحذف: ' + err.message);
    }
  };

  const handleOpenTranscript = async (studentId: string) => {
    try {
      setIsTranscriptModalOpen(true);
      setTranscriptLoading(true);
      const data = await studentsService.getStudentTranscript(studentId);
      setTranscriptData(data);
    } catch (err: any) {
      alert('خطأ في جلب السجل الأكاديمي: ' + err.message);
    } finally {
      setTranscriptLoading(false);
    }
  };

  // Excel Handlers
  const handleExcelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setExcelError(null);
      const parsed = await parseStudentsExcelFile(file);
      if (parsed.length === 0) {
        setExcelError('لم يتم العثور على سجلات طلاب صالحة في الملف.');
      } else {
        setExcelStudents(parsed);
      }
    } catch (err: any) {
      setExcelError('خطأ أثناء قراءة ملف الإكسل: ' + err.message);
    }
  };

  const handleExecuteExcelImport = async () => {
    if (excelStudents.length === 0 || !excelTargetYearId || !activeSchoolYear?.id) {
      alert('يرجى تحديد ملف إكسل واختيار السنة الدراسية');
      return;
    }

    try {
      setExcelImporting(true);
      const res = await studentsService.importStudentsBulk(
        excelStudents,
        excelTargetYearId,
        activeSchoolYear.id
      );

      alert(`تم استيراد (${res.successCount}) طالب بنجاح!`);
      setIsExcelModalOpen(false);
      setExcelStudents([]);
      loadStudents();
    } catch (err: any) {
      alert('خطأ أثناء الاستيراد: ' + err.message);
    } finally {
      setExcelImporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="emerald">منتظم</Badge>;
      case 'suspended':
        return <Badge variant="amber">موقوف</Badge>;
      case 'graduated':
        return <Badge variant="blue">متخرج</Badge>;
      case 'withdrawn':
        return <Badge variant="rose">منسحب</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">سجل شؤون الطلاب</h2>
          <p className="text-xs text-slate-500 mt-1">
            إدارة وتعديل بيانات الطلاب، العناوين، تواريخ الميلاد واستيراد الكشوفات من Excel
          </p>
        </div>

        {role === 'admin' && (
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => setIsExcelModalOpen(true)}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>استيراد من Excel</span>
            </button>

            <button
              onClick={openAddStudent}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>تسجيل طالب جديد</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، رقم الهاتف، الرقم الوطني، أو العنوان..."
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
          />
        </div>

        {/* Academic Year Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedYearId}
            onChange={(e) => setSelectedYearId(e.target.value)}
            className="w-full md:w-44 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
          >
            <option value="all">جميع السنوات الدراسية</option>
            {academicYears.map((yr) => (
              <option key={yr.id} value={yr.id}>
                {yr.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
          >
            <option value="all">كل الحالات</option>
            <option value="active">منتظم</option>
            <option value="suspended">موقوف</option>
            <option value="graduated">متخرج</option>
            <option value="withdrawn">منسحب</option>
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs min-w-180">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-4">اسم الطالب</th>
                <th className="px-6 py-4">السنة الدراسية</th>
                <th className="px-6 py-4">تاريخ الميلاد</th>
                <th className="px-6 py-4">العنوان والسكن</th>
                <th className="px-6 py-4">الهاتف / ولي الأمر</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    جاري تحميل كشف الطلاب...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    لم يتم العثور على طلاب مسجلين بالمعايير المحددة.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const currentYearName = (student.current_enrollment as any)?.academic_year?.name || 'غير محدد';
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                            {student.full_name.charAt(0)}
                          </div>
                          <div>
                            <p>{student.full_name}</p>
                            {student.national_id && (
                              <p className="text-[11px] text-slate-400 font-normal">هوية: {student.national_id}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                          {currentYearName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {student.birth_date ? (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {student.birth_date}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={student.address || ''}>
                        {student.address ? (
                          <span className="flex items-center gap-1 text-[11px]">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{student.address}</span>
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <div>
                          <p>{student.phone || '-'}</p>
                          {student.guardian_phone && (
                            <p className="text-[11px] text-slate-400 font-normal">ولي الأمر: {student.guardian_phone}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(student.status)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Transcript */}
                          <button
                            onClick={() => handleOpenTranscript(student.id)}
                            title="السجل الأكاديمي والدرجات"
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {role === 'admin' && (
                            <>
                              {/* Edit Student Button */}
                              <button
                                onClick={() => openEditStudent(student)}
                                title="تعديل بيانات الطالب"
                                className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* Delete Student Button */}
                              <button
                                onClick={() => handleDeleteStudent(student.id, student.full_name)}
                                title="حذف الطالب"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add or Edit Student */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? 'تعديل بيانات الطالب' : 'تسجيل طالب جديد في المعهد'}
        subtitle="إدخال أو تحديث البيانات الشخصية والأكاديمية للطالب"
        maxWidth="lg"
      >
        <form onSubmit={isEditModalOpen ? handleUpdateStudent : handleCreateStudent} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              اسم الطالب الثلاثي <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="مثال: عبد الرحمن بن محمد الأنصاري"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">السنة الدراسية المقيد بها <span className="text-rose-500">*</span></label>
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

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الرقم الوطني / رقم الهوية</label>
              <input
                type="text"
                value={formData.national_id}
                onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                placeholder="رقم البطاقة أو الإقامة"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Birth Date & Address Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الميلاد</label>
              <input
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">العنوان والسكن</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="المدينة - الحي - الشارع"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم هاتف الطالب</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="05XXXXXXXX"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">هاتف ولي الأمر</label>
              <input
                type="tel"
                value={formData.guardian_phone}
                onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                placeholder="رقم للتواصل"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">حالة القيد</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="active">منتظم</option>
                <option value="suspended">موقوف</option>
                <option value="graduated">متخرج</option>
                <option value="withdrawn">منسحب</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات إضافية</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="أي ملاحظات حول الطالب، مستواه، حفظه..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:bg-white resize-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {formSubmitting ? 'جاري الحفظ...' : isEditModalOpen ? 'تحديث بيانات الطالب' : 'حفظ وتسجيل الطالب'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Excel Bulk Import */}
      <Modal
        isOpen={isExcelModalOpen}
        onClose={() => {
          setIsExcelModalOpen(false);
          setExcelStudents([]);
          setExcelError(null);
        }}
        title="استيراد كشف الطلاب من ملف Excel"
        subtitle="تحميل قالب جاهز وتعبئة الطلاب وإدراجهم دفعة واحدة في السنة المحددة"
        maxWidth="2xl"
      >
        <div className="space-y-5 text-right">
          {/* Step 1: Download Template */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-900">الخطوة 1: تحميل نموذج Excel الرسمي</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                يحتوي على الأعمدة المعتمدة (اسم الطالب، الهوية، الهاتف، الميلاد، العنوان...) مع أمثلة
              </p>
            </div>
            <button
              type="button"
              onClick={downloadStudentExcelTemplate}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>تحميل النموذج (.xlsx)</span>
            </button>
          </div>

          {/* Step 2: Select Target Level and Upload File */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-900">الخطوة 2: اختيار السنة الدراسية ورفع الملف</p>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                تسكين الطلاب المستوردين في السنة الدراسية:
              </label>
              <select
                value={excelTargetYearId}
                onChange={(e) => setExcelTargetYearId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500"
              >
                {academicYears.map((yr) => (
                  <option key={yr.id} value={yr.id}>{yr.name}</option>
                ))}
              </select>
            </div>

            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-emerald-400 transition-colors bg-slate-50/50">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <label className="cursor-pointer">
                <span className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                  اضغط لاختيار ملف Excel (.xlsx أو .csv)
                </span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleExcelFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-slate-400 mt-1">يدعم ملفات إكسل بصيغة XLSX أو XLS</p>
            </div>
          </div>

          {/* Error Message */}
          {excelError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{excelError}</span>
            </div>
          )}

          {/* Step 3: Preview Table */}
          {excelStudents.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>تم التعرف على ({excelStudents.length}) طالب في الملف:</span>
                <span className="text-emerald-600 font-semibold">جاهز للاستيراد</span>
              </div>
              <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-right text-xs min-w-125">
                  <thead className="bg-slate-100 text-slate-600 sticky top-0">
                    <tr>
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">الاسم</th>
                      <th className="px-3 py-2">الهوية</th>
                      <th className="px-3 py-2">تاريخ الميلاد</th>
                      <th className="px-3 py-2">العنوان</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {excelStudents.map((st, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-1.5 text-slate-400 text-[11px]">{i + 1}</td>
                        <td className="px-3 py-1.5 font-bold text-slate-900">{st.full_name}</td>
                        <td className="px-3 py-1.5 text-slate-600">{st.national_id || '-'}</td>
                        <td className="px-3 py-1.5 text-slate-600">{st.birth_date || '-'}</td>
                        <td className="px-3 py-1.5 text-slate-600">{st.address || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsExcelModalOpen(false);
                setExcelStudents([]);
              }}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleExecuteExcelImport}
              disabled={excelStudents.length === 0 || excelImporting}
              className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{excelImporting ? 'جاري الاستيراد...' : `استيراد (${excelStudents.length}) طالب الآن`}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Student Academic Transcript & Historical Grades */}
      <Modal
        isOpen={isTranscriptModalOpen}
        onClose={() => setIsTranscriptModalOpen(false)}
        title={`السجل الأكاديمي: ${transcriptData?.full_name || ''}`}
        subtitle="الأرشيف الأكاديمي والدرجات لجميع السنوات التي درسها الطالب"
        maxWidth="2xl"
      >
        {transcriptLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">جاري جلب السجل الأكاديمي...</div>
        ) : transcriptData ? (
          <div className="space-y-6">
            {/* Student Basic info */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">رقم الهاتف</span>
                <span className="font-bold text-slate-800">{transcriptData.phone || 'غير مسجل'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">تاريخ الميلاد</span>
                <span className="font-bold text-slate-800">{transcriptData.birth_date || 'غير مسجل'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">العنوان والسكن</span>
                <span className="font-bold text-slate-800">{transcriptData.address || 'غير مسجل'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">الحالة الأكاديمية</span>
                <span className="font-bold">{getStatusBadge(transcriptData.status)}</span>
              </div>
              {transcriptData.notes && (
                <div className="col-span-2 text-slate-500">
                  <span className="text-slate-400 block text-[11px]">ملاحظات:</span>{transcriptData.notes}
                </div>
              )}
            </div>

            {/* Enrollments & Grades history */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
                سجل السنوات الدراسية والدرجات المرصودة:
              </h4>

              {(!transcriptData.enrollments || transcriptData.enrollments.length === 0) ? (
                <p className="text-xs text-slate-400 py-4 text-center">لا توجد سنوات سابقة مسجلة لهذا الطالب.</p>
              ) : (
                transcriptData.enrollments.map((enr: any) => (
                  <div key={enr.id} className="p-4 bg-white rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-xs text-slate-900">{enr.academic_year?.name}</span>
                        <span className="text-xs text-slate-500">({enr.school_year?.name})</span>
                      </div>
                      <Badge variant={enr.status === 'promoted' ? 'purple' : enr.status === 'passed' ? 'emerald' : 'slate'}>
                        {enr.status === 'promoted' ? 'تم الترفيع للسنة التالية' : enr.status === 'passed' ? 'ناجح' : 'قيد الدراسة'}
                      </Badge>
                    </div>

                    {/* Grades Table */}
                    {(!enr.grades || enr.grades.length === 0) ? (
                      <p className="text-[11px] text-slate-400">لم ترصد علامات لهذه السنة بعد.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {enr.grades.map((g: any) => (
                          <div key={g.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                            <p className="font-bold text-slate-800 truncate">{g.subject?.name}</p>
                            <div className="flex items-center justify-between mt-1 text-[11px]">
                              <span className="text-slate-400">الدرجة:</span>
                              <span className={`font-bold ${Number(g.score) >= Number(g.subject?.passing_score || 50) ? 'text-emerald-700' : 'text-rose-600'}`}>
                                {g.score} / {g.subject?.max_score}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
