import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Settings, Bell } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { getNotifications } from '@/lib/supabase';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications and count unread ones
  useEffect(() => {
    if (user?.teamId) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user?.teamId || !user?.id) return;
    
    try {
      const data = await getNotifications(user.teamId);
      // Count truly unread notifications (where user ID is not in read_by array)
      const unread = (data || []).filter(notification => {
        const readBy = notification.read_by || [];
        return !readBy.includes(user.id);
      }).length;
      
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setUnreadCount(0);
    }
  };

  const handleNotifications = () => {
    router.push('/notifications');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Text style={styles.title}>{title}</Text>
        </View>
        
        <View style={styles.rightSection}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={handleNotifications}
          >
            <Bell size={20} color="#1A1A1A" strokeWidth={1.5} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount.toString()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => router.push('/settings')}
          >
            <Settings size={20} color="#1A1A1A" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    letterSpacing: -0.5,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Urbanist-SemiBold',
  },
});