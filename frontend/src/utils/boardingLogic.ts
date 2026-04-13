import { Passenger, PassengerPriority, BoardingPhase } from '../store/useStore';

// Rule-based intelligent boarding order optimization
export interface BoardingRecommendation {
  nextGroup: string;
  reason: string;
  passengers: string[];
  estimatedTime: number; // minutes
}

export function calculateBoardingOrder(passengers: Passenger[]): Passenger[] {
  // Sort by priority first, then by zone (back to front), then by seat
  return [...passengers].sort((a, b) => {
    const priorityOrder: Record<PassengerPriority, number> = {
      disability: 0,
      family: 1,
      first_class: 2,
      connection: 3,
      standard: 4,
    };
    
    // Priority first
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    
    // Then by zone (higher zones board first - back of plane)
    if (a.zone !== b.zone) {
      return b.zone - a.zone;
    }
    
    // Then by row (higher rows board first)
    return b.row - a.row;
  });
}

export function getNextBoardingGroup(
  passengers: Passenger[],
  currentPhase: BoardingPhase
): BoardingRecommendation {
  const waitingPassengers = passengers.filter(p => p.status === 'waiting' || p.status === 'checked_in');
  const boardingPassengers = passengers.filter(p => p.status === 'boarding');
  
  // Check for congestion (more than 5 passengers boarding at once)
  if (boardingPassengers.length > 5) {
    return {
      nextGroup: 'Hold',
      reason: 'Congestion detected - waiting for aisle to clear',
      passengers: [],
      estimatedTime: 2,
    };
  }
  
  // Priority passengers first
  const priorityPassengers = waitingPassengers.filter(
    p => p.priority === 'disability' || p.priority === 'family'
  );
  if (priorityPassengers.length > 0 && currentPhase === 'not_started') {
    return {
      nextGroup: 'Priority Boarding',
      reason: 'Passengers with disabilities and families with children',
      passengers: priorityPassengers.map(p => p.passenger_id),
      estimatedTime: Math.ceil(priorityPassengers.length * 0.5),
    };
  }
  
  // First class
  const firstClassPassengers = waitingPassengers.filter(p => p.priority === 'first_class');
  if (firstClassPassengers.length > 0 && (currentPhase === 'not_started' || currentPhase === 'priority')) {
    return {
      nextGroup: 'First Class',
      reason: 'Premium passengers and business class',
      passengers: firstClassPassengers.map(p => p.passenger_id),
      estimatedTime: Math.ceil(firstClassPassengers.length * 0.4),
    };
  }
  
  // Connection passengers
  const connectionPassengers = waitingPassengers.filter(p => p.priority === 'connection');
  if (connectionPassengers.length > 0) {
    return {
      nextGroup: 'Tight Connections',
      reason: 'Passengers with tight connecting flights',
      passengers: connectionPassengers.map(p => p.passenger_id),
      estimatedTime: Math.ceil(connectionPassengers.length * 0.5),
    };
  }
  
  // Zone-based boarding (back to front)
  for (let zone = 4; zone >= 1; zone--) {
    const zonePassengers = waitingPassengers.filter(p => p.zone === zone && p.priority === 'standard');
    if (zonePassengers.length > 0) {
      return {
        nextGroup: `Zone ${zone}`,
        reason: zone > 2 ? 'Boarding back rows first for efficiency' : 'Continuing with forward zones',
        passengers: zonePassengers.map(p => p.passenger_id),
        estimatedTime: Math.ceil(zonePassengers.length * 0.5),
      };
    }
  }
  
  return {
    nextGroup: 'Complete',
    reason: 'All passengers have boarded',
    passengers: [],
    estimatedTime: 0,
  };
}

export function getDeboardingOrder(passengers: Passenger[]): Passenger[] {
  // Deboarding: front to back, with priority for connections and disabilities
  return [...passengers].sort((a, b) => {
    const priorityOrder: Record<PassengerPriority, number> = {
      connection: 0,
      disability: 1,
      first_class: 2,
      family: 3,
      standard: 4,
    };
    
    // Priority first
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    
    // Then by row (lower rows exit first - front of plane)
    return a.row - b.row;
  });
}

export function getBoardingStats(passengers: Passenger[]) {
  const total = passengers.length;
  const checkedIn = passengers.filter(p => p.status === 'checked_in').length;
  const waiting = passengers.filter(p => p.status === 'waiting').length;
  const boarding = passengers.filter(p => p.status === 'boarding').length;
  const seated = passengers.filter(p => p.status === 'seated').length;
  const deboarding = passengers.filter(p => p.status === 'deboarding').length;
  const exited = passengers.filter(p => p.status === 'exited').length;
  
  return {
    total,
    checkedIn,
    waiting,
    boarding,
    seated,
    deboarding,
    exited,
    boardingPercentage: total > 0 ? Math.round((seated / total) * 100) : 0,
    deboardingPercentage: total > 0 ? Math.round((exited / total) * 100) : 0,
  };
}
