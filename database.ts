export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clubs: {
        Row: {
          id: string
          name: string
          description: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          sport: string
          color: string
          club_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          sport?: string
          color?: string
          club_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          sport?: string
          color?: string
          club_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'trainer' | 'player' | 'parent'
          team_id: string | null
          club_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role: 'admin' | 'trainer' | 'player' | 'parent'
          team_id?: string | null
          club_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'admin' | 'trainer' | 'player' | 'parent'
          team_id?: string | null
          club_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      players: {
        Row: {
          id: string
          name: string
          position: string
          phone_number: string | null
          team_id: string
          user_id: string | null
          jersey_number: number | null
          date_of_birth: string | null
          height_cm: number | null
          weight_kg: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          position: string
          phone_number?: string | null
          team_id: string
          user_id?: string | null
          jersey_number?: number | null
          date_of_birth?: string | null
          height_cm?: number | null
          weight_kg?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          position?: string
          phone_number?: string | null
          team_id?: string
          user_id?: string | null
          jersey_number?: number | null
          date_of_birth?: string | null
          height_cm?: number | null
          weight_kg?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      player_stats: {
        Row: {
          id: string
          player_id: string
          season: string
          goals: number
          assists: number
          matches_played: number
          trainings_attended: number
          yellow_cards: number
          red_cards: number
          saves: number
          clean_sheets: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          player_id: string
          season?: string
          goals?: number
          assists?: number
          matches_played?: number
          trainings_attended?: number
          yellow_cards?: number
          red_cards?: number
          saves?: number
          clean_sheets?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          season?: string
          goals?: number
          assists?: number
          matches_played?: number
          trainings_attended?: number
          yellow_cards?: number
          red_cards?: number
          saves?: number
          clean_sheets?: number
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          title: string
          content: string
          image_url: string | null
          author_id: string
          team_id: string
          post_type: 'organization' | 'coach'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          image_url?: string | null
          author_id: string
          team_id: string
          post_type?: 'organization' | 'coach'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          image_url?: string | null
          author_id?: string
          team_id?: string
          post_type?: 'organization' | 'coach'
          created_at?: string
          updated_at?: string
        }
      }
      post_reactions: {
        Row: {
          id: string
          post_id: string
          user_id: string
          emoji: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          emoji: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          emoji?: string
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          event_type: 'training' | 'match'
          event_date: string
          meeting_time: string | null
          start_time: string | null
          end_time: string | null
          location: string
          notes: string | null
          team_id: string
          created_by: string
          requires_response: boolean
          is_repeating: boolean
          repeat_pattern: Json | null
          parent_event_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          event_type: 'training' | 'match'
          event_date: string
          meeting_time?: string | null
          start_time?: string | null
          end_time?: string | null
          location: string
          notes?: string | null
          team_id: string
          created_by: string
          requires_response?: boolean
          is_repeating?: boolean
          repeat_pattern?: Json | null
          parent_event_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          event_type?: 'training' | 'match'
          event_date?: string
          meeting_time?: string | null
          start_time?: string | null
          end_time?: string | null
          location?: string
          notes?: string | null
          team_id?: string
          created_by?: string
          requires_response?: boolean
          is_repeating?: boolean
          repeat_pattern?: Json | null
          parent_event_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      event_responses: {
        Row: {
          id: string
          event_id: string
          user_id: string
          response: 'accepted' | 'declined' | 'pending'
          responded_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          response?: 'accepted' | 'declined' | 'pending'
          responded_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          response?: 'accepted' | 'declined' | 'pending'
          responded_at?: string | null
          created_at?: string
        }
      }
      match_results: {
        Row: {
          id: string
          event_id: string
          team_score: number
          opponent_score: number
          opponent_name: string | null
          match_outcome: 'win' | 'loss' | 'draw'
          goals: Json
          assists: Json
          other_stats: Json
          submitted_by: string
          team_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          team_score?: number
          opponent_score?: number
          opponent_name?: string | null
          goals?: Json
          assists?: Json
          other_stats?: Json
          submitted_by: string
          team_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          team_score?: number
          opponent_score?: number
          opponent_name?: string | null
          goals?: Json
          assists?: Json
          other_stats?: Json
          submitted_by?: string
          team_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      team_goals: {
        Row: {
          id: string
          title: string
          description: string
          priority: 'high' | 'medium' | 'low'
          progress: number
          deadline: string
          completed: boolean
          team_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          priority?: 'high' | 'medium' | 'low'
          progress?: number
          deadline: string
          completed?: boolean
          team_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          priority?: 'high' | 'medium' | 'low'
          progress?: number
          deadline?: string
          completed?: boolean
          team_id?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      goal_tasks: {
        Row: {
          id: string
          goal_id: string
          title: string
          completed: boolean
          assigned_to: string | null
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          goal_id: string
          title: string
          completed?: boolean
          assigned_to?: string | null
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          goal_id?: string
          title?: string
          completed?: boolean
          assigned_to?: string | null
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          notification_type: 'post_match' | 'event_reminder' | 'general'
          title: string
          message: string
          event_id: string | null
          team_id: string
          scheduled_for: string
          sent: boolean
          read_by: Json
          created_at: string
        }
        Insert: {
          id?: string
          notification_type: 'post_match' | 'event_reminder' | 'general'
          title: string
          message: string
          event_id?: string | null
          team_id: string
          scheduled_for: string
          sent?: boolean
          read_by?: Json
          created_at?: string
        }
        Update: {
          id?: string
          notification_type?: 'post_match' | 'event_reminder' | 'general'
          title?: string
          message?: string
          event_id?: string | null
          team_id?: string
          scheduled_for?: string
          sent?: boolean
          read_by?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}