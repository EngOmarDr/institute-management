import * as XLSX from 'xlsx';

export interface ExcelStudentRow {
  full_name: string;
  national_id?: string | null;
  phone?: string | null;
  guardian_phone?: string | null;
  birth_date?: string | null;
  address?: string | null;
  notes?: string | null;
}

export function downloadStudentExcelTemplate() {
  const sampleData = [
    {
      'اسم الطالب': 'عبد الله بن أحمد القحطاني',
      'الرقم الوطني': '1098765432',
      'رقم الهاتف': '0501234567',
      'هاتف ولي الأمر': '0559876543',
      'تاريخ الميلاد': '2005-04-15',
      'العنوان': 'الرياض - حي الملز',
      'ملاحظات': 'حافظ لـ 15 جزءاً من القرآن'
    },
    {
      'اسم الطالب': 'محمد بن يوسف الشامي',
      'الرقم الوطني': '1087654321',
      'رقم الهاتف': '0543219876',
      'هاتف ولي الأمر': '0561239874',
      'تاريخ الميلاد': '2006-08-20',
      'العنوان': 'جدة - حي الصفا',
      'ملاحظات': 'طالب متميز في علم التجويد'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  // Adjust column widths
  worksheet['!cols'] = [
    { wch: 28 }, // اسم الطالب
    { wch: 16 }, // الرقم الوطني
    { wch: 15 }, // رقم الهاتف
    { wch: 15 }, // هاتف ولي الأمر
    { wch: 15 }, // تاريخ الميلاد
    { wch: 25 }, // العنوان
    { wch: 30 }, // ملاحظات
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'الطلاب');
  XLSX.writeFile(workbook, 'نموذج_استيراد_الطلاب.xlsx');
}

export async function parseStudentsExcelFile(file: File): Promise<ExcelStudentRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const students: ExcelStudentRow[] = json.map(row => {
          // Normalize possible column headers
          const fullName = row['اسم الطالب'] || row['الاسم'] || row['full_name'] || row['Name'] || '';
          const nationalId = row['الرقم الوطني'] || row['رقم الهوية'] || row['الهوية'] || row['national_id'] || null;
          const phone = row['رقم الهاتف'] || row['الهاتف'] || row['phone'] || null;
          const guardianPhone = row['هاتف ولي الأمر'] || row['ولي الأمر'] || row['guardian_phone'] || null;
          const birthDate = row['تاريخ الميلاد'] || row['birth_date'] || null;
          const address = row['العنوان'] || row['السكن'] || row['address'] || null;
          const notes = row['ملاحظات'] || row['notes'] || null;

          return {
            full_name: String(fullName).trim(),
            national_id: nationalId ? String(nationalId).trim() : null,
            phone: phone ? String(phone).trim() : null,
            guardian_phone: guardianPhone ? String(guardianPhone).trim() : null,
            birth_date: birthDate ? String(birthDate).trim() : null,
            address: address ? String(address).trim() : null,
            notes: notes ? String(notes).trim() : null,
          };
        }).filter(s => s.full_name.length > 0);

        resolve(students);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
