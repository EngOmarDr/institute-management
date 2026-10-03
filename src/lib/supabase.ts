import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials are missing or incomplete in environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function checkSupabaseConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    const { error } = await supabase.from('academic_years').select('id').limit(1);
    if (error) {
      return { connected: false, message: error.message };
    }
    return { connected: true, message: 'متصل بنجاح بقاعدة بيانات Supabase' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'خطأ غير معروف في الاتصال';
    return { connected: false, message: errorMsg };
  }
}
