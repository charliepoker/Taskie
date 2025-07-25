'use client';

import { useSession } from 'next-auth/react';
import { ReactNode, useEffect } from 'react';
import { Spin } from 'antd';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  fallback,
  redirectTo = '/auth/login',
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session) {
      window.location.href = redirectTo;
    }
  }, [session, status, redirectTo]);

  if (status === 'loading') {
    return (
      fallback || (
        <div className='min-h-screen flex items-center justify-center'>
          <Spin size='large' />
        </div>
      )
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  return <>{children}</>;
}

interface RequireAuthProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequireAuth({ children, fallback }: RequireAuthProps) {
  return <ProtectedRoute fallback={fallback}>{children}</ProtectedRoute>;
}
