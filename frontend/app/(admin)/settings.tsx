import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../../src/store/useStore';
import { Card } from '../../src/components/UI';

export default function SettingsScreen() {
  const { user, logout } = useStore();
  const [notifications, setNotifications] = React.useState(true);
  const [autoBoarding, setAutoBoarding] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(true);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('session_token');
          logout();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* User Card */}
        <Card style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Administrator'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'admin@skyflow.com'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>ADMIN</Text>
            </View>
          </View>
        </Card>

        {/* App Settings */}
        <Card style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications" size={22} color="#9CA3AF" />
              <Text style={styles.settingLabel}>Push Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#374151', true: '#8B5CF620' }}
              thumbColor={notifications ? '#8B5CF6' : '#6B7280'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="flash" size={22} color="#9CA3AF" />
              <Text style={styles.settingLabel}>Auto Boarding Suggestions</Text>
            </View>
            <Switch
              value={autoBoarding}
              onValueChange={setAutoBoarding}
              trackColor={{ false: '#374151', true: '#8B5CF620' }}
              thumbColor={autoBoarding ? '#8B5CF6' : '#6B7280'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="moon" size={22} color="#9CA3AF" />
              <Text style={styles.settingLabel}>Dark Mode</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#374151', true: '#8B5CF620' }}
              thumbColor={darkMode ? '#8B5CF6' : '#6B7280'}
            />
          </View>
        </Card>

        {/* System Settings */}
        <Card style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>System</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="cloud" size={22} color="#9CA3AF" />
              <Text style={styles.settingLabel}>Firebase Configuration</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#4B5563" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="server" size={22} color="#9CA3AF" />
              <Text style={styles.settingLabel}>API Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#4B5563" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="people" size={22} color="#9CA3AF" />
              <Text style={styles.settingLabel}>Staff Management</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#4B5563" />
          </TouchableOpacity>
        </Card>

        {/* Support */}
        <Card style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="help-circle" size={22} color="#9CA3AF" />
              <Text style={styles.settingLabel}>Help & FAQ</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#4B5563" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="document-text" size={22} color="#9CA3AF" />
              <Text style={styles.settingLabel}>Documentation</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#4B5563" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="mail" size={22} color="#9CA3AF" />
              <Text style={styles.settingLabel}>Contact Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#4B5563" />
          </TouchableOpacity>
        </Card>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>SkyFlow Admin v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  userEmail: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: '#8B5CF620',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  roleText: {
    color: '#8B5CF6',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  settingsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  version: {
    color: '#4B5563',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
  },
});
