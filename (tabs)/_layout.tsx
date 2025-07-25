import React from 'react';
import { Tabs } from 'expo-router';
import { MessageSquare, Calendar, Users, ChartBar as BarChart3, Zap } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';

export default function TabLayout() {
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1A1A1A',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          paddingTop: 12,
          paddingBottom: 32,
          height: 88,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          fontFamily: 'Urbanist-Medium',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
      initialRouteName="index"
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.infoHub,
          tabBarIcon: ({ size, color }) => (
            <MessageSquare size={22} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t.dashboard,
          tabBarIcon: ({ size, color }) => (
            <BarChart3 size={22} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t.calendar,
          tabBarIcon: ({ size, color }) => (
            <Calendar size={22} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="playerboard"
        options={{
          title: t.players,
          tabBarIcon: ({ size, color }) => (
            <Users size={22} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="live-ticker"
        options={{
         title: t.liveTicker,
          href: '/live-ticker',
          tabBarIcon: ({ size, color }) => (
            <Zap size={22} color={color} strokeWidth={1.5} />
          ),
        }}
      />
    </Tabs>
  );
}