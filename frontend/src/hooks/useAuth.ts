import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession, signIn, signOut } from 'next-auth/react';
import { queryKeys } from '@/lib/react-query';

// Auth service functions (these would typically be in a separate service file)
const authService = {
  getCurrentUser: async () => {
    // Get current user data from NextAuth session
    const { getSession } = await import('next-auth/react');
    const session = await getSession();
    if (!session?.user) {
      throw new Error('No authenticated user');
    }
    return session.user;
  },

  refreshToken: async () => {
    // NextAuth handles token refresh automatically
    // This is just a placeholder for compatibility
    const { getSession } = await import('next-auth/react');
    const session = await getSession();
    return session;
  },
};

// Query hooks
export function useCurrentUser() {
  const { data: session, status } = useSession();

  return useQuery({
    queryKey: queryKeys.auth.currentUser,
    queryFn: authService.getCurrentUser,
    enabled: status === 'authenticated' && !!session,
    staleTime: 5 * 60 * 1000, // 5 minutes
    initialData: session?.user || undefined,
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.message?.includes('No authenticated user')) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Mutation hooks
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      return result;
    },
    onSuccess: () => {
      // Invalidate and refetch current user
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser });

      // Clear all cached data to ensure fresh data for the new user
      queryClient.clear();
    },
    onError: error => {
      console.error('Login failed:', error);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await signOut({ redirect: false });
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();

      // Remove any stored tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        // Redirect to login page
        window.location.href = '/auth/login';
      }
    },
    onError: error => {
      console.error('Logout failed:', error);
    },
  });
}

export function useRefreshToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.refreshToken,
    onSuccess: () => {
      // Invalidate current user to refetch with new token
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser });
    },
    onError: error => {
      console.error('Token refresh failed:', error);
      // Redirect to login on refresh failure
      signOut({ redirect: true, callbackUrl: '/auth/login' });
    },
  });
}

// Custom hook for auth state
export function useAuthState() {
  const { data: session, status } = useSession();
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();

  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading' || (isAuthenticated && isUserLoading);

  return {
    session,
    currentUser,
    isAuthenticated,
    isLoading,
    status,
  };
}

// Alias for backward compatibility
export const useAuth = useAuthState;
