import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card, StatCard } from '../../src/components/UI';

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface AnalyticsData {
  totalFlights: number;
  totalPassengers: number;
  avgBoardingTime: number;
  avgDeboardingTime: number;
  onTimePercentage: number;
  efficiency: number;
  weeklyFlights: number[];
  weeklyPassengers: number[];
}

export default function AnalyticsScreen() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalFlights: 0,
    totalPassengers: 0,
    avgBoardingTime: 0,
    avgDeboardingTime: 0,
    onTimePercentage: 0,
    efficiency: 0,
    weeklyFlights: [5, 8, 6, 9, 7, 4, 6],
    weeklyPassengers: [450, 720, 540, 810, 630, 360, 540],
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      const response = await fetch(`${BACKEND_URL}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics({ ...analytics, ...data });
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const maxFlights = Math.max(...analytics.weeklyFlights, 1);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>Performance insights</Text>
        </View>

        {/* Key Metrics */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Flights"
            value={analytics.totalFlights}
            icon="airplane"
            iconColor="#8B5CF6"
          />
          <StatCard
            title="Passengers"
            value={analytics.totalPassengers}
            icon="people"
            iconColor="#3B82F6"
          />
          <StatCard
            title="Avg Boarding"
            value={`${analytics.avgBoardingTime}m`}
            icon="timer"
            iconColor="#22C55E"
          />
          <StatCard
            title="Efficiency"
            value={`${analytics.efficiency}%`}
            icon="trending-up"
            iconColor="#F59E0B"
          />
        </View>

        {/* Weekly Chart */}
        <Card style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Weekly Flight Activity</Text>
          <View style={styles.chart}>
            {analytics.weeklyFlights.map((count, index) => (
              <View key={index} style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${(count / maxFlights) * 100}%`,
                      backgroundColor: index === new Date().getDay() - 1 ? '#8B5CF6' : '#374151',
                    },
                  ]}
                />
                <Text style={styles.barLabel}>{days[index]}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Performance Metrics */}
        <Card style={styles.metricsCard}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          
          <View style={styles.metricItem}>
            <View style={styles.metricInfo}>
              <Text style={styles.metricLabel}>On-Time Departure</Text>
              <Text style={styles.metricValue}>{analytics.onTimePercentage}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${analytics.onTimePercentage}%`, backgroundColor: '#22C55E' }]} />
            </View>
          </View>

          <View style={styles.metricItem}>
            <View style={styles.metricInfo}>
              <Text style={styles.metricLabel}>Boarding Efficiency</Text>
              <Text style={styles.metricValue}>{analytics.efficiency}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${analytics.efficiency}%`, backgroundColor: '#3B82F6' }]} />
            </View>
          </View>

          <View style={styles.metricItem}>
            <View style={styles.metricInfo}>
              <Text style={styles.metricLabel}>Passenger Satisfaction</Text>
              <Text style={styles.metricValue}>92%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '92%', backgroundColor: '#8B5CF6' }]} />
            </View>
          </View>
        </Card>

        {/* Time Analysis */}
        <Card style={styles.timeCard}>
          <Text style={styles.sectionTitle}>Time Analysis</Text>
          <View style={styles.timeGrid}>
            <View style={styles.timeItem}>
              <Ionicons name="enter" size={24} color="#22C55E" />
              <Text style={styles.timeLabel}>Avg Boarding</Text>
              <Text style={styles.timeValue}>{analytics.avgBoardingTime} min</Text>
            </View>
            <View style={styles.timeItem}>
              <Ionicons name="exit" size={24} color="#F59E0B" />
              <Text style={styles.timeLabel}>Avg Deboarding</Text>
              <Text style={styles.timeValue}>{analytics.avgDeboardingTime} min</Text>
            </View>
            <View style={styles.timeItem}>
              <Ionicons name="time" size={24} color="#3B82F6" />
              <Text style={styles.timeLabel}>Turnaround</Text>
              <Text style={styles.timeValue}>{analytics.avgBoardingTime + analytics.avgDeboardingTime + 15} min</Text>
            </View>
          </View>
        </Card>

        {/* Insights */}
        <Card style={styles.insightsCard}>
          <Text style={styles.sectionTitle}>AI Insights</Text>
          <View style={styles.insightItem}>
            <Ionicons name="bulb" size={20} color="#F59E0B" />
            <Text style={styles.insightText}>
              Boarding back rows first improved efficiency by 15%
            </Text>
          </View>
          <View style={styles.insightItem}>
            <Ionicons name="trending-up" size={20} color="#22C55E" />
            <Text style={styles.insightText}>
              Morning flights have 20% faster boarding times
            </Text>
          </View>
          <View style={styles.insightItem}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.insightText}>
              Zone 2 experiences most congestion - consider splitting
            </Text>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  chartCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: 20,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '60%',
    borderRadius: 4,
    minHeight: 8,
  },
  barLabel: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 8,
  },
  metricsCard: {
    marginBottom: 16,
  },
  metricItem: {
    marginBottom: 16,
  },
  metricInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricLabel: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  timeCard: {
    marginBottom: 16,
  },
  timeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeItem: {
    alignItems: 'center',
    flex: 1,
  },
  timeLabel: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 8,
  },
  timeValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  insightsCard: {
    marginBottom: 24,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  insightText: {
    flex: 1,
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 20,
  },
});
