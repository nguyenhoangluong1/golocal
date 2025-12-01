import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { notificationsAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { requestDeduplication } from '../../utils/requestDeduplication';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: any;
}

export default function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedRef = useRef(false);

  // Only load unread count on mount (lightweight query)
  // OPTIMIZE: Only poll when page is visible to reduce unnecessary API calls
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear interval if user logs out
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      hasLoadedRef.current = false;
      setUnreadCount(0);
      return;
    }

    // Only load unread count, not full notifications
    const loadUnreadCount = async () => {
      // Only fetch if page is visible
      if (document.hidden) return;
      
      // Prevent concurrent calls using request deduplication
      const dedupKey = requestDeduplication.generateKey('/payments/notifications/unread-count');
      
      try {
        const unreadRes = await requestDeduplication.deduplicate(
          dedupKey,
          () => notificationsAPI.getUnreadCount()
        );
        setUnreadCount(unreadRes.data?.count || 0);
      } catch (error) {
        console.error('Failed to load unread count:', error);
        // Don't reset count on error - keep current value
      }
    };

    // Load immediately when authenticated (only once per auth session)
    if (!hasLoadedRef.current) {
      loadUnreadCount();
      hasLoadedRef.current = true;
    }
    
    // Clear any existing interval before creating a new one
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Poll for unread count every 2 minutes (reduced from 60s to reduce API calls)
    // Only when page is visible
    intervalRef.current = setInterval(() => {
      if (!document.hidden) {
        loadUnreadCount();
      }
    }, 120000); // 2 minutes instead of 60 seconds
    
    // Also reload when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadUnreadCount();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      // ALGORITHM OPTIMIZATION: Backend getAll already returns unread_count
      // No need to call getUnreadCount separately - reduces API calls by 50%
      const notificationsRes = await notificationsAPI.getAll({ limit: 10 });

      // Backend returns { notifications: [...], total: ..., unread_count: ... }
      const notificationsData = notificationsRes.data?.notifications || notificationsRes.data || [];
      setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
      
      // Use unread_count from getAll response if available, otherwise keep current count
      if (notificationsRes.data?.unread_count !== undefined) {
        setUnreadCount(notificationsRes.data.unread_count);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      // Set empty array on error to prevent crashes
      setNotifications([]);
      // Don't reset unreadCount on error - keep current value
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (notificationId: string) => {
    try {
      await notificationsAPI.markRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Don't throw, just log the error
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      handleMarkRead(notification.id);
    }

    // Close dropdown
    setIsOpen(false);

    // Navigate based on notification type and data
    const data = notification.data;
    
    switch (notification.type) {
      case 'BOOKING_REQUEST':
        // Navigate to booking approval page
        navigate('/booking-approval');
        break;
      
      case 'BOOKING_APPROVED':
      case 'BOOKING_REJECTED':
      case 'BOOKING_STATUS_CHANGED':
        // Navigate to messages with booking_id if available
        if (data?.booking_id) {
          navigate(`/messages?booking=${data.booking_id}`);
        } else {
          navigate('/profile', { state: { activeTab: 'bookings' } });
        }
        break;
      
      case 'PAYMENT_RECEIVED':
      case 'PAYOUT_SCHEDULED':
        // Navigate to profile payouts or bookings
        if (data?.booking_id) {
          navigate('/profile', { state: { activeTab: 'bookings' } });
        } else {
          navigate('/profile');
        }
        break;
      
      case 'MESSAGE':
        // Navigate to messages
        if (data?.conversation_id) {
          navigate(`/messages?conversation=${data.conversation_id}`);
        } else if (data?.booking_id) {
          navigate(`/messages?booking=${data.booking_id}`);
        } else {
          navigate('/messages');
        }
        break;
      
      default:
        // Default: navigate to profile
        navigate('/profile');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'BOOKING_REQUEST':
        return '📅';
      case 'BOOKING_APPROVED':
        return '✅';
      case 'BOOKING_REJECTED':
        return '❌';
      case 'PAYMENT_RECEIVED':
        return '💰';
      case 'PAYOUT_SCHEDULED':
        return '💸';
      case 'MESSAGE':
        return '💬';
      default:
        return '🔔';
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          const newIsOpen = !isOpen;
          setIsOpen(newIsOpen);
          // Load notifications ONLY when opening dropdown (on click)
          if (newIsOpen && !loading) {
            loadNotifications();
          }
        }}
        className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {unreadCount} unread
              </span>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 dark:text-gray-400">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      <div className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {notification.created_at 
                            ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })
                            : 'Just now'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  // Mark all as read
                  notifications.forEach(n => {
                    if (!n.read) handleMarkRead(n.id);
                  });
                }}
                className="text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300"
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

