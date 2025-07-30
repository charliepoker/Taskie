import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface TaskFilters {
  status?: string[];
  priority?: string[];
  assigneeId?: string[];
  projectId?: string[];
  search?: string;
  dueDate?: {
    start?: string;
    end?: string;
  };
}

export interface ProjectFilters {
  search?: string;
  ownerId?: string;
  memberCount?: {
    min?: number;
    max?: number;
  };
}

export interface UserFilters {
  search?: string;
  sortBy?: 'createdAt' | 'firstName' | 'lastName' | 'email';
  sortOrder?: 'asc' | 'desc';
}

export interface ModalState {
  // Task modals
  createTaskModal: boolean;
  editTaskModal: { open: boolean; taskId?: string };
  taskDetailsModal: { open: boolean; taskId?: string };

  // Project modals
  createProjectModal: boolean;
  editProjectModal: { open: boolean; projectId?: string };
  projectMembersModal: { open: boolean; projectId?: string };

  // User modals
  userProfileModal: { open: boolean; userId?: string };
  editUserModal: { open: boolean; userId?: string };

  // Confirmation modals
  confirmationModal: {
    open: boolean;
    title?: string;
    message?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'info' | 'warning' | 'error' | 'success';
  };
}

export interface UIPreferences {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  tablePageSize: number;
  defaultTaskView: 'list' | 'board' | 'calendar';
  showCompletedTasks: boolean;
  enableNotifications: boolean;
  language: string;
}

export interface UIState {
  // Modal state
  modals: ModalState;

  // Filter state
  taskFilters: TaskFilters;
  projectFilters: ProjectFilters;
  userFilters: UserFilters;

  // UI preferences
  preferences: UIPreferences;

  // Loading states
  loading: {
    global: boolean;
    tasks: boolean;
    projects: boolean;
    users: boolean;
    analytics: boolean;
  };

  // Actions
  // Modal actions
  openModal: (modalKey: keyof ModalState, data?: any) => void;
  closeModal: (modalKey: keyof ModalState) => void;
  closeAllModals: () => void;

  // Filter actions
  setTaskFilters: (filters: Partial<TaskFilters>) => void;
  clearTaskFilters: () => void;
  setProjectFilters: (filters: Partial<ProjectFilters>) => void;
  clearProjectFilters: () => void;
  setUserFilters: (filters: Partial<UserFilters>) => void;
  clearUserFilters: () => void;

  // Preference actions
  setPreference: <K extends keyof UIPreferences>(
    key: K,
    value: UIPreferences[K]
  ) => void;
  resetPreferences: () => void;

  // Loading actions
  setLoading: (key: keyof UIState['loading'], value: boolean) => void;
}

const defaultModalState: ModalState = {
  createTaskModal: false,
  editTaskModal: { open: false },
  taskDetailsModal: { open: false },
  createProjectModal: false,
  editProjectModal: { open: false },
  projectMembersModal: { open: false },
  userProfileModal: { open: false },
  editUserModal: { open: false },
  confirmationModal: { open: false },
};

const defaultPreferences: UIPreferences = {
  theme: 'system',
  sidebarCollapsed: false,
  tablePageSize: 20,
  defaultTaskView: 'list',
  showCompletedTasks: true,
  enableNotifications: true,
  language: 'en',
};

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      modals: defaultModalState,
      taskFilters: {},
      projectFilters: {},
      userFilters: {},
      preferences: defaultPreferences,
      loading: {
        global: false,
        tasks: false,
        projects: false,
        users: false,
        analytics: false,
      },

      // Modal actions
      openModal: (modalKey, data) => {
        set(state => ({
          modals: {
            ...state.modals,
            [modalKey]:
              typeof data === 'object' ? { open: true, ...data } : true,
          },
        }));
      },

      closeModal: modalKey => {
        set(state => ({
          modals: {
            ...state.modals,
            [modalKey]:
              typeof state.modals[modalKey] === 'object'
                ? { ...state.modals[modalKey], open: false }
                : false,
          },
        }));
      },

      closeAllModals: () => {
        set({ modals: defaultModalState });
      },

      // Filter actions
      setTaskFilters: filters => {
        set(state => ({
          taskFilters: { ...state.taskFilters, ...filters },
        }));
      },

      clearTaskFilters: () => {
        set({ taskFilters: {} });
      },

      setProjectFilters: filters => {
        set(state => ({
          projectFilters: { ...state.projectFilters, ...filters },
        }));
      },

      clearProjectFilters: () => {
        set({ projectFilters: {} });
      },

      setUserFilters: filters => {
        set(state => ({
          userFilters: { ...state.userFilters, ...filters },
        }));
      },

      clearUserFilters: () => {
        set({ userFilters: {} });
      },

      // Preference actions
      setPreference: (key, value) => {
        set(state => ({
          preferences: { ...state.preferences, [key]: value },
        }));
      },

      resetPreferences: () => {
        set({ preferences: defaultPreferences });
      },

      // Loading actions
      setLoading: (key, value) => {
        set(state => ({
          loading: { ...state.loading, [key]: value },
        }));
      },
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist preferences and some filter state
      partialize: state => ({
        preferences: state.preferences,
        taskFilters: {
          // Persist some filter preferences but not search
          status: state.taskFilters.status,
          priority: state.taskFilters.priority,
        },
      }),
    }
  )
);
