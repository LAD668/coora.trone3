import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper functions for common operations

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
      name,
      first_name,
      last_name,
      role,
      team_id,
      club_id,
      access_code,
      created_at,
      updated_at,
      teams:team_id (
        id,
        name,
        sport,
        color,
        club_id
      ),
      clubs:club_id (
        id,
        name,
        description,
        logo_url
      )
    `)
    .eq('id', userId)
    .maybeSingle();
  
  if (error) throw error;
  
  if (!data) {
    throw new Error('User profile not found. Please contact your administrator.');
  }
  
  return data;
};

export const getClub = async (clubId: string) => {
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .eq('id', clubId)
    .maybeSingle();
  
  if (error) throw error;
  
  if (!data) {
    throw new Error('Club not found');
  }
  
  return data;
};

export const createUserAccount = async (userData: {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
}) => {
  // This function is now handled in AuthContext
  // Keeping for backward compatibility
  throw new Error('Use signup method from AuthContext instead');
};

export const validateAccessCode = async (code: string) => {
  const { data, error } = await supabase
    .from('access_codes')
    .select('id, code, description')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .or('expires_at.is.null,expires_at.gt.now()')
    .maybeSingle();
  
  if (error) {
    console.error('Error validating access code:', error);
    throw new Error('Unable to validate access code');
  }
  
  return !!data; // Returns true if valid code found
};

export const getAccessCodes = async () => {
  const { data, error } = await supabase
    .from('access_codes')
    .select('*')
    .eq('is_active', true)
    .or('expires_at.is.null,expires_at.gt.now()')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const createAccessCode = async (accessCode: {
  code: string;
  description?: string;
  expiresAt?: string;
}) => {
  const { data, error } = await supabase
    .from('access_codes')
    .insert({
      code: accessCode.code.toUpperCase(),
      description: accessCode.description,
      expires_at: accessCode.expiresAt,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
   
   if (!data) {
     throw new Error('Failed to create access code');
   }
   
  return data;
};

export const getClubTeams = async (clubId: string) => {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('club_id', clubId)
    .order('name');
  
  if (error) throw error;
  return data;
};

export const getClubUsers = async (clubId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*, teams(name)')
    .eq('club_id', clubId)
    .order('name');
  
  if (error) throw error;
  return data;
};

export const getTeamPlayers = async (teamId: string) => {
  const { data, error } = await supabase
    .from('players')
    .select('*, player_stats(*)')
    .eq('team_id', teamId)
    .order('name');
  
  if (error) throw error;
  return data;
};

export const createPlayer = async (player: {
  name: string;
  position: string;
  jerseyNumber: number;
  teamId: string;
}) => {
  const { data, error } = await supabase
    .from('players')
    .insert({
      name: player.name,
      position: player.position,
      jersey_number: player.jerseyNumber,
      team_id: player.teamId,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
   
  if (!data) {
    throw new Error('Failed to create player');
  }
   
  return data;
};

export const getTeamPosts = async (teamId: string, postType?: 'organization' | 'coach') => {
  let query = supabase
    .from('posts')
    .select(`
      *,
      users(name),
      post_reactions(emoji, user_id)
    `)
    .eq('team_id', teamId)
    .order('created_at', { ascending: false });

  if (postType) {
    query = query.eq('post_type', postType);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const getTeamEvents = async (teamId: string) => {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      event_responses(user_id, response),
      match_results(*)
    `)
    .eq('team_id', teamId)
    .order('event_date');
  
  if (error) throw error;
  return data;
};

export const getTeamStats = async (teamId: string) => {
  // Get aggregated team statistics
  const { data: matchResults, error: matchError } = await supabase
    .from('match_results')
    .select('team_score, opponent_score, goals, assists')
    .eq('team_id', teamId);

  if (matchError) throw matchError;

  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('id')
    .eq('team_id', teamId);

  if (playersError) throw playersError;

  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, event_type')
    .eq('team_id', teamId);

  if (eventsError) throw eventsError;

  // Calculate stats
  const totalGoals = matchResults.reduce((sum, match) => {
    return sum + (match.goals ? JSON.parse(match.goals as string).length : 0);
  }, 0);

  const totalMatches = matchResults.length;
  const wins = matchResults.filter(m => m.team_score > m.opponent_score).length;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
  const upcomingEvents = events.filter(e => new Date(e.event_date) > new Date()).length;

  return {
    totalGoals,
    totalMatches,
    winRate,
    totalPlayers: players.length,
    upcomingEvents,
    trainings: events.filter(e => e.event_type === 'training').length,
  };
};

