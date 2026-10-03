import { supabase } from '../lib/supabase';
import type { Sponsor, SponsorshipContribution } from '../types';

export const sponsorsService = {
  // جلب قائمة الكفلاء مع إجمالي تبرعاتهم
  async getSponsors(): Promise<(Sponsor & { contributions: SponsorshipContribution[] })[]> {
    const { data, error } = await supabase
      .from('sponsors')
      .select(`
        *,
        contributions:sponsorship_contributions (
          id,
          amount,
          currency,
          contribution_date,
          description,
          school_year:school_years (id, name)
        )
      `)
      .order('name', { ascending: true });

    if (error) throw error;

    return (data || []).map((s: any) => {
      const contributions: SponsorshipContribution[] = s.contributions || [];
      const total = contributions.reduce((sum, c) => sum + Number(c.amount || 0), 0);
      return {
        ...s,
        contributions,
        contributions_total: total
      };
    });
  },

  async createSponsor(sponsor: Omit<Sponsor, 'id' | 'created_at' | 'contributions_total'>): Promise<Sponsor> {
    const { data, error } = await supabase
      .from('sponsors')
      .insert([sponsor])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async addContribution(contribution: Omit<SponsorshipContribution, 'id' | 'created_at' | 'sponsor' | 'school_year'>): Promise<SponsorshipContribution> {
    const { data, error } = await supabase
      .from('sponsorship_contributions')
      .insert([contribution])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteSponsor(id: string): Promise<void> {
    const { error } = await supabase
      .from('sponsors')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
