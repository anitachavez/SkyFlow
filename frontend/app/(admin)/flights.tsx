import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore, Flight } from '../../src/store/useStore';
import { Card, Button } from '../../src/components/UI';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function FlightsScreen() {
  const { setCurrentFlight } = useStore();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newFlight, setNewFlight] = useState({
    flight_number: '',
    origin: '',
    destination: '',
    departure_time: '',
    gate: '',
    total_seats: '180',
    aircraft_type: 'Boeing 737',
  });

  useEffect(() => {
    loadFlights();
  }, []);

  const loadFlights = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      const response = await fetch(`${BACKEND_URL}/api/admin/flights`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setFlights(data.flights || []);
      }
    } catch (error) {
      console.error('Failed to load flights:', error);
    }
  };

  const createFlight = async () => {
    if (!newFlight.flight_number || !newFlight.origin || !newFlight.destination) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('session_token');
      const response = await fetch(`${BACKEND_URL}/api/admin/flights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newFlight,
          total_seats: parseInt(newFlight.total_seats),
          departure_time: newFlight.departure_time || new Date(Date.now() + 3600000).toISOString(),
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Flight created successfully');
        setShowModal(false);
        setNewFlight({
          flight_number: '',
          origin: '',
          destination: '',
          departure_time: '',
          gate: '',
          total_seats: '180',
          aircraft_type: 'Boeing 737',
        });
        loadFlights();
      } else {
        Alert.alert('Error', 'Failed to create flight');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred');
    }
    setLoading(false);
  };

  const selectFlight = (flight: Flight) => {
    setCurrentFlight(flight);
    Alert.alert('Flight Selected', `${flight.flight_number} is now the active flight`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'boarding':
        return '#22C55E';
      case 'departed':
        return '#3B82F6';
      case 'arrived':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const renderFlight = ({ item }: { item: Flight }) => (
    <TouchableOpacity style={styles.flightCard} onPress={() => selectFlight(item)}>
      <View style={styles.flightHeader}>
        <Text style={styles.flightNumber}>{item.flight_number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>
      <View style={styles.flightRoute}>
        <Text style={styles.routeText}>{item.origin}</Text>
        <Ionicons name="arrow-forward" size={16} color="#6B7280" />
        <Text style={styles.routeText}>{item.destination}</Text>
      </View>
      <View style={styles.flightDetails}>
        <Text style={styles.detailText}>Gate {item.gate}</Text>
        <Text style={styles.detailText}>{item.total_seats} seats</Text>
        <Text style={styles.detailText}>{item.aircraft_type}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Flight Management</Text>
          <Text style={styles.subtitle}>{flights.length} flights</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={flights}
        renderItem={renderFlight}
        keyExtractor={(item) => item.flight_id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="airplane-outline" size={64} color="#374151" />
            <Text style={styles.emptyTitle}>No Flights</Text>
            <Text style={styles.emptyText}>Create your first flight to get started</Text>
          </View>
        }
      />

      {/* Create Flight Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Flight</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Flight Number *</Text>
                <TextInput
                  style={styles.input}
                  value={newFlight.flight_number}
                  onChangeText={(text) => setNewFlight({ ...newFlight, flight_number: text })}
                  placeholder="e.g., SK101"
                  placeholderTextColor="#6B7280"
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Origin *</Text>
                  <TextInput
                    style={styles.input}
                    value={newFlight.origin}
                    onChangeText={(text) => setNewFlight({ ...newFlight, origin: text.toUpperCase() })}
                    placeholder="JFK"
                    placeholderTextColor="#6B7280"
                    maxLength={3}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Destination *</Text>
                  <TextInput
                    style={styles.input}
                    value={newFlight.destination}
                    onChangeText={(text) => setNewFlight({ ...newFlight, destination: text.toUpperCase() })}
                    placeholder="LAX"
                    placeholderTextColor="#6B7280"
                    maxLength={3}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Gate</Text>
                  <TextInput
                    style={styles.input}
                    value={newFlight.gate}
                    onChangeText={(text) => setNewFlight({ ...newFlight, gate: text })}
                    placeholder="A12"
                    placeholderTextColor="#6B7280"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Seats</Text>
                  <TextInput
                    style={styles.input}
                    value={newFlight.total_seats}
                    onChangeText={(text) => setNewFlight({ ...newFlight, total_seats: text })}
                    placeholder="180"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Aircraft Type</Text>
                <TextInput
                  style={styles.input}
                  value={newFlight.aircraft_type}
                  onChangeText={(text) => setNewFlight({ ...newFlight, aircraft_type: text })}
                  placeholder="Boeing 737"
                  placeholderTextColor="#6B7280"
                />
              </View>

              <View style={styles.modalActions}>
                <Button title="Cancel" onPress={() => setShowModal(false)} variant="secondary" />
                <Button title="Create Flight" onPress={createFlight} variant="primary" loading={loading} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
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
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
  },
  flightCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  flightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  flightNumber: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  flightRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  routeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  flightDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailText: {
    color: '#6B7280',
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  modalScroll: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 40,
  },
});
