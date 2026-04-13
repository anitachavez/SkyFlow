import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PassengerStatus, PassengerPriority } from '../store/useStore';

interface StatusBadgeProps {
  status: PassengerStatus;
  size?: 'small' | 'medium' | 'large';
}

interface PriorityBadgeProps {
  priority: PassengerPriority;
  size?: 'small' | 'medium' | 'large';
}

const statusConfig: Record<PassengerStatus, { label: string; color: string; bgColor: string }> = {
  checked_in: { label: 'Checked In', color: '#60A5FA', bgColor: '#1E3A5F' },
  waiting: { label: 'Waiting', color: '#F59E0B', bgColor: '#78350F' },
  boarding: { label: 'Boarding', color: '#FBBF24', bgColor: '#713F12' },
  seated: { label: 'Seated', color: '#22C55E', bgColor: '#14532D' },
  deboarding: { label: 'Deboarding', color: '#F97316', bgColor: '#7C2D12' },
  exited: { label: 'Exited', color: '#6B7280', bgColor: '#374151' },
};

const priorityConfig: Record<PassengerPriority, { label: string; color: string; bgColor: string; icon: string }> = {
  first_class: { label: 'First Class', color: '#FFD700', bgColor: '#5C4B00', icon: '👑' },
  disability: { label: 'Special Assist', color: '#60A5FA', bgColor: '#1E3A5F', icon: '♿' },
  family: { label: 'Family', color: '#F472B6', bgColor: '#831843', icon: '👨‍👩‍👧' },
  connection: { label: 'Connection', color: '#FB923C', bgColor: '#7C2D12', icon: '🔗' },
  standard: { label: 'Standard', color: '#9CA3AF', bgColor: '#374151', icon: '✈️' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'medium' }) => {
  const config = statusConfig[status];
  const sizeStyles = {
    small: { paddingHorizontal: 8, paddingVertical: 3, fontSize: 10 },
    medium: { paddingHorizontal: 12, paddingVertical: 5, fontSize: 12 },
    large: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 14 },
  };

  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }, sizeStyles[size]]}>
      <Text style={[styles.badgeText, { color: config.color, fontSize: sizeStyles[size].fontSize }]}>
        {config.label}
      </Text>
    </View>
  );
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'medium' }) => {
  const config = priorityConfig[priority];
  const sizeStyles = {
    small: { paddingHorizontal: 8, paddingVertical: 3, fontSize: 10 },
    medium: { paddingHorizontal: 12, paddingVertical: 5, fontSize: 12 },
    large: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 14 },
  };

  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }, sizeStyles[size]]}>
      <Text style={[styles.badgeText, { color: config.color, fontSize: sizeStyles[size].fontSize }]}>
        {config.icon} {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontWeight: '600',
  },
});
