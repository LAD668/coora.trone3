import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { X, Bell, Calendar, Users, Trophy, MessageSquare, CircleCheck as CheckCircle, Circle, Trash2 } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { getNotifications } from '@/lib/supabase';


export default function NotificationsScreen() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Load notifications on component mount
  useEffect(() => {
    if (user?.teamId) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user?.teamId) return;

    setIsLoading(true);
    try {
      const data = await getNotifications(user.teamId);
      // Transform Supabase data to match component expectations
      const transformedData = (data || []).map(notification => ({
        id: notification.id,
        type: notification.notification_type === 'event_reminder' ? 'event' : 
              notification.notification_type === 'post_match' ? 'achievement' : 'message',
        title: notification.title,
        message: notification.message,
        timestamp: new Date(notification.scheduled_for),
        read: notification.read_by?.includes(user.id) || false,
        actionable: notification.event_id ? true : false,
      }));
      setNotifications(transformedData);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event':
        return Calendar;
      case 'message':
        return MessageSquare;
      case 'team':
        return Users;
      case 'achievement':
        return Trophy;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'event':
        return '#007AFF';
      case 'message':
        return '#34C759';
      case 'team':
        return '#FF9500';
      case 'achievement':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  const markAsRead = (notificationId: string) => {
    if (!user?.id) return;
    
    // Update local state immediately
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
    
    // Update in database by adding user ID to read_by array
    updateNotificationReadStatus(notificationId, user.id);
  };

  const markAllAsRead = () => {
    if (!user?.id) return;
    
    // Update local state immediately
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
    
    // Update all unread notifications in database
    const unreadNotifications = notifications.filter(n => !n.read);
    unreadNotifications.forEach(notification => {
      updateNotificationReadStatus(notification.id, user.id);
    });
  };
  
  const updateNotificationReadStatus = async (notificationId: string, userId: string) => {
    try {
      // Get current notification
      const { data: notification, error: fetchError } = await supabase
        .from('notifications')
        .select('read_by')
        .eq('id', notificationId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching notification:', fetchError);
        return;
      }
      
      // Add user ID to read_by array if not already present
      const currentReadBy = notification.read_by || [];
      if (!currentReadBy.includes(userId)) {
        const updatedReadBy = [...currentReadBy, userId];
        
        const { error: updateError } = await supabase
          .from('notifications')
          .update({ read_by: updatedReadBy })
          .eq('id', notificationId);
        
        if (updateError) {
          console.error('Error updating notification read status:', updateError);
        }
      }
    } catch (error) {
      console.error('Error updating notification read status:', error);
    }
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const clearAllNotifications = () => {
    Alert.alert(
      language === 'de' ? 'Alle Benachrichtigungen löschen' : 'Clear All Notifications',
      language === 'de' ? 'Bist du sicher, dass du alle Benachrichtigungen löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.' : 'Are you sure you want to clear all notifications? This action cannot be undone.',
      [
        { text: t.cancel, style: 'cancel' },
        { 
          text: language === 'de' ? 'Alle löschen' : 'Clear All', 
          style: 'destructive',
          onPress: () => setNotifications([])
        }
      ]
    );
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <X size={24} color="#1A1A1A" strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.notifications}</Text>
        <TouchableOpacity 
          style={styles.headerAction}
          onPress={markAllAsRead}
          disabled={unreadCount === 0}
        >
          <Text style={[
            styles.headerActionText,
            unreadCount === 0 && styles.headerActionTextDisabled
          ]}>
            {t.markAllRead}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === 'all' && styles.filterTabActive
            ]}
            onPress={() => setFilter('all')}
          >
            <Text style={[
              styles.filterTabText,
              filter === 'all' && styles.filterTabTextActive
            ]}>
              {t.all} ({notifications.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === 'unread' && styles.filterTabActive
            ]}
            onPress={() => setFilter('unread')}
          >
            <Text style={[
              styles.filterTabText,
              filter === 'unread' && styles.filterTabTextActive
            ]}>
              {t.unread} ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>

        {notifications.length > 0 && (
          <TouchableOpacity 
            style={styles.clearAllButton}
            onPress={clearAllNotifications}
          >
            <Trash2 size={16} color="#FF3B30" strokeWidth={1.5} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t.loading}</Text>
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={48} color="#E5E5E7" strokeWidth={1} />
            <Text style={styles.emptyStateTitle}>
              {filter === 'unread' ? t.noUnreadNotifications : t.noNotifications}
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              {filter === 'unread' 
                ? t.allCaughtUp
                : t.teamUpdatesHere
              }
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsContainer}>
            {filteredNotifications.map((notification) => {
              const IconComponent = getNotificationIcon(notification.type);
              const iconColor = getNotificationColor(notification.type);
              
              return (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationCard,
                    !notification.read && styles.notificationCardUnread
                  ]}
                  onPress={() => {
                    if (!notification.read) {
                      markAsRead(notification.id);
                    }
                    // Handle notification action based on type
                    if (notification.actionable) {
                      Alert.alert('Action', 'Navigate to related content');
                    }
                  }}
                >
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationLeft}>
                      <View style={[
                        styles.notificationIcon,
                        { backgroundColor: `${iconColor}15` }
                      ]}>
                        <IconComponent size={20} color={iconColor} strokeWidth={1.5} />
                      </View>
                      
                      <View style={styles.notificationText}>
                        <View style={styles.notificationHeader}>
                          <Text style={[
                            styles.notificationTitle,
                            !notification.read && styles.notificationTitleUnread
                          ]}>
                            {notification.title}
                          </Text>
                          {!notification.read && (
                            <View style={styles.unreadDot} />
                          )}
                        </View>
                        <Text style={styles.notificationMessage}>
                          {notification.message}
                        </Text>
                        <Text style={styles.notificationTime}>
                          {formatTimestamp(notification.timestamp)}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteNotification(notification.id)}
                    >
                      <X size={16} color="#8E8E93" strokeWidth={1.5} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  headerAction: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    fontFamily: 'Urbanist-Medium',
  },
  headerActionTextDisabled: {
    color: '#C7C7CC',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    fontFamily: 'Urbanist-Medium',
  },
  filterTabTextActive: {
    color: '#1A1A1A',
  },
  clearAllButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    marginTop: 24,
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationsContainer: {
    paddingTop: 16,
    gap: 12,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  notificationCardUnread: {
    borderColor: '#E3F2FD',
    backgroundColor: '#FAFBFF',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
  },
  notificationLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Medium',
    flex: 1,
  },
  notificationTitleUnread: {
    fontWeight: '600',
    fontFamily: 'Urbanist-SemiBold',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#C7C7CC',
    fontFamily: 'Urbanist-Regular',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  bottomSpacing: {
    height: 32,
  },
});