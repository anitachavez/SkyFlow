import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Passenger, PassengerStatus, PassengerPriority } from '../store/useStore';

interface SeatMapProps {
  passengers: Passenger[];
  totalRows: number;
  seatsPerRow: number; // e.g., 6 for A-B-C | D-E-F
  onSeatPress?: (passenger: Passenger) => void;
  filterZone?: number;
  filterPriority?: PassengerPriority;
}

const getSeatColor = (status: PassengerStatus): string => {
  switch (status) {
    case 'seated':
      return '#22C55E'; // Green
    case 'boarding':
      return '#EAB308'; // Yellow
    case 'deboarding':
      return '#F97316'; // Orange
    case 'exited':
      return '#6B7280'; // Gray
    default:
      return '#EF4444'; // Red
  }
};

const getSeatLabel = (row: number, seatIndex: number): string => {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  return `${row}${letters[seatIndex]}`;
};

export const SeatMap: React.FC<SeatMapProps> = ({
  passengers,
  totalRows,
  seatsPerRow,
  onSeatPress,
  filterZone,
  filterPriority,
}) => {
  // Create a map for quick passenger lookup by seat
  const seatMap = new Map<string, Passenger>();
  passengers.forEach((p) => {
    seatMap.set(p.seat_number, p);
  });

  // Filter passengers if needed
  const filteredPassengers = passengers.filter((p) => {
    if (filterZone && p.zone !== filterZone) return false;
    if (filterPriority && p.priority !== filterPriority) return false;
    return true;
  });

  const filteredSeatSet = new Set(filteredPassengers.map((p) => p.seat_number));

  const renderSeat = (row: number, seatIndex: number) => {
    const seatNumber = getSeatLabel(row, seatIndex);
    const passenger = seatMap.get(seatNumber);
    const isFiltered = filterZone || filterPriority ? filteredSeatSet.has(seatNumber) : true;

    const backgroundColor = passenger
      ? isFiltered
        ? getSeatColor(passenger.status)
        : '#374151'
      : '#1F2937';

    return (
      <TouchableOpacity
        key={seatNumber}
        style={[styles.seat, { backgroundColor }]}
        onPress={() => passenger && onSeatPress?.(passenger)}
        disabled={!passenger}
      >
        <Text style={[styles.seatText, !isFiltered && styles.dimmedText]}>
          {seatNumber}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderRow = (row: number) => {
    return (
      <View key={row} style={styles.row}>
        {/* Left side (A, B, C) */}
        <View style={styles.seatGroup}>
          {[0, 1, 2].map((i) => renderSeat(row, i))}
        </View>
        
        {/* Aisle */}
        <View style={styles.aisle}>
          <Text style={styles.rowNumber}>{row}</Text>
        </View>
        
        {/* Right side (D, E, F) */}
        <View style={styles.seatGroup}>
          {[3, 4, 5].map((i) => renderSeat(row, i))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Aircraft nose */}
      <View style={styles.nose}>
        <Text style={styles.noseText}>✈️ COCKPIT</Text>
      </View>
      
      {/* First class section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>First Class</Text>
      </View>
      
      <ScrollView style={styles.cabin} showsVerticalScrollIndicator={false}>
        {Array.from({ length: totalRows }, (_, i) => i + 1).map((row) => renderRow(row))}
      </ScrollView>
      
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#22C55E' }]} />
          <Text style={styles.legendText}>Seated</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#EAB308' }]} />
          <Text style={styles.legendText}>Boarding</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.legendText}>Not Boarded</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: '#374151',
  },
  nose: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    marginBottom: 8,
  },
  noseText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 8,
  },
  sectionLabel: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cabin: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 3,
  },
  seatGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  aisle: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowNumber: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '500',
  },
  seat: {
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  seatText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
  },
  dimmedText: {
    opacity: 0.3,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    color: '#9CA3AF',
    fontSize: 11,
  },
});
