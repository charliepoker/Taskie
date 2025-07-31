import { act, renderHook } from '@testing-library/react';
import { useAuthStore, User } from '../authStore';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('authStore', () => {
  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    avatar: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.accessToken).toBeNull();
      expect(result.current.refreshToken).toBeNull();
    });
  });

  describe('setUser', () => {
    it('should set user and update authentication status', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should clear user and update authentication status when setting null', () => {
      const { result } = renderHook(() => useAuthStore());

      // First set a user
      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then clear the user
      act(() => {
        result.current.setUser(null);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('setTokens', () => {
    it('should set tokens and update authentication status', () => {
      const { result } = renderHook(() => useAuthStore());
      const accessToken = 'access-token-123';
      const refreshToken = 'refresh-token-456';

      act(() => {
        result.current.setTokens(accessToken, refreshToken);
      });

      expect(result.current.accessToken).toBe(accessToken);
      expect(result.current.refreshToken).toBe(refreshToken);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('clearAuth', () => {
    it('should clear all authentication data', () => {
      const { result } = renderHook(() => useAuthStore());

      // First set some auth data
      act(() => {
        result.current.setUser(mockUser);
        result.current.setTokens('access-token', 'refresh-token');
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then clear auth
      act(() => {
        result.current.clearAuth();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.accessToken).toBeNull();
      expect(result.current.refreshToken).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user data when user exists', () => {
      const { result } = renderHook(() => useAuthStore());

      // First set a user
      act(() => {
        result.current.setUser(mockUser);
      });

      const updates = {
        firstName: 'Updated',
        lastName: 'Name',
        avatar: 'new-avatar.jpg',
      };

      act(() => {
        result.current.updateUser(updates);
      });

      expect(result.current.user).toEqual({
        ...mockUser,
        ...updates,
        updatedAt: expect.any(String),
      });

      // Check that updatedAt was actually updated
      expect(result.current.user?.updatedAt).not.toBe(mockUser.updatedAt);
    });

    it('should not update when no user exists', () => {
      const { result } = renderHook(() => useAuthStore());

      const updates = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      act(() => {
        result.current.updateUser(updates);
      });

      expect(result.current.user).toBeNull();
    });

    it('should preserve existing user data when updating', () => {
      const { result } = renderHook(() => useAuthStore());

      // First set a user
      act(() => {
        result.current.setUser(mockUser);
      });

      const updates = {
        firstName: 'Updated',
      };

      act(() => {
        result.current.updateUser(updates);
      });

      expect(result.current.user).toEqual({
        ...mockUser,
        firstName: 'Updated',
        updatedAt: expect.any(String),
      });

      // Ensure other fields are preserved
      expect(result.current.user?.email).toBe(mockUser.email);
      expect(result.current.user?.username).toBe(mockUser.username);
      expect(result.current.user?.lastName).toBe(mockUser.lastName);
    });
  });

  describe('persistence', () => {
    it('should persist state to localStorage', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
        result.current.setTokens('access-token', 'refresh-token');
      });

      // The persist middleware should have called localStorage.setItem
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should only persist specified fields', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
        result.current.setTokens('access-token', 'refresh-token');
      });

      // Check that setItem was called with the correct structure
      const setItemCalls = mockLocalStorage.setItem.mock.calls;
      const lastCall = setItemCalls[setItemCalls.length - 1];

      if (lastCall) {
        const [key, value] = lastCall;
        expect(key).toBe('auth-storage');

        const parsedValue = JSON.parse(value);
        expect(parsedValue.state).toHaveProperty('user');
        expect(parsedValue.state).toHaveProperty('isAuthenticated');
        expect(parsedValue.state).toHaveProperty('accessToken');
        expect(parsedValue.state).toHaveProperty('refreshToken');
      }
    });
  });

  describe('store selectors', () => {
    it('should allow selecting specific parts of state', () => {
      const { result: userResult } = renderHook(() =>
        useAuthStore(state => state.user)
      );
      const { result: isAuthResult } = renderHook(() =>
        useAuthStore(state => state.isAuthenticated)
      );

      act(() => {
        useAuthStore.getState().setUser(mockUser);
      });

      expect(userResult.current).toEqual(mockUser);
      expect(isAuthResult.current).toBe(true);
    });

    it('should only re-render when selected state changes', () => {
      const userSelector = jest.fn(state => state.user);
      const { result } = renderHook(() => useAuthStore(userSelector));

      act(() => {
        useAuthStore.getState().setTokens('new-access', 'new-refresh');
      });

      // User selector should not cause re-render when only tokens change
      expect(userSelector).toHaveBeenCalledTimes(1);

      act(() => {
        useAuthStore.getState().setUser(mockUser);
      });

      // Now it should re-render because user changed
      expect(userSelector).toHaveBeenCalledTimes(2);
    });
  });

  describe('store actions outside of components', () => {
    it('should allow calling actions directly on store', () => {
      const store = useAuthStore.getState();

      store.setUser(mockUser);
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      store.clearAuth();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });
});
