import { supabase } from '../lib/supabase';
import type { Profile, UserRole } from '../types';

export const usersService = {
  // جلب جميع حسابات المستخدمين
  async getUsers(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // إنشاء حساب مستخدم جديد
  async createUser(payload: {
    email: string;
    password: string;
    full_name: string;
    role: UserRole;
    phone?: string;
    sponsor_id?: string;
  }): Promise<string> {
    const { data, error } = await supabase.rpc('create_user_account', {
      p_email: payload.email.trim(),
      p_password: payload.password,
      p_full_name: payload.full_name.trim(),
      p_role: payload.role,
      p_phone: payload.phone?.trim() || null,
      p_sponsor_id: payload.sponsor_id || null
    });

    if (error) throw error;
    return data;
  },

  // حذف حساب مستخدم
  async deleteUser(userId: string): Promise<void> {
    const { error } = await supabase.rpc('delete_user_account', {
      p_user_id: userId
    });

    if (error) throw error;
  }
};
