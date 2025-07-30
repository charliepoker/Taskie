import { renderHook, act } from '@testing-library/react';
import { useNotificationStore } from '../notificationStore';

// Mock timers
jest.useFakeTimers();

describe('NotificationStore', () => {
  beforeEach(() => {
    // Clear all notifications and reset timers
    useNotificationStore.getState().clearAllNotifications();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  it('should initialize with empty notifications', () => {
    const { result } = renderHook(() => useNotificationStore());

    expect(result.current.notifications).toEqual([]);
  });

  it('should add a notification', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.addNotification({
        type: 'success',
        title: 'Test Notification',
        message: 'This is a test',
      });
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toMatchObject({
      type: 'success',
      title: 'Test Notification',
      message: 'This is a test',
    });
    expect(result.current.notifications[0].id).toBeDefined();
    expect(result.current.notifications[0].createdAt).toBeDefined();
  });

  it('should remove a notification', () => {
    const { result } = renderHook(() => useNotificationStore());

    let notificationId: string;

    act(() => {
      notificationId = result.current.addNotification({
        type: 'info',
        title: 'Test Notification',
      });
    });

    expect(result.current.notifications).toHaveLength(1);

    act(() => {
      result.current.removeNotification(notificationId);
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('should clear all notifications', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.addNotification({
        type: 'success',
        title: 'Notification 1',
      });
      result.current.addNotification({
        type: 'error',
        title: 'Notification 2',
      });
    });

    expect(result.current.notifications).toHaveLength(2);

    act(() => {
      result.current.clearAllNotifications();
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('should auto-remove notifications after duration', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.addNotification({
        type: 'success',
        title: 'Auto Remove',
        duration: 1000,
      });
    });

    expect(result.current.notifications).toHaveLength(1);

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('should not auto-remove persistent notifications', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.addNotification({
        type: 'error',
        title: 'Persistent',
        duration: 0,
      });
    });

    expect(result.current.notifications).toHaveLength(1);

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(result.current.notifications).toHaveLength(1);
  });

  describe('Convenience Methods', () => {
    it('should create success notification', () => {
      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.success('Success!', 'Operation completed');
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0]).toMatchObject({
        type: 'success',
        title: 'Success!',
        message: 'Operation completed',
      });
    });

    it('should create error notification with persistent duration', () => {
      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.error('Error!', 'Something went wrong');
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0]).toMatchObject({
        type: 'error',
        title: 'Error!',
        message: 'Something went wrong',
        duration: 0,
      });
    });

    it('should create warning notification with longer duration', () => {
      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.warning('Warning!', 'Please be careful');
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0]).toMatchObject({
        type: 'warning',
        title: 'Warning!',
        message: 'Please be careful',
        duration: 8000,
      });
    });

    it('should create info notification', () => {
      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.info('Info', 'Just so you know');
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0]).toMatchObject({
        type: 'info',
        title: 'Info',
        message: 'Just so you know',
      });
    });
  });

  it('should handle notification with action', () => {
    const { result } = renderHook(() => useNotificationStore());
    const mockAction = jest.fn();

    act(() => {
      result.current.addNotification({
        type: 'info',
        title: 'Action Notification',
        action: {
          label: 'Click me',
          onClick: mockAction,
        },
      });
    });

    expect(result.current.notifications[0].action).toEqual({
      label: 'Click me',
      onClick: mockAction,
    });
  });
});
