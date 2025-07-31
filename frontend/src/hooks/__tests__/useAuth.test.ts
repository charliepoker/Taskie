import { renderHook, waitFor } from '@testing-library/react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useCurrentUser,
  useLogin,
  useLogout,
  useRefreshToken,
  useAuthState,
} from '../useAuth';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('@tanstack/react-query');

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
const mockUseQueryClient = useQueryClient as jest.MockedFunction<
  typeof useQueryClient
>;

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock localStorage
const mockLocalStorage = {
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('useAuth hooks', () => {
  const mockQueryClient = {
    invalidateQueries: jest.fn(),
    clear: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQueryClient.mockReturnValue(mockQueryClient as any);
  });

  describe('useCurrentUser', () => {
    it('should fetch current user when authenticated', () => {
      const mockSession = {
        user: { id: '1', email: 'test@example.com' },
        accessToken: 'token',
      };

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      } as any);

      mockUseQuery.mockReturnValue({
        data: mockSession.user,
        isLoading: false,
        error: null,
      } as any);

      renderHook(() => useCurrentUser());

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: expect.any(Array),
        queryFn: expect.any(Function),
        enabled: true,
        staleTime: 5 * 60 * 1000,
        retry: expect.any(Function),
      });
    });

    it('should not fetch when not authenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      } as any);

      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      renderHook(() => useCurrentUser());

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: expect.any(Array),
        queryFn: expect.any(Function),
        enabled: false,
        staleTime: 5 * 60 * 1000,
        retry: expect.any(Function),
      });
    });

    it('should handle retry logic correctly', () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: '1' } },
        status: 'authenticated',
      } as any);

      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      renderHook(() => useCurrentUser());

      const retryFunction = mockUseQuery.mock.calls[0][0].retry;

      // Should not retry on 401 errors
      expect(retryFunction(1, { status: 401 })).toBe(false);

      // Should retry on other errors (up to 3 times)
      expect(retryFunction(1, { status: 500 })).toBe(true);
      expect(retryFunction(2, { status: 500 })).toBe(true);
      expect(retryFunction(3, { status: 500 })).toBe(false);
    });
  });

  describe('useLogin', () => {
    it('should handle successful login', async () => {
      const mockMutationResult = {
        mutate: jest.fn(),
        mutateAsync: jest.fn(),
        isPending: false,
        isError: false,
        error: null,
      };

      mockUseMutation.mockReturnValue(mockMutationResult as any);
      mockSignIn.mockResolvedValue({ ok: true, error: null } as any);

      renderHook(() => useLogin());

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      });

      // Test the mutation function
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn;
      await mutationFn({ email: 'test@example.com', password: 'password' });

      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password',
        redirect: false,
      });
    });

    it('should handle login error', async () => {
      const mockMutationResult = {
        mutate: jest.fn(),
        mutateAsync: jest.fn(),
        isPending: false,
        isError: true,
        error: new Error('Login failed'),
      };

      mockUseMutation.mockReturnValue(mockMutationResult as any);
      mockSignIn.mockResolvedValue({
        ok: false,
        error: 'Invalid credentials',
      } as any);

      renderHook(() => useLogin());

      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn;

      await expect(
        mutationFn({ email: 'test@example.com', password: 'wrong' })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should invalidate queries on successful login', () => {
      mockUseMutation.mockReturnValue({
        mutate: jest.fn(),
        mutateAsync: jest.fn(),
        isPending: false,
        isError: false,
        error: null,
      } as any);

      renderHook(() => useLogin());

      const onSuccess = mockUseMutation.mock.calls[0][0].onSuccess;
      onSuccess();

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: expect.any(Array),
      });
      expect(mockQueryClient.clear).toHaveBeenCalled();
    });
  });

  describe('useLogout', () => {
    it('should handle successful logout', () => {
      const mockMutationResult = {
        mutate: jest.fn(),
        mutateAsync: jest.fn(),
        isPending: false,
        isError: false,
        error: null,
      };

      mockUseMutation.mockReturnValue(mockMutationResult as any);
      mockSignOut.mockResolvedValue(undefined as any);

      renderHook(() => useLogout());

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      });
    });

    it('should clear data on successful logout', () => {
      mockUseMutation.mockReturnValue({
        mutate: jest.fn(),
        mutateAsync: jest.fn(),
        isPending: false,
        isError: false,
        error: null,
      } as any);

      renderHook(() => useLogout());

      const onSuccess = mockUseMutation.mock.calls[0][0].onSuccess;
      onSuccess();

      expect(mockQueryClient.clear).toHaveBeenCalled();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    });
  });

  describe('useRefreshToken', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ accessToken: 'new-token' }),
      } as any);
    });

    it('should handle successful token refresh', () => {
      const mockMutationResult = {
        mutate: jest.fn(),
        mutateAsync: jest.fn(),
        isPending: false,
        isError: false,
        error: null,
      };

      mockUseMutation.mockReturnValue(mockMutationResult as any);

      renderHook(() => useRefreshToken());

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      });
    });

    it('should invalidate queries on successful refresh', () => {
      mockUseMutation.mockReturnValue({
        mutate: jest.fn(),
        mutateAsync: jest.fn(),
        isPending: false,
        isError: false,
        error: null,
      } as any);

      renderHook(() => useRefreshToken());

      const onSuccess = mockUseMutation.mock.calls[0][0].onSuccess;
      onSuccess();

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: expect.any(Array),
      });
    });

    it('should sign out on refresh failure', () => {
      mockUseMutation.mockReturnValue({
        mutate: jest.fn(),
        mutateAsync: jest.fn(),
        isPending: false,
        isError: true,
        error: new Error('Refresh failed'),
      } as any);

      renderHook(() => useRefreshToken());

      const onError = mockUseMutation.mock.calls[0][0].onError;
      onError(new Error('Refresh failed'));

      expect(mockSignOut).toHaveBeenCalledWith({
        redirect: true,
        callbackUrl: '/auth/login',
      });
    });
  });

  describe('useAuthState', () => {
    it('should return correct auth state when authenticated', () => {
      const mockSession = {
        user: { id: '1', email: 'test@example.com' },
        accessToken: 'token',
      };

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      } as any);

      // Mock useCurrentUser return value
      jest.doMock('../useAuth', () => ({
        ...jest.requireActual('../useAuth'),
        useCurrentUser: () => ({
          data: mockUser,
          isLoading: false,
        }),
      }));

      const { result } = renderHook(() => useAuthState());

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.session).toBe(mockSession);
      expect(result.current.status).toBe('authenticated');
    });

    it('should return correct auth state when not authenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      } as any);

      // Mock useCurrentUser return value
      jest.doMock('../useAuth', () => ({
        ...jest.requireActual('../useAuth'),
        useCurrentUser: () => ({
          data: null,
          isLoading: false,
        }),
      }));

      const { result } = renderHook(() => useAuthState());

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.session).toBeNull();
      expect(result.current.status).toBe('unauthenticated');
    });

    it('should return loading state correctly', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      } as any);

      // Mock useCurrentUser return value
      jest.doMock('../useAuth', () => ({
        ...jest.requireActual('../useAuth'),
        useCurrentUser: () => ({
          data: null,
          isLoading: false,
        }),
      }));

      const { result } = renderHook(() => useAuthState());

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.status).toBe('loading');
    });
  });
});
