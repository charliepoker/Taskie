import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ThemeSettings {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  compactMode: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  email: boolean;
  push: boolean;
  taskAssigned: boolean;
  taskCompleted: boolean;
  taskOverdue: boolean;
  projectInvited: boolean;
  commentMentioned: boolean;
  dailyDigest: boolean;
  weeklyReport: boolean;
}

export interface DisplaySettings {
  language: string;
  timezone: string;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  showAvatars: boolean;
  showRelativeDates: boolean;
  animationsEnabled: boolean;
}

export interface WorkflowSettings {
  defaultTaskStatus: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  defaultTaskPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  autoAssignTasks: boolean;
  requireTaskDescription: boolean;
  enableTaskTemplates: boolean;
  showTaskNumbers: boolean;
  enableTimeTracking: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'team' | 'private';
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  allowDirectMessages: boolean;
  shareAnalytics: boolean;
}

export interface Settings {
  theme: ThemeSettings;
  notifications: NotificationSettings;
  display: DisplaySettings;
  workflow: WorkflowSettings;
  privacy: PrivacySettings;
}

export interface SettingsState {
  settings: Settings;

  // Actions
  updateThemeSettings: (updates: Partial<ThemeSettings>) => void;
  updateNotificationSettings: (updates: Partial<NotificationSettings>) => void;
  updateDisplaySettings: (updates: Partial<DisplaySettings>) => void;
  updateWorkflowSettings: (updates: Partial<WorkflowSettings>) => void;
  updatePrivacySettings: (updates: Partial<PrivacySettings>) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => boolean;
}

const defaultSettings: Settings = {
  theme: {
    mode: 'system',
    primaryColor: '#0D65F2',
    borderRadius: 'medium',
    compactMode: false,
  },
  notifications: {
    enabled: true,
    email: true,
    push: true,
    taskAssigned: true,
    taskCompleted: true,
    taskOverdue: true,
    projectInvited: true,
    commentMentioned: true,
    dailyDigest: false,
    weeklyReport: true,
  },
  display: {
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    firstDayOfWeek: 0,
    showAvatars: true,
    showRelativeDates: true,
    animationsEnabled: true,
  },
  workflow: {
    defaultTaskStatus: 'TODO',
    defaultTaskPriority: 'MEDIUM',
    autoAssignTasks: false,
    requireTaskDescription: false,
    enableTaskTemplates: true,
    showTaskNumbers: true,
    enableTimeTracking: false,
  },
  privacy: {
    profileVisibility: 'team',
    showOnlineStatus: true,
    showLastSeen: true,
    allowDirectMessages: true,
    shareAnalytics: true,
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,

      updateThemeSettings: updates => {
        set(state => ({
          settings: {
            ...state.settings,
            theme: { ...state.settings.theme, ...updates },
          },
        }));
      },

      updateNotificationSettings: updates => {
        set(state => ({
          settings: {
            ...state.settings,
            notifications: { ...state.settings.notifications, ...updates },
          },
        }));
      },

      updateDisplaySettings: updates => {
        set(state => ({
          settings: {
            ...state.settings,
            display: { ...state.settings.display, ...updates },
          },
        }));
      },

      updateWorkflowSettings: updates => {
        set(state => ({
          settings: {
            ...state.settings,
            workflow: { ...state.settings.workflow, ...updates },
          },
        }));
      },

      updatePrivacySettings: updates => {
        set(state => ({
          settings: {
            ...state.settings,
            privacy: { ...state.settings.privacy, ...updates },
          },
        }));
      },

      resetSettings: () => {
        set({ settings: defaultSettings });
      },

      exportSettings: () => {
        return JSON.stringify(get().settings, null, 2);
      },

      importSettings: settingsJson => {
        try {
          const importedSettings = JSON.parse(settingsJson);

          // Validate the structure (basic validation)
          if (
            typeof importedSettings === 'object' &&
            importedSettings.theme &&
            importedSettings.notifications &&
            importedSettings.display &&
            importedSettings.workflow &&
            importedSettings.privacy
          ) {
            set({ settings: { ...defaultSettings, ...importedSettings } });
            return true;
          }

          return false;
        } catch (error) {
          console.error('Failed to import settings:', error);
          return false;
        }
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Handle settings migration if needed
        if (version === 0) {
          // Migrate from version 0 to 1
          return { ...defaultSettings, ...persistedState };
        }
        return persistedState;
      },
    }
  )
);
