import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Colors } from '../../constants/Colors';
import { Bell, Info, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Circle as XCircle, Send } from 'lucide-react-native';
import { Notification } from '../../types';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendTitle, setSendTitle] = useState('');
  const [sendBody, setSendBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      const interval = setInterval(() => {
        loadNotifications();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  const loadNotifications = async () => {
    try {
      if (user?.id) {
        const data = await apiService.getNotifications(user.id);
        let notificationsList: any[] = [];
        if (Array.isArray(data)) {
          notificationsList = data;
        } else if (data && typeof data === 'object' && Array.isArray((data as any).notifications)) {
          notificationsList = (data as any).notifications;
        } else if (data && typeof data === 'object' && Array.isArray((data as any).messages)) {
          notificationsList = (data as any).messages;
        }
        setNotifications(notificationsList);
      }
    } catch (error) {
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
    const notificationId = notification._id || notification.id;
    const title = notification.title || notification.subject || notification.heading || 'Notification';
    const message = notification.message || notification.content || notification.body || notification.description || '';
    const type = notification.type || notification.category || 'info';
    const isRead = notification.read || notification.isRead || notification.readAt || false;
    const createdAt = notification.createdAt || notification.timestamp || notification.date || new Date().toISOString();
    return (
      <TouchableOpacity
        key={notificationId}
        style={[
          styles.notificationCard,
          !isRead && styles.unreadCard,
        ]}
        activeOpacity={0.7}
        onPress={() => {
          if (!isRead) {
            // Optionally mark as read
          }
        }}
      >
        <View style={styles.notificationHeader}>
          <View style={styles.iconContainer}>{getNotificationIcon(type)}</View>
          <View style={styles.notificationContent}>
            <Text style={[styles.notificationTitle, !isRead && styles.unreadTitle]}>{title}</Text>
            <Text style={styles.notificationTime}>{formatTime(createdAt)}</Text>
          </View>
          {!isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notificationMessage}>{message}</Text>
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

  const handleSendNotification = async () => {
    if (!sendTitle || !sendBody) {
      Alert.alert('Error', 'Please enter both title and message');
      return;
    }
    setSending(true);
    try {
      await apiService.sendNotification({ title: sendTitle, body: sendBody });
      setShowSendModal(false);
      setSendTitle('');
      setSendBody('');
      loadNotifications();
      Alert.alert('Success', 'Notification sent');
    } catch (e) {
      Alert.alert('Error', 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Text style={styles.headerSubtitle}>All your notifications in one place</Text>
        {user?.role === 'admin' && (
          <TouchableOpacity style={{ marginTop: 12, alignSelf: 'flex-end' }} onPress={() => setShowSendModal(true)}>
            <Send size={24} color={Colors.brandMediumBlue} />
            <Text style={{ color: Colors.brandMediumBlue, fontWeight: 'bold', marginLeft: 4 }}>Send Notification</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {notifications.length === 0 ? renderEmptyState() : (
          <View style={styles.notificationsList}>
            {notifications.map(renderNotificationCard)}
          </View>
        )}
      </ScrollView>
      {/* Admin Send Notification Modal */}
      <Modal visible={showSendModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '90%' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>Send Notification</Text>
            <TextInput
              placeholder="Title"
              value={sendTitle}
              onChangeText={setSendTitle}
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 12, padding: 8 }}
            />
            <TextInput
              placeholder="Message"
              value={sendBody}
              onChangeText={setSendBody}
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 12, padding: 8, minHeight: 60 }}
              multiline
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity onPress={() => setShowSendModal(false)} style={{ marginRight: 16 }} disabled={sending}>
                <Text style={{ color: '#888', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSendNotification} disabled={sending} style={{ backgroundColor: Colors.brandMediumBlue, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{sending ? 'Sending...' : 'Send'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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