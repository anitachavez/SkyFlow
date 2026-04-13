import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore, PassengerPriority } from '../../src/store/useStore';
import { Aircraft3D } from '../../src/components/Aircraft3D';
import { SeatMap } from '../../src/components/SeatMap';
import { Card } from '../../src/components/UI';
import { getBoardingStats } from '../../src/utils/boardingLogic';

export default function AircraftScreen() {
  const { passengers, currentFlight } = useStore();
  const [selectedZone, setSelectedZone] = useState<number | undefined>();
  const [view, setView] = useState<'3d' | '2d'>('3d');
  const [selectedPassenger, setSelectedPassenger] = useState<any>(null);

  const stats = getBoardingStats(passengers);
  const totalRows = currentFlight?.total_seats ? Math.ceil(currentFlight.total_seats / 6) : 30;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Aircraft View</Text>
          <Text style={styles.subtitle}>
            {currentFlight?.aircraft_type || 'Boeing 737'} • {currentFlight?.total_seats || 180} seats
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statItem, { borderColor: '#22C55E' }]}>
            <Text style={[styles.statValue, { color: '#22C55E' }]}>{stats.seated}</Text>
            <Text style={styles.statLabel}>Seated</Text>
          </View>
          <View style={[styles.statItem, { borderColor: '#EAB308' }]}>
            <Text style={[styles.statValue, { color: '#EAB308' }]}>{stats.boarding}</Text>
            <Text style={styles.statLabel}>Boarding</Text>
          </View>
          <View style={[styles.statItem, { borderColor: '#EF4444' }]}>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.waiting + stats.checkedIn}</Text>
            <Text style={styles.statLabel}>Waiting</Text>
          </View>
        </View>

        {/* View Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, view === '3d' && styles.toggleButtonActive]}
            onPress={() => setView('3d')}
          >
            <Ionicons name="cube" size={18} color={view === '3d' ? '#FFFFFF' : '#6B7280'} />
            <Text style={[styles.toggleText, view === '3d' && styles.toggleTextActive]}>3D View</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, view === '2d' && styles.toggleButtonActive]}
            onPress={() => setView('2d')}
          >
            <Ionicons name="grid" size={18} color={view === '2d' ? '#FFFFFF' : '#6B7280'} />
            <Text style={[styles.toggleText, view === '2d' && styles.toggleTextActive]}>2D View</Text>
          </TouchableOpacity>
        </View>

        {/* Zone Filter */}
        <View style={styles.zoneFilter}>
          <Text style={styles.filterLabel}>Filter by Zone:</Text>
          <View style={styles.zoneButtons}>
            <TouchableOpacity
              style={[styles.zoneButton, !selectedZone && styles.zoneButtonActive]}
              onPress={() => setSelectedZone(undefined)}
            >
              <Text style={[styles.zoneButtonText, !selectedZone && styles.zoneButtonTextActive]}>All</Text>
            </TouchableOpacity>
            {[1, 2, 3, 4].map((zone) => (
              <TouchableOpacity
                key={zone}
                style={[styles.zoneButton, selectedZone === zone && styles.zoneButtonActive]}
                onPress={() => setSelectedZone(zone)}
              >
                <Text style={[styles.zoneButtonText, selectedZone === zone && styles.zoneButtonTextActive]}>
                  {zone}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Aircraft Visualization */}
        <Card style={styles.aircraftCard}>
          {view === '3d' ? (
            <Aircraft3D
              passengers={passengers}
              totalRows={totalRows}
              selectedZone={selectedZone}
              onSeatPress={(p) => setSelectedPassenger(p)}
            />
          ) : (
            <SeatMap
              passengers={passengers}
              totalRows={totalRows}
              seatsPerRow={6}
              filterZone={selectedZone}
              onSeatPress={(p) => setSelectedPassenger(p)}
            />
          )}
        </Card>

        {/* Selected Passenger Info */}
        {selectedPassenger && (
          <Card style={styles.passengerCard}>
            <View style={styles.passengerHeader}>
              <Text style={styles.passengerName}>{selectedPassenger.name}</Text>
              <TouchableOpacity onPress={() => setSelectedPassenger(null)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.passengerDetails}>
              <View style={styles.passengerDetail}>
                <Text style={styles.detailLabel}>Seat</Text>
                <Text style={styles.detailValue}>{selectedPassenger.seat_number}</Text>
              </View>
              <View style={styles.passengerDetail}>
                <Text style={styles.detailLabel}>Zone</Text>
                <Text style={styles.detailValue}>{selectedPassenger.zone}</Text>
              </View>
              <View style={styles.passengerDetail}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={styles.detailValue}>{selectedPassenger.status}</Text>
              </View>
              <View style={styles.passengerDetail}>
                <Text style={styles.detailLabel}>Priority</Text>
                <Text style={styles.detailValue}>{selectedPassenger.priority}</Text>
              </View>
            </View>
          </Card>
        )}
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    borderWidth: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#374151',
  },
  toggleText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  zoneFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    marginRight: 12,
  },
  zoneButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  zoneButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1F2937',
  },
  zoneButtonActive: {
    backgroundColor: '#3B82F6',
  },
  zoneButtonText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '500',
  },
  zoneButtonTextActive: {
    color: '#FFFFFF',
  },
  aircraftCard: {
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
  },
  passengerCard: {
    marginBottom: 24,
  },
  passengerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  passengerName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  passengerDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  passengerDetail: {
    minWidth: 80,
  },
  detailLabel: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 2,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});
