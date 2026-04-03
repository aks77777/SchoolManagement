import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type NotificationPriority = 'info' | 'warning' | 'urgent' | 'academic' | 'security' | 'announcement';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  targetRole: 'all' | 'student' | 'teacher';
  createdAt: string;
}

export interface AdminSettings {
  // Platform
  institutionName: string;
  maintenanceMode: boolean;
  activeTerm: string;
  globalNotificationsEnabled: boolean;
  
  // User Access & Workflow
  studentAssignmentsVisible: boolean;
  teacherAttendanceAlerts: boolean;
  reportsVisible: boolean;
  
  // Accessibility
  highContrastMode: boolean;
  largerTextMode: boolean;
  reducedMotion: boolean;
  colorSafeChartMode: boolean;
  
  // Security
  enforce2FA: boolean;
  emergencyLockdown: boolean;
}

const defaultSettings: AdminSettings = {
  institutionName: 'AK Group School',
  maintenanceMode: false,
  activeTerm: 'Fall 2026',
  globalNotificationsEnabled: true,
  
  studentAssignmentsVisible: true,
  teacherAttendanceAlerts: false,
  reportsVisible: true,
  
  highContrastMode: false,
  largerTextMode: false,
  reducedMotion: false,
  colorSafeChartMode: false,
  
  enforce2FA: false,
  emergencyLockdown: false,
};

interface AdminSettingsContextType {
  settings: AdminSettings;
  updateSetting: <K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) => void;
  notifications: AppNotification[];
  sendNotification: (notification: Omit<AppNotification, 'id' | 'createdAt'>) => void;
  dismissNotification: (id: string) => void;
}

const AdminSettingsContext = createContext<AdminSettingsContextType | undefined>(undefined);

export function AdminSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AdminSettings>(() => {
    const saved = localStorage.getItem('admin_settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('admin_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  // Apply accessibility classes to HTML root
  useEffect(() => {
    const root = document.documentElement;
    if (settings.highContrastMode) root.classList.add('theme-high-contrast');
    else root.classList.remove('theme-high-contrast');

    if (settings.largerTextMode) root.classList.add('theme-larger-text');
    else root.classList.remove('theme-larger-text');

    if (settings.reducedMotion) root.classList.add('theme-reduced-motion');
    else root.classList.remove('theme-reduced-motion');
  }, [settings.highContrastMode, settings.largerTextMode, settings.reducedMotion]);

  useEffect(() => {
    localStorage.setItem('admin_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('admin_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const updateSetting = <K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const sendNotification = (notification: Omit<AppNotification, 'id' | 'createdAt'>) => {
    if (!settings.globalNotificationsEnabled) return;
    const newNotif: AppNotification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <AdminSettingsContext.Provider value={{
      settings,
      updateSetting,
      notifications,
      sendNotification,
      dismissNotification
    }}>
      {children}
    </AdminSettingsContext.Provider>
  );
}

export function useAdminSettings() {
  const context = useContext(AdminSettingsContext);
  if (context === undefined) {
    throw new Error('useAdminSettings must be used within an AdminSettingsProvider');
  }
  return context;
}
