import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Text as SvgText, G, Polygon } from 'react-native-svg';
import { Passenger, PassengerStatus } from '../store/useStore';

interface Aircraft3DProps {
  passengers: Passenger[];
  totalRows: number;
  onSeatPress?: (passenger: Passenger) => void;
  selectedZone?: number;
}

const getSeatColor = (status: PassengerStatus): string => {
  switch (status) {
    case 'seated':
      return '#22C55E';
    case 'boarding':
      return '#EAB308';
    case 'deboarding':
      return '#F97316';
    case 'exited':
      return '#4B5563';
    default:
      return '#EF4444';
  }
};

export const Aircraft3D: React.FC<Aircraft3DProps> = ({
  passengers,
  totalRows,
  onSeatPress,
  selectedZone,
}) => {
  const seatMap = new Map<string, Passenger>();
  passengers.forEach((p) => {
    seatMap.set(p.seat_number, p);
  });

  const seatWidth = 22;
  const seatHeight = 28;
  const seatGap = 4;
  const aisleWidth = 30;
  const rowGap = 6;
  const startX = 30;
  const startY = 80;

  const aircraftWidth = startX * 2 + (3 * (seatWidth + seatGap)) * 2 + aisleWidth;
  const aircraftHeight = startY + (totalRows * (seatHeight + rowGap)) + 60;

  const getSeatPosition = (row: number, seatIndex: number) => {
    const isLeftSide = seatIndex < 3;
    const localIndex = isLeftSide ? seatIndex : seatIndex - 3;
    
    const x = isLeftSide
      ? startX + localIndex * (seatWidth + seatGap)
      : startX + 3 * (seatWidth + seatGap) + aisleWidth + localIndex * (seatWidth + seatGap);
    
    const y = startY + (row - 1) * (seatHeight + rowGap);
    
    return { x, y };
  };

  const renderSeat = (row: number, seatIndex: number) => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const seatNumber = `${row}${letters[seatIndex]}`;
    const passenger = seatMap.get(seatNumber);
    const { x, y } = getSeatPosition(row, seatIndex);
    
    const zone = Math.ceil(row / (totalRows / 4));
    const isHighlighted = !selectedZone || zone === selectedZone;
    const color = passenger ? getSeatColor(passenger.status) : '#374151';
    const opacity = isHighlighted ? 1 : 0.3;

    return (
      <G key={seatNumber}>
        <Rect
          x={x}
          y={y}
          width={seatWidth}
          height={seatHeight}
          rx={4}
          fill={color}
          opacity={opacity}
          stroke="#1F2937"
          strokeWidth={1}
          onPress={() => passenger && onSeatPress?.(passenger)}
        />
        <SvgText
          x={x + seatWidth / 2}
          y={y + seatHeight / 2 + 3}
          fontSize={8}
          fill="#FFFFFF"
          textAnchor="middle"
          opacity={opacity}
        >
          {seatNumber}
        </SvgText>
      </G>
    );
  };

  const renderRow = (row: number) => {
    return (
      <G key={`row-${row}`}>
        {[0, 1, 2, 3, 4, 5].map((i) => renderSeat(row, i))}
        <SvgText
          x={startX + 3 * (seatWidth + seatGap) + aisleWidth / 2}
          y={startY + (row - 1) * (seatHeight + rowGap) + seatHeight / 2 + 3}
          fontSize={9}
          fill="#4B5563"
          textAnchor="middle"
        >
          {row}
        </SvgText>
      </G>
    );
  };

  return (
    <View style={styles.container}>
      <Svg width="100%" height={aircraftHeight} viewBox={`0 0 ${aircraftWidth} ${aircraftHeight}`}>
        {/* Aircraft body */}
        <Rect
          x={10}
          y={50}
          width={aircraftWidth - 20}
          height={aircraftHeight - 60}
          rx={20}
          fill="#111827"
          stroke="#374151"
          strokeWidth={2}
        />
        
        {/* Cockpit (nose) */}
        <Polygon
          points={`${aircraftWidth / 2},10 ${10},50 ${aircraftWidth - 10},50`}
          fill="#111827"
          stroke="#374151"
          strokeWidth={2}
        />
        
        {/* Cockpit text */}
        <SvgText
          x={aircraftWidth / 2}
          y={40}
          fontSize={10}
          fill="#4B5563"
          textAnchor="middle"
        >
          COCKPIT
        </SvgText>
        
        {/* Aisle */}
        <Rect
          x={startX + 3 * (seatWidth + seatGap) + 5}
          y={startY - 10}
          width={aisleWidth - 10}
          height={totalRows * (seatHeight + rowGap) + 10}
          fill="#1F2937"
          rx={4}
        />
        
        {/* Seats */}
        {Array.from({ length: totalRows }, (_, i) => i + 1).map((row) => renderRow(row))}
        
        {/* Zone indicators on left */}
        {[1, 2, 3, 4].map((zone) => {
          const zoneStart = startY + ((zone - 1) * totalRows / 4) * (seatHeight + rowGap);
          return (
            <SvgText
              key={`zone-${zone}`}
              x={8}
              y={zoneStart + (totalRows / 4 * (seatHeight + rowGap)) / 2}
              fontSize={8}
              fill={selectedZone === zone ? '#60A5FA' : '#4B5563'}
              textAnchor="middle"
              transform={`rotate(-90, 8, ${zoneStart + (totalRows / 4 * (seatHeight + rowGap)) / 2})`}
            >
              Zone {zone}
            </SvgText>
          );
        })}
      </Svg>
      
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
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  legendText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
});