export const getClubStats = async (clubId: string) => {
  // Get all teams in the club
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id')
    .eq('club_id', clubId);

  if (teamsError) throw teamsError;

  const teamIds = teams.map(t => t.id);

  // Get aggregated stats for all teams
  const { data: matchResults, error: matchError } = await supabase
    .from('match_results')
    .select('team_score, opponent_score, goals, assists')
    .in('team_id', teamIds);

  if (matchError) throw matchError;

  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('id')
    .in('team_id', teamIds);

  if (playersError) throw playersError;

  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, event_type, event_date')
    .in('team_id', teamIds);

  if (eventsError) throw eventsError;

  // Calculate aggregated stats
  const totalGoals = matchResults.reduce((sum, match) => {
    return sum + (match.goals ? JSON.parse(match.goals as string).length : 0);
  }, 0);

  const totalMatches = matchResults.length;
  const wins = matchResults.filter(m => m.team_score > m.opponent_score).length;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
  const upcomingEvents = events.filter(e => new Date(e.event_date) > new Date()).length;

  return {
    totalGoals,
    totalMatches,
    winRate,
    totalPlayers: players.length,
    totalTeams: teams.length,
    upcomingEvents,
    trainings: events.filter(e => e.event_type === 'training').length,
  };
};

export const createClub = async (club: {
  name: string;
  description?: string;
  logoUrl?: string;
}) => {
  const { data, error } = await supabase
    .from('clubs')
    .insert({
      name: club.name,
      description: club.description,
      logo_url: club.logoUrl,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
   
   if (!data) {
     throw new Error('Failed to create club');
   }
   
  return data;
};

export const createTeam = async (team: {
  name: string;
  sport?: string;
  color?: string;
  clubId: string;
}) => {
  const { data, error } = await supabase
    .from('teams')
    .insert({
      name: team.name,
      sport: team.sport || 'Football',
      color: team.color || '#3B82F6',
      club_id: team.clubId,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
   
   if (!data) {
     throw new Error('Failed to create team');
   }
   
  return data;
};

export const createPost = async (post: {
  title: string;
  content: string;
  imageUrl?: string;
  postType: 'organization' | 'coach';
  teamId: string;
  authorId: string;
}) => {
  console.log('Supabase createPost called with:', post);
  
  const { data, error } = await supabase
    .from('posts')
    .insert({
      title: post.title,
      content: post.content,
      image_url: post.imageUrl,
      post_type: post.postType,
      team_id: post.teamId,
      author_id: post.authorId,
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase createPost error:', error);
    throw error;
  }
   
   if (!data) {
     console.error('Supabase createPost returned no data');
     throw new Error('Failed to create post');
   }
   
  console.log('Supabase createPost success:', data);
  return data;
};

export const addPostReaction = async (postId: string, userId: string, emoji: string) => {
  // First, remove any existing reaction from this user for this post
  await supabase
    .from('post_reactions')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);

  // Then add the new reaction
  const { data, error } = await supabase
    .from('post_reactions')
    .insert({
      post_id: postId,
      user_id: userId,
      emoji: emoji,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
   
   if (!data) {
     throw new Error('Failed to add reaction');
   }
   
  return data;
};

export const removePostReaction = async (postId: string, userId: string, emoji: string) => {
  const { error } = await supabase
    .from('post_reactions')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId)
    .eq('emoji', emoji);

  if (error) throw error;
};

export const createEvent = async (event: {
  title: string;
  eventType: 'training' | 'match';
  eventDate: string;
  meetingTime?: string;
  startTime?: string;
  endTime?: string;
  location: string;
  notes?: string;
  teamId: string;
  createdBy: string;
  requiresResponse?: boolean;
  isRepeating?: boolean;
  repeatPattern?: any;
}) => {
  const { data, error } = await supabase
    .from('events')
    .insert({
      title: event.title,
      event_type: event.eventType,
      event_date: event.eventDate,
      meeting_time: event.meetingTime,
      start_time: event.startTime,
      end_time: event.endTime,
      location: event.location,
      notes: event.notes,
      team_id: event.teamId,
      created_by: event.createdBy,
      requires_response: event.requiresResponse,
      is_repeating: event.isRepeating,
      repeat_pattern: event.repeatPattern,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
   
   if (!data) {
     throw new Error('Failed to create event');
   }
   
  return data;
};

export const respondToEvent = async (eventId: string, userId: string, response: 'accepted' | 'declined') => {
  const { data, error } = await supabase
    .from('event_responses')
    .upsert({
      event_id: eventId,
      user_id: userId,
      response: response,
      responded_at: new Date().toISOString(),
    })
    .select()
    .maybeSingle();

  if (error) throw error;
   
   if (!data) {
     throw new Error('Failed to respond to event');
   }
   
  return data;
};

export const submitMatchResult = async (result: {
  eventId: string;
  teamScore: number;
  opponentScore: number;
  opponentName?: string;
  goals: any[];
  assists: any[];
  otherStats?: any;
  submittedBy: string;
  teamId: string;
}) => {
  const { data, error } = await supabase
    .from('match_results')
    .insert({
      event_id: result.eventId,
      team_score: result.teamScore,
      opponent_score: result.opponentScore,
      opponent_name: result.opponentName,
      goals: result.goals,
      assists: result.assists,
      other_stats: result.otherStats,
      submitted_by: result.submittedBy,
      team_id: result.teamId,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
   
   if (!data) {
     throw new Error('Failed to submit match result');
   }
   
  return data;
};

export const getTeamGoals = async (teamId: string) => {
  const { data, error } = await supabase
    .from('team_goals')
    .select(`
      *,
      goal_tasks(*)
    `)
    .eq('team_id', teamId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createTeamGoal = async (goal: {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  deadline: string;
  teamId: string;
  createdBy: string;
}) => {
  const { data, error } = await supabase
    .from('team_goals')
    .insert({
      title: goal.title,
      description: goal.description,
      priority: goal.priority,
      deadline: goal.deadline,
      team_id: goal.teamId,
      created_by: goal.createdBy,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
   
   if (!data) {
     throw new Error('Failed to create team goal');
   }
   
  return data;
};

export const addGoalTask = async (task: {
  goalId: string;
  title: string;
  assignedTo?: string;
  dueDate?: string;
}) => {
  const { data, error } = await supabase
    .from('goal_tasks')
    .insert({
      goal_id: task.goalId,
      title: task.title,
      assigned_to: task.assignedTo,
      due_date: task.dueDate,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
   
   if (!data) {
     throw new Error('Failed to add goal task');
   }
   
  return data;
};

export const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
  const { data, error } = await supabase
    .from('goal_tasks')
    .update({ completed })
    .eq('id', taskId)
    .select()
    .maybeSingle();

  if (error) throw error;
   
   if (!data) {
     throw new Error('Failed to update task');
   }
   
  return data;
};

export const getNotifications = async (teamId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('team_id', teamId)
    .eq('sent', true)
    .order('scheduled_for', { ascending: false });

  if (error) throw error;
  return data;
};

// Real-time subscriptions
export const subscribeToTeamPosts = (teamId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('team_posts')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'posts',
        filter: `team_id=eq.${teamId}`,
      },
      callback
    )
    .subscribe();
};

export const subscribeToTeamEvents = (teamId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('team_events')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'events',
        filter: `team_id=eq.${teamId}`,
      },
      callback
    )
    .subscribe();
};

export const subscribeToPostReactions = (callback: (payload: any) => void) => {
  return supabase
    .channel('post_reactions')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'post_reactions',
      },
      callback
    )
    .subscribe();
};