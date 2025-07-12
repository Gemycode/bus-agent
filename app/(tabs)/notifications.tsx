import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Colors } from '../../constants/Colors';
import { Bell, Info, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Circle as XCircle } from 'lucide-react-native';
import { Notification } from '../../types';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      
      // Auto-refresh notifications every 30 seconds
      const interval = setInterval(() => {
        loadNotifications();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  const loadNotifications = async () => {
    try {
      if (user?.id) {
        console.log('Loading notifications for user:', user.id);
        const data = await apiService.getNotifications(user.id);
        console.log('Notifications data:', data);
        
        // Handle different response formats
        let notificationsList: any[] = [];
        if (Array.isArray(data)) {
          notificationsList = data;
        } else if (data && Array.isArray(data.notifications)) {
          notificationsList = data.notifications;
        } else if (data && Array.isArray(data.messages)) {
          notificationsList = data.messages;
        }
        
        setNotifications(notificationsList);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info size={20} color={Colors.info} />;
      case 'warning':
        return <AlertTriangle size={20} color={Colors.warning} />;
      case 'success':
        return <CheckCircle size={20} color={Colors.success} />;
      case 'error':
        return <XCircle size={20} color={Colors.error} />;
      default:
        return <Bell size={20} color={Colors.gray500} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'info':
        return Colors.info;
      case 'warning':
        return Colors.warning;
      case 'success':
        return Colors.success;
      case 'error':
        return Colors.error;
      default:
        return Colors.gray500;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const renderNotificationCard = (notification: any) => {
    // Get notification data from different possible fields
    const notificationId = notification._id || notification.id;
    const title = notification.title || notification.subject || notification.heading || 'Notification';
    const message = notification.message || notification.content || notification.body || notification.description || '';
    const type = notification.type || notification.category || 'info';
    const isRead = notification.read || notification.isRead || notification.readAt || false;
    const createdAt = notification.createdAt || notification.timestamp || notification.date || new Date().toISOString();

    console.log('Rendering notification:', {
      id: notificationId,
      title,
      message,
      type,
      isRead,
      createdAt
    });

    return (
              <TouchableOpacity
          key={notificationId}
          style={[
            styles.notificationCard,
            !isRead && styles.unreadCard,
          ]}
          activeOpacity={0.7}
          onPress={() => {
            // Mark as read when tapped
            if (!isRead) {
              console.log('Marking notification as read:', notificationId);
              // Here you can add API call to mark as read
              // apiService.markNotificationAsRead(notificationId);
            }
          }}
        >
        <View style={styles.notificationHeader}>
          <View style={styles.iconContainer}>
            {getNotificationIcon(type)}
          </View>
          <View style={styles.notificationContent}>
            <Text style={[
              styles.notificationTitle,
              !isRead && styles.unreadTitle,
            ]}>
              {title}
            </Text>
            <Text style={styles.notificationTime}>
              {formatTime(createdAt)}
            </Text>
          </View>
          {!isRead && <View style={styles.unreadDot} />}
        </View>
        
        <Text style={styles.notificationMessage}>
          {message}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Bell size={64} color={Colors.gray400} />
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptySubtitle}>
        {user?.role === 'parent' 
          ? 'No notifications for your children yet. You\'ll be notified about attendance, bus updates, and more.'
          : 'You\'re all caught up! New notifications will appear here.'
        }
      </Text>
    </View>
  );

  const unreadCount = notifications.filter(n => !(n.read || n.isRead || n.readAt)).length;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Text style={styles.headerSubtitle}>
          {unreadCount > 0 
            ? `${unreadCount} unread ${user?.role === 'parent' ? 'notifications' : 'messages'}`
            : user?.role === 'parent' ? 'No new notifications' : 'All caught up!'
          }
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {notifications.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map(renderNotificationCard)}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  header: {
    backgroundColor: Colors.white,
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: Colors.brandDarkBlue,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.gray600,
  },
  scrollView: {
    flex: 1,
  },
  notificationsList: {
    padding: 16,
    gap: 12,
  },
  notificationCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.brandMediumBlue,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.brandDarkBlue,
    marginBottom: 2,
  },
  unreadTitle: {
    fontFamily: 'Inter-SemiBold',
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.gray500,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brandMediumBlue,
    marginLeft: 8,
    marginTop: 4,
  },
  notificationMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray700,
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: Colors.gray700,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.gray500,
    textAlign: 'center',
  },
});