import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore, Flight } from '../../src/store/useStore';
import { StatCard, Card, Button } from '../../src/components/UI';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AdminDashboard() {
  const { user, logout } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalFlights: 0,
    activeFlights: 0,
    totalPassengers: 0,
    avgBoardingTime: 0,
  });
  const [recentFlights, setRecentFlights] = useState<Flight[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      const response = await fetch(`${BACKEND_URL}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentFlights(data.recent_flights || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('session_token');
    logout();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Admin Dashboard</Text>
            <Text style={styles.userName}>{user?.name || 'Administrator'}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Flights"
            value={stats.totalFlights}
            icon="airplane"
            iconColor="#8B5CF6"
          />
          <StatCard
            title="Active Now"
            value={stats.activeFlights}
            icon="radio-button-on"
            iconColor="#22C55E"
          />
          <StatCard
            title="Passengers Today"
            value={stats.totalPassengers}
            icon="people"
            iconColor="#3B82F6"
          />
          <StatCard
            title="Avg Board Time"
            value={`${stats.avgBoardingTime}m`}
            icon="time"
            iconColor="#F59E0B"
          />
        </View>

        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(admin)/flights')}>
              <Ionicons name="add-circle" size={28} color="#8B5CF6" />
              <Text style={styles.actionText}>New Flight</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(admin)/analytics')}>
              <Ionicons name="bar-chart" size={28} color="#22C55E" />
              <Text style={styles.actionText}>Reports</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="people" size={28} color="#3B82F6" />
              <Text style={styles.actionText}>Staff</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(admin)/settings')}>
              <Ionicons name="settings" size={28} color="#F59E0B" />
              <Text style={styles.actionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Recent Flights */}
        <Card style={styles.recentCard}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent Flights</Text>
            <TouchableOpacity onPress={() => router.push('/(admin)/flights')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentFlights.length > 0 ? (
            recentFlights.slice(0, 5).map((flight) => (
              <View key={flight.flight_id} style={styles.flightItem}>
                <View style={styles.flightInfo}>
                  <Text style={styles.flightNumber}>{flight.flight_number}</Text>
                  <Text style={styles.flightRoute}>
                    {flight.origin} → {flight.destination}
                  </Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: 
                  flight.status === 'boarding' ? '#22C55E' :
                  flight.status === 'departed' ? '#3B82F6' :
                  '#6B7280'
                }]} />
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No recent flights</Text>
          )}
        </Card>

        {/* System Status */}
        <Card style={styles.systemCard}>
          <Text style={styles.sectionTitle}>System Status</Text>
          <View style={styles.systemItem}>
            <Ionicons name="server" size={20} color="#22C55E" />
            <Text style={styles.systemText}>Backend Server</Text>
            <Text style={styles.systemStatus}>Online</Text>
          </View>
          <View style={styles.systemItem}>
            <Ionicons name="cloud" size={20} color="#22C55E" />
            <Text style={styles.systemText}>Firebase Database</Text>
            <Text style={styles.systemStatus}>Connected</Text>
          </View>
          <View style={styles.systemItem}>
            <Ionicons name="notifications" size={20} color="#22C55E" />
            <Text style={styles.systemText}>Push Notifications</Text>
            <Text style={styles.systemStatus}>Active</Text>
          </View>
        </Card>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
  },
  greeting: {
    color: '#6B7280',
    fontSize: 14,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  logoutBtn: {
    padding: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  actionsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    width: '23%',
  },
  actionText: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },
  recentCard: {
    marginBottom: 16,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '500',
  },
  flightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  flightInfo: {
    flex: 1,
  },
  flightNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  flightRoute: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  systemCard: {
    marginBottom: 24,
  },
  systemItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    gap: 12,
  },
  systemText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  systemStatus: {
    color: '#22C55E',
    fontSize: 13,
    fontWeight: '500',
  },
});
