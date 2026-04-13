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
import { useStore, Flight, Passenger, PassengerStatus } from '../../src/store/useStore';
import { StatusBadge, PriorityBadge } from '../../src/components/StatusBadge';
import { Card, StatCard } from '../../src/components/UI';
import { database, ref, onValue } from '../../src/services/firebase';
import { format } from 'date-fns';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const statusMessages: Record<PassengerStatus, { title: string; message: string; icon: keyof typeof Ionicons.glyphMap }> = {
  checked_in: { title: 'Checked In', message: 'You\'re all set! Wait for boarding to begin.', icon: 'checkmark-circle' },
  waiting: { title: 'Get Ready', message: 'Boarding will start soon. Stay near the gate.', icon: 'time' },
  boarding: { title: 'Board Now!', message: 'It\'s your turn! Please proceed to the gate.', icon: 'enter' },
  seated: { title: 'Seated', message: 'You\'re on board. Enjoy your flight!', icon: 'airplane' },
  deboarding: { title: 'Deboarding', message: 'Please gather your belongings and exit.', icon: 'exit' },
  exited: { title: 'Complete', message: 'Thank you for flying with us!', icon: 'checkmark-done' },
};

export default function PassengerHome() {
  const { user, currentFlight, setCurrentFlight, passengers, setPassengers, addNotification } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [myBooking, setMyBooking] = useState<Passenger | null>(null);

  useEffect(() => {
    loadFlightData();
    setupRealtimeListeners();
  }, [user]);

  const loadFlightData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/passenger/my-booking`, {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentFlight(data.flight);
        setMyBooking(data.passenger);
        setPassengers(data.all_passengers || []);
      }
    } catch (error) {
      console.error('Failed to load flight data:', error);
    }
  };

  const getToken = async () => {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    return AsyncStorage.getItem('session_token');
  };

  const setupRealtimeListeners = () => {
    if (!currentFlight?.flight_id) return;

    // Listen for flight updates
    const flightRef = ref(database, `flights/${currentFlight.flight_id}`);
    const unsubscribeFlight = onValue(flightRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCurrentFlight({ ...currentFlight, ...data });
      }
    });

    // Listen for passenger updates
    const passengerRef = ref(database, `flights/${currentFlight.flight_id}/passengers`);
    const unsubscribePassengers = onValue(passengerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const passengerList = Object.values(data) as Passenger[];
        setPassengers(passengerList);
        
        // Update my booking
        const myData = passengerList.find(p => p.user_id === user?.user_id);
        if (myData && myData.status !== myBooking?.status) {
          setMyBooking(myData);
          // Add notification for status change
          const statusInfo = statusMessages[myData.status];
          addNotification({
            id: Date.now().toString(),
            title: statusInfo.title,
            message: statusInfo.message,
            timestamp: new Date().toISOString(),
            read: false,
            type: myData.status === 'boarding' ? 'boarding' : myData.status === 'deboarding' ? 'deboarding' : 'info',
          });
        }
      }
    });

    return () => {
      // Cleanup listeners would go here
    };
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFlightData();
    setRefreshing(false);
  }, []);

  const currentStatus = myBooking?.status || 'checked_in';
  const statusInfo = statusMessages[currentStatus];

  // Calculate boarding progress
  const seatedCount = passengers.filter(p => p.status === 'seated').length;
  const totalPassengers = passengers.length || 1;
  const progress = (seatedCount / totalPassengers) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome,</Text>
          <Text style={styles.userName}>{user?.name || 'Passenger'}</Text>
        </View>

        {/* Status Card */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIcon, { backgroundColor: currentStatus === 'boarding' ? '#22C55E20' : '#3B82F620' }]}>
              <Ionicons
                name={statusInfo.icon}
                size={32}
                color={currentStatus === 'boarding' ? '#22C55E' : '#3B82F6'}
              />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>{statusInfo.title}</Text>
              <Text style={styles.statusMessage}>{statusInfo.message}</Text>
            </View>
          </View>
          {myBooking && (
            <View style={styles.badgeRow}>
              <StatusBadge status={myBooking.status} />
              <PriorityBadge priority={myBooking.priority} />
            </View>
          )}
        </Card>

        {/* Flight Info */}
        {currentFlight && (
          <Card style={styles.flightCard}>
            <View style={styles.flightHeader}>
              <Text style={styles.flightNumber}>{currentFlight.flight_number}</Text>
              <View style={styles.flightStatusBadge}>
                <Text style={styles.flightStatusText}>
                  {currentFlight.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
            
            <View style={styles.flightRoute}>
              <View style={styles.cityBlock}>
                <Text style={styles.cityCode}>{currentFlight.origin}</Text>
                <Text style={styles.cityLabel}>Departure</Text>
              </View>
              
              <View style={styles.routeLine}>
                <View style={styles.line} />
                <Ionicons name="airplane" size={20} color="#3B82F6" />
                <View style={styles.line} />
              </View>
              
              <View style={styles.cityBlock}>
                <Text style={styles.cityCode}>{currentFlight.destination}</Text>
                <Text style={styles.cityLabel}>Arrival</Text>
              </View>
            </View>

            <View style={styles.flightDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text style={styles.detailText}>
                  {format(new Date(currentFlight.departure_time), 'HH:mm')}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={16} color="#6B7280" />
                <Text style={styles.detailText}>Gate {currentFlight.gate}</Text>
              </View>
              {myBooking && (
                <View style={styles.detailItem}>
                  <Ionicons name="grid-outline" size={16} color="#6B7280" />
                  <Text style={styles.detailText}>Seat {myBooking.seat_number}</Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Boarding Progress */}
        <Card style={styles.progressCard}>
          <Text style={styles.progressTitle}>Boarding Progress</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          <View style={styles.progressStats}>
            <Text style={styles.progressText}>{seatedCount} of {totalPassengers} passengers seated</Text>
            <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
          </View>
        </Card>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <StatCard
            title="Your Zone"
            value={myBooking?.zone || '-'}
            icon="layers-outline"
            iconColor="#8B5CF6"
          />
          <StatCard
            title="Position"
            value={myBooking ? `Row ${myBooking.row}` : '-'}
            icon="git-commit-outline"
            iconColor="#F59E0B"
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
    paddingTop: 20,
    paddingBottom: 24,
  },
  greeting: {
    color: '#6B7280',
    fontSize: 16,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  statusCard: {
    marginBottom: 16,
    backgroundColor: '#1E293B',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusMessage: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  flightCard: {
    marginBottom: 16,
  },
  flightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  flightNumber: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  flightStatusBadge: {
    backgroundColor: '#22C55E20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  flightStatusText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '600',
  },
  flightRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cityBlock: {
    alignItems: 'center',
  },
  cityCode: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  cityLabel: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
  routeLine: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: '#374151',
  },
  flightDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  progressCard: {
    marginBottom: 16,
  },
  progressTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressText: {
    color: '#6B7280',
    fontSize: 13,
  },
  progressPercent: {
    color: '#22C55E',
    fontSize: 13,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
});
