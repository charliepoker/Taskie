import { renderHook, act } from '@testing-library/react';
import { useUIStore } from '../uiStore';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('UIStore', () => {
  beforeEach(() => {
    // Clear all mocks and reset store
    jest.clearAllMocks();
    useUIStore.setState({
      modals: {
        createTaskModal: false,
        editTaskModal: { open: false },
        taskDetailsModal: { open: false },
        createProjectModal: false,
        editProjectModal: { open: false },
        projectMembersModal: { open: false },
        userProfileModal: { open: false },
        editUserModal: { open: false },
        confirmationModal: { open: false },
      },
      taskFilters: {},
      projectFilters: {},
      userFilters: {},
    });
  });

  describe('Modal Management', () => {
    it('should open and close simple modals', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.openModal('createTaskModal');
      });

      expect(result.current.modals.createTaskModal).toBe(true);

      act(() => {
        result.current.closeModal('createTaskModal');
      });

      expect(result.current.modals.createTaskModal).toBe(false);
    });

    it('should open and close complex modals with data', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.openModal('editTaskModal', { taskId: '123' });
      });

      expect(result.current.modals.editTaskModal).toEqual({
        open: true,
        taskId: '123',
      });

      act(() => {
        result.current.closeModal('editTaskModal');
      });

      expect(result.current.modals.editTaskModal.open).toBe(false);
    });

    it('should close all modals', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.openModal('createTaskModal');
        result.current.openModal('createProjectModal');
        result.current.openModal('editTaskModal', { taskId: '123' });
      });

      act(() => {
        result.current.closeAllModals();
      });

      expect(result.current.modals.createTaskModal).toBe(false);
      expect(result.current.modals.createProjectModal).toBe(false);
      expect(result.current.modals.editTaskModal.open).toBe(false);
    });
  });

  describe('Filter Management', () => {
    it('should set and clear task filters', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setTaskFilters({
          status: ['TODO', 'IN_PROGRESS'],
          priority: ['HIGH'],
          search: 'test',
        });
      });

      expect(result.current.taskFilters).toEqual({
        status: ['TODO', 'IN_PROGRESS'],
        priority: ['HIGH'],
        search: 'test',
      });

      act(() => {
        result.current.clearTaskFilters();
      });

      expect(result.current.taskFilters).toEqual({});
    });

    it('should merge task filters', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setTaskFilters({ status: ['TODO'] });
      });

      act(() => {
        result.current.setTaskFilters({ priority: ['HIGH'] });
      });

      expect(result.current.taskFilters).toEqual({
        status: ['TODO'],
        priority: ['HIGH'],
      });
    });

    it('should set and clear project filters', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setProjectFilters({
          search: 'project',
          ownerId: 'user123',
        });
      });

      expect(result.current.projectFilters).toEqual({
        search: 'project',
        ownerId: 'user123',
      });

      act(() => {
        result.current.clearProjectFilters();
      });

      expect(result.current.projectFilters).toEqual({});
    });
  });

  describe('Preferences Management', () => {
    it('should set individual preferences', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setPreference('theme', 'dark');
      });

      expect(result.current.preferences.theme).toBe('dark');

      act(() => {
        result.current.setPreference('sidebarCollapsed', true);
      });

      expect(result.current.preferences.sidebarCollapsed).toBe(true);
      expect(result.current.preferences.theme).toBe('dark'); // Should remain unchanged
    });

    it('should reset preferences to defaults', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setPreference('theme', 'dark');
        result.current.setPreference('sidebarCollapsed', true);
      });

      act(() => {
        result.current.resetPreferences();
      });

      expect(result.current.preferences.theme).toBe('system');
      expect(result.current.preferences.sidebarCollapsed).toBe(false);
    });
  });

  describe('Loading State Management', () => {
    it('should set loading states', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setLoading('tasks', true);
      });

      expect(result.current.loading.tasks).toBe(true);
      expect(result.current.loading.projects).toBe(false); // Should remain unchanged

      act(() => {
        result.current.setLoading('tasks', false);
      });

      expect(result.current.loading.tasks).toBe(false);
    });
  });
});
