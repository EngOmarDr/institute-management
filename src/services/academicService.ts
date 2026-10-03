import { supabase } from '../lib/supabase';
import type { AcademicYear, SchoolYear, Subject } from '../types';

export const academicService = {
  // --- السنوات والمستويات الدراسية ---
  async getAcademicYears(): Promise<AcademicYear[]> {
    const { data, error } = await supabase
      .from('academic_years')
      .select('*')
      .order('sequence_order', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async createAcademicYear(year: Omit<AcademicYear, 'id' | 'created_at'>): Promise<AcademicYear> {
    const { data, error } = await supabase
      .from('academic_years')
      .insert([year])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateAcademicYear(id: string, updates: Partial<AcademicYear>): Promise<AcademicYear> {
    const { data, error } = await supabase
      .from('academic_years')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteAcademicYear(id: string): Promise<void> {
    const { error } = await supabase
      .from('academic_years')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // --- الأعوام الدراسية التقويمية ---
  async getSchoolYears(): Promise<SchoolYear[]> {
    const { data, error } = await supabase
      .from('school_years')
      .select('*')
      .order('is_current', { ascending: false })
      .order('name', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getCurrentSchoolYear(): Promise<SchoolYear | null> {
    const { data, error } = await supabase
      .from('school_years')
      .select('*')
      .eq('is_current', true)
      .limit(1)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  async createSchoolYear(year: Omit<SchoolYear, 'id' | 'created_at'>): Promise<SchoolYear> {
    if (year.is_current) {
      // Unset previous current years
      await supabase.from('school_years').update({ is_current: false }).eq('is_current', true);
    }
    const { data, error } = await supabase
      .from('school_years')
      .insert([year])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateSchoolYear(id: string, updates: Partial<SchoolYear>): Promise<SchoolYear> {
    if (updates.is_current) {
      await supabase.from('school_years').update({ is_current: false }).eq('is_current', true);
    }
    const { data, error } = await supabase
      .from('school_years')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteSchoolYear(id: string): Promise<void> {
    const { error } = await supabase
      .from('school_years')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // --- المواد الدراسية ---
  async getSubjects(academicYearId?: string): Promise<Subject[]> {
    let query = supabase
      .from('subjects')
      .select('*, academic_year:academic_years(*)');
    
    if (academicYearId) {
      query = query.eq('academic_year_id', academicYearId);
    }

    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createSubject(subject: Omit<Subject, 'id' | 'created_at' | 'academic_year'>): Promise<Subject> {
    const { data, error } = await supabase
      .from('subjects')
      .insert([subject])
      .select('*, academic_year:academic_years(*)')
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateSubject(id: string, updates: Partial<Subject>): Promise<Subject> {
    const { data, error } = await supabase
      .from('subjects')
      .update(updates)
      .eq('id', id)
      .select('*, academic_year:academic_years(*)')
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteSubject(id: string): Promise<void> {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
