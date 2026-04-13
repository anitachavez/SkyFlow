import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../src/store/useStore';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AuthCallback() {
  const { setUser, setSessionToken } = useStore();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    processAuth();
  }, []);

  const processAuth = async () => {
    try {
      let sessionId: string | null = null;

      // Extract session_id from URL hash (web) or params (mobile)
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const hash = window.location.hash;
        if (hash && hash.includes('session_id=')) {
          sessionId = hash.split('session_id=')[1]?.split('&')[0];
        }
      }

      if (!sessionId) {
        console.error('No session_id found');
        router.replace('/');
        return;
      }

      // Exchange session_id for session data via backend
      const response = await fetch(`${BACKEND_URL}/api/auth/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange session');
      }

      const data = await response.json();

      // Store session token
      await AsyncStorage.setItem('session_token', data.session_token);
      setSessionToken(data.session_token);
      setUser(data.user);

      // Navigate based on role
      const role = data.user.role;
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
        default:
          router.replace('/');
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      router.replace('/');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3B82F6" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
