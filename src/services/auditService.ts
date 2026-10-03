import { supabase } from '../lib/supabase';
import type { AuditLog } from '../types';

export const auditService = {
  // تسجيل حركة / عملية جديدة
  async logAction(params: {
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PROMOTION' | 'GRADING' | 'IMPORT';
    tableName: string;
    recordId?: string;
    details?: any;
    userEmail?: string;
    userRole?: string;
  }): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('audit_logs').insert([{
        user_id: user?.id || null,
        user_email: params.userEmail || user?.email || 'مستخدم النظام',
        user_role: params.userRole || 'admin',
        action: params.action,
        table_name: params.tableName,
        record_id: params.recordId || null,
        details: params.details || null
      }]);
    } catch (err) {
      console.warn('Could not record audit log:', err);
    }
  },

  // استرجاع سجل العمليات الأخيرة
  async getRecentLogs(limit = 50): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }

    return data || [];
  }
};
