import { create } from 'zustand';

export type UserRole = 'passenger' | 'staff' | 'admin';
export type PassengerStatus = 'checked_in' | 'waiting' | 'boarding' | 'seated' | 'deboarding' | 'exited';
export type PassengerPriority = 'standard' | 'first_class' | 'connection' | 'family' | 'disability';
export type FlightStatus = 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'deboarding';
export type BoardingPhase = 'not_started' | 'priority' | 'zone_1' | 'zone_2' | 'zone_3' | 'zone_4' | 'complete';

export interface User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
  role: UserRole;
}

export interface Flight {
  flight_id: string;
  flight_number: string;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  aircraft_type: string;
  total_seats: number;
  status: FlightStatus;
  boarding_phase: BoardingPhase;
  gate: string;
}

export interface Passenger {
  passenger_id: string;
  user_id: string;
  flight_id: string;
  seat_number: string;
  zone: number;
  row: number;
  priority: PassengerPriority;
  status: PassengerStatus;
  name: string;
  expo_push_token?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'boarding' | 'deboarding' | 'alert' | 'info';
}

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  sessionToken: string | null;
  
  // Flight data
  currentFlight: Flight | null;
  passengers: Passenger[];
  
  // Notifications
  notifications: Notification[];
  
  // UI State
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setSessionToken: (token: string | null) => void;
  setCurrentFlight: (flight: Flight | null) => void;
  setPassengers: (passengers: Passenger[]) => void;
  updatePassenger: (passengerId: string, updates: Partial<Passenger>) => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  setIsLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  sessionToken: null,
  currentFlight: null,
  passengers: [],
  notifications: [],
  isLoading: false,
  
  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setSessionToken: (sessionToken) => set({ sessionToken }),
  setCurrentFlight: (currentFlight) => set({ currentFlight }),
  setPassengers: (passengers) => set({ passengers }),
  updatePassenger: (passengerId, updates) => set((state) => ({
    passengers: state.passengers.map((p) =>
      p.passenger_id === passengerId ? { ...p, ...updates } : p
    ),
  })),
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
  })),
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    ),
  })),
  setIsLoading: (isLoading) => set({ isLoading }),
  logout: () => set({
    user: null,
    isAuthenticated: false,
    sessionToken: null,
    currentFlight: null,
    passengers: [],
    notifications: [],
  }),
}));
