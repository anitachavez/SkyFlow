import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore, UserRole } from '../src/store/useStore';

const { width } = Dimensions.get('window');

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Landing() {
  const { setUser, isAuthenticated, user } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      if (sessionToken) {
        const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${sessionToken}` },
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          navigateToRole(userData.role);
          return;
        }
      }
    } catch (error) {
      console.log('No existing session');
    }
    setIsLoading(false);
  };

  const navigateToRole = (role: UserRole) => {
    switch (role) {
      case 'passenger':
        router.replace('/(passenger)');
        break;
      case 'staff':
        router.replace('/(staff)');
        break;
      case 'admin':
        router.replace('/(admin)');
        break;
    }
  };

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    if (Platform.OS === 'web') {
      const redirectUrl = window.location.origin + '/auth-callback';
      window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    } else {
      // For mobile, we'll use a WebView-based auth in a real implementation
      // For now, use demo mode
      handleDemoMode('passenger');
    }
  };

  const handleDemoMode = async (role: UserRole) => {
    setSelectedRole(role);
    setIsLoading(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      
      if (response.ok) {
        const data = await response.json();
        await AsyncStorage.setItem('session_token', data.session_token);
        setUser(data.user);
        navigateToRole(role);
      }
    } catch (error) {
      console.error('Demo login failed:', error);
    }
    
    setIsLoading(false);
    setSelectedRole(null);
  };

  if (isLoading && !selectedRole) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo & Title */}
        <View style={styles.header}>
          <View testID="skyflow-logo" style={styles.logoContainer}>
            <Ionicons name="airplane" size={48} color="#3B82F6" />
          </View>
          <Text testID="app-title" style={styles.title}>SkyFlow</Text>
          <Text testID="app-subtitle" style={styles.subtitle}>Intelligent Boarding Management</Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Ionicons name="time-outline" size={24} color="#22C55E" />
            <Text style={styles.featureText}>Real-time Updates</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="notifications-outline" size={24} color="#F59E0B" />
            <Text style={styles.featureText}>Smart Notifications</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="analytics-outline" size={24} color="#8B5CF6" />
            <Text style={styles.featureText}>Live Analytics</Text>
          </View>
        </View>

        {/* Auth Section */}
        <View style={styles.authSection}>
          <TouchableOpacity testID="google-login-btn" style={styles.googleButton} onPress={handleGoogleLogin}>
            <Ionicons name="logo-google" size={20} color="#FFFFFF" />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or try demo mode</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Role Selection for Demo */}
          <View style={styles.roleSelection}>
            <TouchableOpacity
              testID="demo-passenger-btn"
              style={[styles.roleCard, selectedRole === 'passenger' && styles.roleCardSelected]}
              onPress={() => handleDemoMode('passenger')}
              disabled={isLoading}
            >
              {isLoading && selectedRole === 'passenger' ? (
                <ActivityIndicator color="#3B82F6" />
              ) : (
                <>
                  <Ionicons name="person-outline" size={28} color="#3B82F6" />
                  <Text style={styles.roleTitle}>Passenger</Text>
                  <Text style={styles.roleDesc}>Track your boarding</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              testID="demo-staff-btn"
              style={[styles.roleCard, selectedRole === 'staff' && styles.roleCardSelected]}
              onPress={() => handleDemoMode('staff')}
              disabled={isLoading}
            >
              {isLoading && selectedRole === 'staff' ? (
                <ActivityIndicator color="#22C55E" />
              ) : (
                <>
                  <Ionicons name="briefcase-outline" size={28} color="#22C55E" />
                  <Text style={styles.roleTitle}>Staff</Text>
                  <Text style={styles.roleDesc}>Manage boarding</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              testID="demo-admin-btn"
              style={[styles.roleCard, selectedRole === 'admin' && styles.roleCardSelected]}
              onPress={() => handleDemoMode('admin')}
              disabled={isLoading}
            >
              {isLoading && selectedRole === 'admin' ? (
                <ActivityIndicator color="#8B5CF6" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark-outline" size={28} color="#8B5CF6" />
                  <Text style={styles.roleTitle}>Admin</Text>
                  <Text style={styles.roleDesc}>Full control</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>Optimize your airline operations</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#1E3A5F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 40,
    flexWrap: 'wrap',
  },
  featureItem: {
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  authSection: {
    width: '100%',
    maxWidth: 400,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 12,
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#374151',
  },
  dividerText: {
    color: '#6B7280',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  roleSelection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  roleCard: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#374151',
    minHeight: 110,
    justifyContent: 'center',
  },
  roleCardSelected: {
    borderColor: '#3B82F6',
  },
  roleTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  roleDesc: {
    color: '#6B7280',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  footer: {
    color: '#4B5563',
    fontSize: 12,
    marginTop: 'auto',
    paddingBottom: 24,
  },
});
