import React, { createContext, useContext, useState, useEffect } from 'react';
import type { InstituteSettings } from '../types';
import { settingsService, defaultSettings } from '../services/settingsService';

interface SettingsContextType {
  settings: InstituteSettings;
  updateSettings: (payload: Partial<Omit<InstituteSettings, 'id' | 'created_at' | 'updated_at'>>, userEmail?: string, userRole?: string) => Promise<void>;
  refreshSettings: () => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<InstituteSettings>(defaultSettings);
  const [loading, setLoading] = useState<boolean>(true);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleUpdate = async (
    payload: Partial<Omit<InstituteSettings, 'id' | 'created_at' | 'updated_at'>>,
    userEmail?: string,
    userRole?: string
  ) => {
    const updated = await settingsService.updateSettings(payload, userEmail, userRole);
    setSettings(updated);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings: handleUpdate,
        refreshSettings: loadSettings,
        loading
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
