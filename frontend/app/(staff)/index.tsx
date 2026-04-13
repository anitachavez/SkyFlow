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
import { useStore, Flight, Passenger } from '../../src/store/useStore';
import { StatCard, Card, Button } from '../../src/components/UI';
import { getBoardingStats, getNextBoardingGroup } from '../../src/utils/boardingLogic';
import { database, ref, onValue } from '../../src/services/firebase';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function StaffDashboard() {
  const { user, currentFlight, setCurrentFlight, passengers, setPassengers, logout } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    loadFlightData();
    setupRealtimeListeners();
  }, []);

  const loadFlightData = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      const response = await fetch(`${BACKEND_URL}/api/staff/current-flight`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentFlight(data.flight);
        setPassengers(data.passengers || []);
        checkAlerts(data.passengers || [], data.flight);
      }
    } catch (error) {
      console.error('Failed to load flight data:', error);
    }
  };

  const setupRealtimeListeners = () => {
    if (!currentFlight?.flight_id) return;

    const flightRef = ref(database, `flights/${currentFlight.flight_id}`);
    onValue(flightRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCurrentFlight({ ...currentFlight, ...data });
      }
    });

    const passengerRef = ref(database, `flights/${currentFlight.flight_id}/passengers`);
    onValue(passengerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const passengerList = Object.values(data) as Passenger[];
        setPassengers(passengerList);
        checkAlerts(passengerList, currentFlight);
      }
    });
  };

  const checkAlerts = (passengerList: Passenger[], flight: Flight | null) => {
    const newAlerts: string[] = [];
    
    // Check for missing passengers (checked in but not at gate)
    const notBoardedCount = passengerList.filter(
      p => p.status === 'checked_in' || p.status === 'waiting'
    ).length;
    
    if (flight?.status === 'boarding' && notBoardedCount > 10) {
      newAlerts.push(`${notBoardedCount} passengers still not boarded`);
    }

    // Check for congestion
    const boardingCount = passengerList.filter(p => p.status === 'boarding').length;
    if (boardingCount > 5) {
      newAlerts.push('Congestion detected - consider slowing boarding');
    }

    setAlerts(newAlerts);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFlightData();
    setRefreshing(false);
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('session_token');
    logout();
    router.replace('/');
  };

  const stats = getBoardingStats(passengers);
  const nextGroup = currentFlight ? getNextBoardingGroup(passengers, currentFlight.boarding_phase) : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Staff Dashboard</Text>
            <Text style={styles.userName}>{user?.name || 'Staff Member'}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Flight Info */}
        {currentFlight && (
          <Card style={styles.flightCard}>
            <View style={styles.flightHeader}>
              <Text style={styles.flightNumber}>{currentFlight.flight_number}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {currentFlight.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.flightRoute}>
              {currentFlight.origin} → {currentFlight.destination} • Gate {currentFlight.gate}
            </Text>
          </Card>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Total"
            value={stats.total}
            icon="people"
            iconColor="#3B82F6"
          />
          <StatCard
            title="Seated"
            value={stats.seated}
            icon="checkmark-circle"
            iconColor="#22C55E"
          />
          <StatCard
            title="Boarding"
            value={stats.boarding}
            icon="enter"
            iconColor="#F59E0B"
          />
          <StatCard
            title="Waiting"
            value={stats.waiting + stats.checkedIn}
            icon="time"
            iconColor="#EF4444"
          />
        </View>

        {/* Progress */}
        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Boarding Progress</Text>
            <Text style={styles.progressPercent}>{stats.boardingPercentage}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${stats.boardingPercentage}%` }]} />
          </View>
        </Card>

        {/* Next Group Recommendation */}
        {nextGroup && nextGroup.nextGroup !== 'Complete' && (
          <Card style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <Ionicons name="bulb" size={24} color="#F59E0B" />
              <Text style={styles.recommendationTitle}>AI Recommendation</Text>
            </View>
            <Text style={styles.recommendationGroup}>Next: {nextGroup.nextGroup}</Text>
            <Text style={styles.recommendationReason}>{nextGroup.reason}</Text>
            <Text style={styles.recommendationPassengers}>
              {nextGroup.passengers.length} passengers • ~{nextGroup.estimatedTime} min
            </Text>
          </Card>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <Card style={styles.alertsCard}>
            <View style={styles.alertsHeader}>
              <Ionicons name="warning" size={24} color="#EF4444" />
              <Text style={styles.alertsTitle}>Active Alerts</Text>
            </View>
            {alerts.map((alert, index) => (
              <View key={index} style={styles.alertItem}>
                <Text style={styles.alertText}>{alert}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Quick Actions */}
        <View style={styles.actions}>
          <Button
            title="View Aircraft"
            onPress={() => router.push('/(staff)/aircraft')}
            variant="primary"
            icon="airplane"
          />
          <Button
            title="Scan Boarding Pass"
            onPress={() => router.push('/(staff)/scanner')}
            variant="secondary"
            icon="scan"
          />
        </View>
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
  flightCard: {
    marginBottom: 16,
    backgroundColor: '#1E3A5F',
    borderColor: '#3B82F6',
  },
  flightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  flightNumber: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  statusBadge: {
    backgroundColor: '#22C55E20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '600',
  },
  flightRoute: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  progressCard: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  progressPercent: {
    color: '#22C55E',
    fontSize: 18,
    fontWeight: '700',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#374151',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 6,
  },
  recommendationCard: {
    marginBottom: 16,
    backgroundColor: '#78350F20',
    borderColor: '#F59E0B40',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  recommendationTitle: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '600',
  },
  recommendationGroup: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  recommendationReason: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 8,
  },
  recommendationPassengers: {
    color: '#6B7280',
    fontSize: 12,
  },
  alertsCard: {
    marginBottom: 16,
    backgroundColor: '#7F1D1D20',
    borderColor: '#EF444440',
  },
  alertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  alertsTitle: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  alertItem: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  alertText: {
    color: '#FCA5A5',
    fontSize: 14,
  },
  actions: {
    gap: 12,
    marginBottom: 24,
  },
});
