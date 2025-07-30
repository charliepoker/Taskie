export interface RouteConfig {
  path: string;
  title: string;
  icon?: React.ComponentType;
  requiresAuth?: boolean;
  breadcrumbTitle?: string;
}

export const routes: Record<string, RouteConfig> = {
  home: {
    path: '/',
    title: 'Home',
    requiresAuth: false,
  },
  dashboard: {
    path: '/dashboard',
    title: 'Dashboard',
    requiresAuth: true,
    breadcrumbTitle: 'Dashboard',
  },
  users: {
    path: '/users',
    title: 'Users',
    requiresAuth: true,
    breadcrumbTitle: 'Users',
  },
  projects: {
    path: '/projects',
    title: 'Projects',
    requiresAuth: true,
    breadcrumbTitle: 'Projects',
  },
  analytics: {
    path: '/analytics',
    title: 'Analytics',
    requiresAuth: true,
    breadcrumbTitle: 'Analytics',
  },
  login: {
    path: '/auth/login',
    title: 'Sign In',
    requiresAuth: false,
  },
  register: {
    path: '/auth/register',
    title: 'Sign Up',
    requiresAuth: false,
  },
};

export const getRouteByPath = (path: string): RouteConfig | undefined => {
  return Object.values(routes).find(route => route.path === path);
};

export const isProtectedRoute = (path: string): boolean => {
  const route = getRouteByPath(path);
  return route?.requiresAuth ?? true; // Default to protected
};
