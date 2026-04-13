import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore, PassengerPriority, BoardingPhase } from '../../src/store/useStore';
import { Card, Button } from '../../src/components/UI';
import { getNextBoardingGroup, getBoardingStats } from '../../src/utils/boardingLogic';
import { database, ref, update, set } from '../../src/services/firebase';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const boardingPhases: { phase: BoardingPhase; label: string }[] = [
  { phase: 'not_started', label: 'Not Started' },
  { phase: 'priority', label: 'Priority Boarding' },
  { phase: 'zone_1', label: 'Zone 1' },
  { phase: 'zone_2', label: 'Zone 2' },
  { phase: 'zone_3', label: 'Zone 3' },
  { phase: 'zone_4', label: 'Zone 4' },
  { phase: 'complete', label: 'Complete' },
];

const priorityGroups: { priority: PassengerPriority; label: string; icon: string }[] = [
  { priority: 'disability', label: 'Special Assistance', icon: 'accessibility' },
  { priority: 'family', label: 'Families', icon: 'people' },
  { priority: 'first_class', label: 'First Class', icon: 'star' },
  { priority: 'connection', label: 'Connections', icon: 'git-branch' },
  { priority: 'standard', label: 'Standard', icon: 'person' },
];

export default function ControlScreen() {
  const { currentFlight, setCurrentFlight, passengers, setPassengers } = useStore();
  const [loading, setLoading] = useState<string | null>(null);

  const stats = getBoardingStats(passengers);
  const nextGroup = currentFlight ? getNextBoardingGroup(passengers, currentFlight.boarding_phase) : null;

  const updateFlightStatus = async (status: string) => {
    if (!currentFlight) return;
    setLoading(status);
    try {
      const token = await AsyncStorage.getItem('session_token');
      const response = await fetch(`${BACKEND_URL}/api/staff/flight/${currentFlight.flight_id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setCurrentFlight({ ...currentFlight, status: status as any });
        // Update Firebase
        await update(ref(database, `flights/${currentFlight.flight_id}`), { status });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update flight status');
    }
    setLoading(null);
  };

  const updateBoardingPhase = async (phase: BoardingPhase) => {
    if (!currentFlight) return;
    setLoading(phase);
    try {
      const token = await AsyncStorage.getItem('session_token');
      const response = await fetch(`${BACKEND_URL}/api/staff/flight/${currentFlight.flight_id}/phase`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ boarding_phase: phase }),
      });

      if (response.ok) {
        setCurrentFlight({ ...currentFlight, boarding_phase: phase });
        await update(ref(database, `flights/${currentFlight.flight_id}`), { boarding_phase: phase });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update boarding phase');
    }
    setLoading(null);
  };

  const notifyGroup = async (priority: PassengerPriority) => {
    if (!currentFlight) return;
    setLoading(priority);
    try {
      const token = await AsyncStorage.getItem('session_token');
      await fetch(`${BACKEND_URL}/api/staff/notify-group`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          flight_id: currentFlight.flight_id,
          priority,
          message: 'Please proceed to the gate for boarding.',
        }),
      });

      // Update passengers to 'boarding' status
      const groupPassengers = passengers.filter(
        p => p.priority === priority && (p.status === 'waiting' || p.status === 'checked_in')
      );

      for (const p of groupPassengers) {
        await update(ref(database, `flights/${currentFlight.flight_id}/passengers/${p.passenger_id}`), {
          status: 'boarding',
        });
      }

      setPassengers(
        passengers.map(p =>
          groupPassengers.find(gp => gp.passenger_id === p.passenger_id)
            ? { ...p, status: 'boarding' }
            : p
        )
      );

      Alert.alert('Success', `Notified ${groupPassengers.length} passengers`);
    } catch (error) {
      Alert.alert('Error', 'Failed to send notifications');
    }
    setLoading(null);
  };

  const notifyZone = async (zone: number) => {
    if (!currentFlight) return;
    setLoading(`zone_${zone}`);
    try {
      const token = await AsyncStorage.getItem('session_token');
      await fetch(`${BACKEND_URL}/api/staff/notify-zone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          flight_id: currentFlight.flight_id,
          zone,
          message: `Zone ${zone} - Please proceed to the gate for boarding.`,
        }),
      });

      const zonePassengers = passengers.filter(
        p => p.zone === zone && (p.status === 'waiting' || p.status === 'checked_in')
      );

      for (const p of zonePassengers) {
        await update(ref(database, `flights/${currentFlight.flight_id}/passengers/${p.passenger_id}`), {
          status: 'boarding',
        });
      }

      setPassengers(
        passengers.map(p =>
          zonePassengers.find(zp => zp.passenger_id === p.passenger_id)
            ? { ...p, status: 'boarding' }
            : p
        )
      );

      Alert.alert('Success', `Notified ${zonePassengers.length} passengers in Zone ${zone}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to send zone notifications');
    }
    setLoading(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Boarding Control</Text>
          <Text style={styles.subtitle}>{currentFlight?.flight_number || 'No flight selected'}</Text>
        </View>

        {/* Flight Status Controls */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Flight Status</Text>
          <View style={styles.statusButtons}>
            {['scheduled', 'boarding', 'deboarding', 'departed'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusButton,
                  currentFlight?.status === status && styles.statusButtonActive,
                ]}
                onPress={() => updateFlightStatus(status)}
                disabled={loading !== null}
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    currentFlight?.status === status && styles.statusButtonTextActive,
                  ]}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Boarding Phase */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Boarding Phase</Text>
          <View style={styles.phaseContainer}>
            {boardingPhases.map((item) => (
              <TouchableOpacity
                key={item.phase}
                style={[
                  styles.phaseButton,
                  currentFlight?.boarding_phase === item.phase && styles.phaseButtonActive,
                ]}
                onPress={() => updateBoardingPhase(item.phase)}
                disabled={loading !== null}
              >
                <Text
                  style={[
                    styles.phaseButtonText,
                    currentFlight?.boarding_phase === item.phase && styles.phaseButtonTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* AI Recommendation */}
        {nextGroup && nextGroup.nextGroup !== 'Complete' && (
          <Card style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <Ionicons name="bulb" size={20} color="#F59E0B" />
              <Text style={styles.recommendationTitle}>Recommended Next</Text>
            </View>
            <Text style={styles.recommendationGroup}>{nextGroup.nextGroup}</Text>
            <Text style={styles.recommendationReason}>{nextGroup.reason}</Text>
            <Button
              title={`Call ${nextGroup.nextGroup}`}
              onPress={() => {
                if (nextGroup.nextGroup.startsWith('Zone')) {
                  const zone = parseInt(nextGroup.nextGroup.split(' ')[1]);
                  notifyZone(zone);
                } else {
                  // Find matching priority
                  const priority = priorityGroups.find(p => 
                    nextGroup.nextGroup.toLowerCase().includes(p.label.toLowerCase())
                  );
                  if (priority) notifyGroup(priority.priority);
                }
              }}
              variant="success"
              icon="megaphone"
              loading={loading !== null}
            />
          </Card>
        )}

        {/* Priority Group Notifications */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Notify Priority Groups</Text>
          <View style={styles.priorityGrid}>
            {priorityGroups.map((item) => {
              const count = passengers.filter(
                p => p.priority === item.priority && (p.status === 'waiting' || p.status === 'checked_in')
              ).length;
              return (
                <TouchableOpacity
                  key={item.priority}
                  style={styles.priorityButton}
                  onPress={() => notifyGroup(item.priority)}
                  disabled={loading !== null || count === 0}
                >
                  <Ionicons name={item.icon as any} size={24} color={count > 0 ? '#FFFFFF' : '#6B7280'} />
                  <Text style={[styles.priorityLabel, count === 0 && styles.disabledText]}>
                    {item.label}
                  </Text>
                  <Text style={styles.priorityCount}>{count} waiting</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Zone Notifications */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Notify by Zone</Text>
          <View style={styles.zoneGrid}>
            {[1, 2, 3, 4].map((zone) => {
              const count = passengers.filter(
                p => p.zone === zone && (p.status === 'waiting' || p.status === 'checked_in')
              ).length;
              return (
                <TouchableOpacity
                  key={zone}
                  style={[styles.zoneButton, count === 0 && styles.zoneButtonDisabled]}
                  onPress={() => notifyZone(zone)}
                  disabled={loading !== null || count === 0}
                >
                  <Text style={styles.zoneNumber}>Zone {zone}</Text>
                  <Text style={styles.zoneCount}>{count}</Text>
                </TouchableOpacity>
              );
            })}
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
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  statusButtonActive: {
    backgroundColor: '#22C55E',
  },
  statusButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
  },
  phaseContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  phaseButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  phaseButtonActive: {
    backgroundColor: '#3B82F620',
    borderColor: '#3B82F6',
  },
  phaseButtonText: {
    color: '#6B7280',
    fontSize: 13,
  },
  phaseButtonTextActive: {
    color: '#3B82F6',
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
    marginBottom: 8,
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
    fontSize: 13,
    marginBottom: 12,
  },
  priorityGrid: {
    gap: 12,
  },
  priorityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    gap: 12,
  },
  priorityLabel: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  priorityCount: {
    color: '#6B7280',
    fontSize: 13,
  },
  disabledText: {
    color: '#6B7280',
  },
  zoneGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  zoneButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#3B82F620',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  zoneButtonDisabled: {
    backgroundColor: '#37415120',
    borderColor: '#374151',
  },
  zoneNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  zoneCount: {
    color: '#3B82F6',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
  },
});
