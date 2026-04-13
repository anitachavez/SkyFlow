import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useStore } from '../../src/store/useStore';
import { BoardingPass } from '../../src/components/BoardingPass';
import { Card } from '../../src/components/UI';

export default function BoardingPassScreen() {
  const { user, currentFlight, passengers } = useStore();
  
  const myBooking = passengers.find(p => p.user_id === user?.user_id);

  if (!currentFlight || !myBooking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Boarding Pass</Text>
          <Text style={styles.emptyText}>You don't have an active booking.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Boarding Pass</Text>
          <Text style={styles.subtitle}>Show this at the gate</Text>
        </View>

        <BoardingPass passenger={myBooking} flight={currentFlight} />

        <Card style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Boarding Tips</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Have your boarding pass ready when called</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Keep your ID handy for verification</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Listen for your zone announcement</Text>
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
  },
  header: {
    paddingHorizontal: 16,
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
  },
  tipsCard: {
    margin: 16,
  },
  tipsTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tipBullet: {
    color: '#3B82F6',
    fontSize: 14,
    marginRight: 8,
  },
  tipText: {
    color: '#9CA3AF',
    fontSize: 14,
    flex: 1,
  },
});
