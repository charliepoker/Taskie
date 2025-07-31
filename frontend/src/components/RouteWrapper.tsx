'use client';

import { ReactNode, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { ErrorBoundaryWrapper } from './RouteErrorBoundary';
import { RouteLoading } from './RouteLoading';
import { ProtectedRoute } from './ProtectedRoute';
import { isProtectedRoute } from '@/lib/routes';

interface RouteWrapperProps {
  children: ReactNode;
  loading?: ReactNode;
  error?: ReactNode;
  requireAuth?: boolean;
}

export function RouteWrapper({
  children,
  loading,
  error,
  requireAuth,
}: RouteWrapperProps) {
  const pathname = usePathname();
  const needsAuth = requireAuth ?? isProtectedRoute(pathname);

  const content = (
    <ErrorBoundaryWrapper fallback={error}>
      <Suspense fallback={loading || <RouteLoading />}>{children}</Suspense>
    </ErrorBoundaryWrapper>
  );

  if (needsAuth) {
    return <ProtectedRoute>{content}</ProtectedRoute>;
  }

  return content;
}
