export interface Club {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
}

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: 'admin' | 'trainer' | 'player' | 'parent';
  teamId: string;
  clubId: string;
  accessCode?: string;
}

export interface Team {
  id: string;
  name: string;
  sport: string;
  color: string;
  clubId: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  authorId: string;
  authorName: string;
  teamId: string;
  createdAt: Date;
  reactions?: { [emoji: string]: string[] }; // emoji -> array of user IDs
}

export interface Event {
  id: string;
  title: string;
  type: 'training' | 'match';
  date: Date;
  meetingTime?: Date; // Only for matches
  startTime?: Date; // Only for matches (different from date for matches)
  endDate?: Date;
  location: string;
  notes?: string;
  teamId: string;
  createdBy: string;
  isRepeating?: boolean;
  repeatPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number; // every X days/weeks/months
    endDate?: Date;
    occurrences?: number;
    daysOfWeek?: number[]; // for weekly: 0=Sunday, 1=Monday, etc.
  };
  parentEventId?: string; // for linking repeated events
  responses?: { [userId: string]: 'accepted' | 'declined' | 'pending' }; // player responses for training
  requiresResponse?: boolean; // whether players need to respond (only for training)
}

export interface Player {
  id: string;
  name: string;
  position: string;
  phoneNumber: string;
  teamId: string;
  stats?: {
    goals: number;
    assists: number;
    matchesPlayed: number;
    trainingsAttended: number;
  };
}

export interface MatchResult {
  id: string;
  eventId: string; // Reference to the match event
  teamScore: number;
  opponentScore: number;
  goals: {
    playerId: string;
    playerName: string;
    minute?: number;
  }[];
  assists: {
    playerId: string;
    playerName: string;
    minute?: number;
  }[];
  otherStats?: {
    yellowCards?: { playerId: string; playerName: string; minute?: number }[];
    redCards?: { playerId: string; playerName: string; minute?: number }[];
    saves?: { playerId: string; playerName: string; count: number }[];
    cleanSheet?: boolean;
  };
  submittedBy: string;
  submittedAt: Date;
  teamId: string;
}

export interface PostMatchNotification {
  id: string;
  eventId: string;
  eventTitle: string;
  scheduledFor: Date; // 3 hours after match end
  sent: boolean;
  resultSubmitted: boolean;
  teamId: string;
}