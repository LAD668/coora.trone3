import React from 'react';
import { Tabs } from 'expo-router';
import { MessageSquare, Calendar, Users, ChartBar as BarChart3, Zap } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1f2937',
          borderTopColor: '#374151',
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#9ca3af',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'InfoHub',
          tabBarIcon: ({ size, color }) => (
            <MessageSquare size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ size, color }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="playerboard"
        options={{
          title: 'Playerboard',
          tabBarIcon: ({ size, color }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="live-ticker"
        options={{
          title: 'Live Ticker',
          tabBarIcon: ({ size, color }) => (
            <Zap size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ size, color }) => (
            <Calendar size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}