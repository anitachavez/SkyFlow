import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Passenger, Flight } from '../store/useStore';
import { StatusBadge, PriorityBadge } from './StatusBadge';

interface BoardingPassProps {
  passenger: Passenger;
  flight: Flight;
}

export const BoardingPass: React.FC<BoardingPassProps> = ({ passenger, flight }) => {
  const qrData = JSON.stringify({
    passenger_id: passenger.passenger_id,
    flight_id: flight.flight_id,
    seat: passenger.seat_number,
    name: passenger.name,
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.airline}>SkyFlow Airlines</Text>
        <Text style={styles.boardingText}>BOARDING PASS</Text>
      </View>

      {/* Flight Info */}
      <View style={styles.flightInfo}>
        <View style={styles.cityInfo}>
          <Text style={styles.cityCode}>{flight.origin}</Text>
          <Text style={styles.cityLabel}>From</Text>
        </View>
        
        <View style={styles.flightPath}>
          <View style={styles.line} />
          <View style={styles.planeIcon}>
            <Text style={styles.planeEmoji}>✈️</Text>
          </View>
          <View style={styles.line} />
        </View>
        
        <View style={styles.cityInfo}>
          <Text style={styles.cityCode}>{flight.destination}</Text>
          <Text style={styles.cityLabel}>To</Text>
        </View>
      </View>

      {/* Details Grid */}
      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Flight</Text>
          <Text style={styles.detailValue}>{flight.flight_number}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Gate</Text>
          <Text style={styles.detailValue}>{flight.gate}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Seat</Text>
          <Text style={styles.detailValueLarge}>{passenger.seat_number}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Zone</Text>
          <Text style={styles.detailValue}>{passenger.zone}</Text>
        </View>
      </View>

      {/* Passenger Info */}
      <View style={styles.passengerInfo}>
        <Text style={styles.passengerName}>{passenger.name}</Text>
        <View style={styles.badges}>
          <StatusBadge status={passenger.status} size="small" />
          <PriorityBadge priority={passenger.priority} size="small" />
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <View style={styles.dividerNotchLeft} />
        <View style={styles.dividerNotchRight} />
      </View>

      {/* QR Code Section */}
      <View style={styles.qrSection}>
        <View style={styles.qrContainer}>
          <QRCode
            value={qrData}
            size={120}
            backgroundColor="#FFFFFF"
            color="#000000"
          />
        </View>
        <Text style={styles.scanText}>Scan for boarding</Text>
      </View>

      {/* Departure Time */}
      <View style={styles.departureInfo}>
        <Text style={styles.departureLabel}>DEPARTURE</Text>
        <Text style={styles.departureTime}>
          {new Date(flight.departure_time).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        <Text style={styles.departureDate}>
          {new Date(flight.departure_time).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  airline: {
    color: '#60A5FA',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  boardingText: {
    color: '#6B7280',
    fontSize: 10,
    letterSpacing: 3,
    marginTop: 4,
  },
  flightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  cityInfo: {
    alignItems: 'center',
  },
  cityCode: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  cityLabel: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
  flightPath: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#374151',
  },
  planeIcon: {
    paddingHorizontal: 8,
  },
  planeEmoji: {
    fontSize: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    color: '#6B7280',
    fontSize: 11,
    marginBottom: 4,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  detailValueLarge: {
    color: '#22C55E',
    fontSize: 24,
    fontWeight: '700',
  },
  passengerInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  passengerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  divider: {
    position: 'relative',
    marginVertical: 16,
  },
  dividerLine: {
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#374151',
  },
  dividerNotchLeft: {
    position: 'absolute',
    left: -28,
    top: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#111827',
  },
  dividerNotchRight: {
    position: 'absolute',
    right: -28,
    top: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#111827',
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
  },
  scanText: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 8,
  },
  departureInfo: {
    alignItems: 'center',
  },
  departureLabel: {
    color: '#6B7280',
    fontSize: 10,
    letterSpacing: 2,
  },
  departureTime: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  departureDate: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 2,
  },
});
