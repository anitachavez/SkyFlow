import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../../src/store/useStore';
import { Card, Button } from '../../src/components/UI';
import { StatusBadge, PriorityBadge } from '../../src/components/StatusBadge';
import { database, ref, update } from '../../src/services/firebase';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ScannerScreen() {
  const { currentFlight, passengers, setPassengers } = useStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedData, setScannedData] = useState<any>(null);
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (!scanning || processing) return;
    setScanning(false);
    setProcessing(true);

    try {
      const boardingData = JSON.parse(data);
      setScannedData(boardingData);

      // Find passenger in current list
      const passenger = passengers.find(p => p.passenger_id === boardingData.passenger_id);
      if (passenger) {
        setScannedData({ ...boardingData, passenger });
      }
    } catch (error) {
      Alert.alert('Invalid QR Code', 'Please scan a valid boarding pass.');
      setScanning(true);
    }
    setProcessing(false);
  };

  const confirmBoarding = async () => {
    if (!scannedData?.passenger_id || !currentFlight) return;
    setProcessing(true);

    try {
      const token = await AsyncStorage.getItem('session_token');
      const response = await fetch(`${BACKEND_URL}/api/staff/confirm-boarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          flight_id: currentFlight.flight_id,
          passenger_id: scannedData.passenger_id,
        }),
      });

      if (response.ok) {
        // Update Firebase
        await update(
          ref(database, `flights/${currentFlight.flight_id}/passengers/${scannedData.passenger_id}`),
          { status: 'seated' }
        );

        // Update local state
        setPassengers(
          passengers.map(p =>
            p.passenger_id === scannedData.passenger_id ? { ...p, status: 'seated' } : p
          )
        );

        Alert.alert(
          'Boarding Confirmed',
          `${scannedData.name} has been marked as seated.`,
          [{ text: 'OK', onPress: () => resetScanner() }]
        );
      } else {
        Alert.alert('Error', 'Failed to confirm boarding.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while confirming boarding.');
    }
    setProcessing(false);
  };

  const resetScanner = () => {
    setScannedData(null);
    setScanning(true);
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.permissionText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="camera-outline" size={64} color="#374151" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to scan boarding passes
          </Text>
          <Button title="Grant Permission" onPress={requestPermission} variant="primary" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Boarding Scanner</Text>
        <Text style={styles.subtitle}>Scan passenger boarding passes</Text>
      </View>

      {scanning && !scannedData ? (
        <View style={styles.cameraContainer}>
          {Platform.OS === 'web' ? (
            <View style={styles.webPlaceholder}>
              <Ionicons name="scan" size={64} color="#3B82F6" />
              <Text style={styles.webText}>Camera scanning not available on web</Text>
              <Text style={styles.webSubtext}>Use the mobile app to scan boarding passes</Text>
            </View>
          ) : (
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={handleBarCodeScanned}
            >
              <View style={styles.overlay}>
                <View style={styles.scanArea}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                </View>
                <Text style={styles.scanText}>Align QR code within the frame</Text>
              </View>
            </CameraView>
          )}
        </View>
      ) : (
        <View style={styles.resultContainer}>
          <Card style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Ionicons
                name={scannedData?.passenger?.status === 'seated' ? 'checkmark-circle' : 'person'}
                size={48}
                color={scannedData?.passenger?.status === 'seated' ? '#22C55E' : '#3B82F6'}
              />
            </View>

            <Text style={styles.passengerName}>{scannedData?.name || 'Unknown'}</Text>
            
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Flight</Text>
                <Text style={styles.detailValue}>{scannedData?.flight_id || '-'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Seat</Text>
                <Text style={styles.detailValueLarge}>{scannedData?.seat || '-'}</Text>
              </View>
            </View>

            {scannedData?.passenger && (
              <View style={styles.badgeRow}>
                <StatusBadge status={scannedData.passenger.status} />
                <PriorityBadge priority={scannedData.passenger.priority} />
              </View>
            )}

            <View style={styles.actions}>
              {scannedData?.passenger?.status !== 'seated' ? (
                <Button
                  title="Confirm Boarding"
                  onPress={confirmBoarding}
                  variant="success"
                  icon="checkmark-circle"
                  loading={processing}
                />
              ) : (
                <View style={styles.alreadySeated}>
                  <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
                  <Text style={styles.alreadySeatedText}>Already seated</Text>
                </View>
              )}
              <Button
                title="Scan Another"
                onPress={resetScanner}
                variant="secondary"
                icon="scan"
              />
            </View>
          </Card>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  permissionText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
  },
  header: {
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
  cameraContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#3B82F6',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  scanText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 24,
  },
  webPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
    gap: 16,
  },
  webText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  webSubtext: {
    color: '#6B7280',
    fontSize: 14,
  },
  resultContainer: {
    flex: 1,
    padding: 16,
  },
  resultCard: {
    alignItems: 'center',
    padding: 24,
  },
  resultHeader: {
    marginBottom: 16,
  },
  passengerName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 20,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  detailValueLarge: {
    color: '#22C55E',
    fontSize: 28,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  alreadySeated: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#14532D',
    borderRadius: 12,
  },
  alreadySeatedText: {
    color: '#22C55E',
    fontSize: 16,
    fontWeight: '600',
  },
});
