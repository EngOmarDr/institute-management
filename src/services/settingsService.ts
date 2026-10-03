import { supabase } from '../lib/supabase';
import type { InstituteSettings } from '../types';
import { auditService } from './auditService';

export const defaultSettings: InstituteSettings = {
  id: 'default_settings',
  name: 'نظام إدارة المعاهد التعليمية',
  logo_url: null,
  phone: '',
  email: '',
  address: '',
  report_header: 'إدارة الشؤون الأكاديمية والتعليمية',
  report_footer: 'المشرف الأكاديمي والتعليمي'
};

export const settingsService = {
  async getSettings(): Promise<InstituteSettings> {
    try {
      const { data, error } = await supabase
        .from('institute_settings')
        .select('*')
        .eq('id', 'default_settings')
        .maybeSingle();

      if (error) {
        console.error('Error fetching institute settings:', error);
        return defaultSettings;
      }

      if (!data) {
        // Create initial default settings
        await supabase
          .from('institute_settings')
          .insert(defaultSettings);
        return defaultSettings;
      }

      return data;
    } catch (err) {
      console.error('Settings service error:', err);
      return defaultSettings;
    }
  },

  async updateSettings(
    payload: Partial<Omit<InstituteSettings, 'id' | 'created_at' | 'updated_at'>>,
    userEmail?: string,
    userRole?: string
  ): Promise<InstituteSettings> {
    const updateData = {
      ...payload,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('institute_settings')
      .update(updateData)
      .eq('id', 'default_settings')
      .select()
      .single();

    if (error) throw error;

    if (userEmail) {
      await auditService.logAction({
        action: 'UPDATE',
        tableName: 'institute_settings',
        recordId: 'default_settings',
        details: payload,
        userEmail,
        userRole
      });
    }

    return data;
  }
};
