import '@testing-library/jest-dom';

// MSW setup will be added later when needed for API tests
// For now, we'll focus on component testing

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/',
}));

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
      },
      accessToken: 'mock-token',
    },
    status: 'authenticated',
  }),
  getSession: () =>
    Promise.resolve({
      user: {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
      },
      accessToken: 'mock-token',
    }),
}));

// Mock @tanstack/react-query
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: null,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
  useMutation: () => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
  }),
  QueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
  })),
  QueryClientProvider: ({ children }) => children,
}));

// Mock drag and drop
jest.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }) => children,
  Droppable: ({ children }) =>
    children(
      { innerRef: jest.fn(), droppableProps: {}, placeholder: null },
      {}
    ),
  Draggable: ({ children }) =>
    children(
      { innerRef: jest.fn(), draggableProps: {}, dragHandleProps: {} },
      {}
    ),
}));

// Mock MDEditor
jest.mock('@uiw/react-md-editor', () => ({
  __esModule: true,
  default: ({ value, onChange }) => (
    <textarea
      data-testid='md-editor'
      value={value}
      onChange={e => onChange?.(e.target.value)}
    />
  ),
  Markdown: ({ source }) => <div data-testid='md-preview'>{source}</div>,
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Ant Design Spin component
jest.mock('antd', () => {
  const antd = jest.requireActual('antd');
  return {
    ...antd,
    Spin: ({ children, ...props }) =>
      props.spinning !== false ? (
        <div data-testid='loading-spinner'>Loading...</div>
      ) : (
        children
      ),
  };
});
