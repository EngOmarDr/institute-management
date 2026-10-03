import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserRole, SchoolYear, Profile } from '../types';
import { supabase } from '../lib/supabase';
import { academicService } from '../services/academicService';
import { auditService } from '../services/auditService';

interface AuthContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isAdmin: boolean;
  isSponsor: boolean;
  userEmail: string | null;
  userProfile: Profile | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  activeSchoolYear: SchoolYear | null;
  setActiveSchoolYear: (year: SchoolYear | null) => void;
  schoolYears: SchoolYear[];
  refreshSchoolYears: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('admin');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [activeSchoolYear, setActiveSchoolYear] = useState<SchoolYear | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileForUser = async (userId: string, email: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        setUserProfile(profile);
        setRole(profile.role);
      } else {
        setRole('admin');
      }
      setUserEmail(email);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const fetchSchoolYears = async () => {
    try {
      const years = await academicService.getSchoolYears();
      setSchoolYears(years);
      const current = years.find(y => y.is_current) || years[0] || null;
      setActiveSchoolYear(current);
    } catch (err) {
      console.error('Error fetching school years:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        setLoading(true);
        // 1. Check existing session on load
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id && session.user.email) {
          await fetchProfileForUser(session.user.id, session.user.email);
        } else {
          if (isMounted) {
            setIsAuthenticated(false);
            setUserEmail(null);
            setUserProfile(null);
          }
        }
        // 2. Fetch school years
        await fetchSchoolYears();
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen to subsequent auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return;
      if (session?.user?.id && session.user.email) {
        await fetchProfileForUser(session.user.id, session.user.email);
      } else {
        if (isMounted) {
          setIsAuthenticated(false);
          setUserEmail(null);
          setUserProfile(null);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    // Real Supabase Authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });

    if (error || !data.user) {
      throw new Error(error?.message || 'بيانات الدخول غير صحيحة، يرجى التأكد من البريد وكلمة المرور.');
    }

    // Fetch user profile and role
    await fetchProfileForUser(data.user.id, data.user.email!);

    // Record audit log
    await auditService.logAction({
      action: 'CREATE',
      tableName: 'auth',
      details: { event: 'USER_LOGIN', email: data.user.email },
      userEmail: data.user.email!,
      userRole: role
    });
  };

  const logout = async () => {
    const currentEmail = userEmail;
    const currentRole = role;

    await supabase.auth.signOut();

    setIsAuthenticated(false);
    setUserEmail(null);
    setUserProfile(null);

    if (currentEmail) {
      await auditService.logAction({
        action: 'UPDATE',
        tableName: 'auth',
        details: { event: 'USER_LOGOUT', email: currentEmail },
        userEmail: currentEmail,
        userRole: currentRole
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        setRole,
        isAdmin: role === 'admin',
        isSponsor: role === 'sponsor',
        userEmail,
        userProfile,
        isAuthenticated,
        login,
        logout,
        activeSchoolYear,
        setActiveSchoolYear,
        schoolYears,
        refreshSchoolYears: fetchSchoolYears,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
