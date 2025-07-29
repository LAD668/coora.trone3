import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { router } from 'expo-router';
import { validateAccessCode, getUserProfile, getCurrentUser } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'trainer' | 'player' | 'parent';
  teamId?: string;
  clubId?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, accessCode?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check for existing session on app start
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userProfile = await getUserProfile(session.user.id);
        setUser({
          id: userProfile.id,
          name: userProfile.name,
          email: userProfile.email,
          role: userProfile.role,
          teamId: userProfile.team_id || undefined,
          clubId: userProfile.club_id || undefined,
        });
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsInitialized(true);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const userProfile = await getUserProfile(data.user.id);
        setUser({
          id: userProfile.id,
          name: userProfile.name,
          email: userProfile.email,
          role: userProfile.role,
          teamId: userProfile.team_id || undefined,
          clubId: userProfile.club_id || undefined,
        });
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, accessCode?: string) => {
    setIsLoading(true);
    try {
      // Validate access code if provided
      if (accessCode) {
        const isValidCode = await validateAccessCode(accessCode);
        if (!isValidCode) {
          throw new Error('Invalid access code. Please check with your team administrator.');
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            access_code: accessCode,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Create user profile in users table
        try {
          // Get club and team info from access code if provided
          let clubId = null;
          let teamId = null;
          
          if (accessCode) {
            const { data: codeData } = await supabase
              .from('access_codes')
              .select('club_id, team_id')
              .eq('code', accessCode.toUpperCase())
              .eq('is_active', true)
              .single();
            
            if (codeData) {
              clubId = codeData.club_id;
              teamId = codeData.team_id;
            }
          }

          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email!,
              name: name,
              first_name: name.split(' ')[0] || name,
              last_name: name.split(' ').slice(1).join(' ') || '',
              role: 'player', // Default role
              club_id: clubId,
              team_id: teamId,
              access_code: accessCode?.toUpperCase(),
            });

          if (profileError) {
            console.error('Error creating user profile:', profileError);
            throw new Error('Failed to create user profile. Please try again.');
          }

          // Reload auth state to get the complete user profile
          await checkAuthState();
        } catch (profileError) {
          console.error('Profile creation error:', profileError);
          // Clean up auth user if profile creation fails
          await supabase.auth.signOut();
          throw new Error('Account creation failed. Please try again.');
        }
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      console.log('AuthContext: Starting signOut process...');
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      console.log('AuthContext: Supabase signOut completed');
      
      // Clear user state
      setUser(null);
      console.log('AuthContext: User state cleared');
      
      // Navigate to login screen
      router.replace('/auth/login');
      console.log('AuthContext: Navigation to login initiated');
      
    } catch (error) {
      console.error('AuthContext: SignOut error:', error);
      
      // Even if there's an error, clear the user state and navigate
      // This ensures the user is logged out locally even if the server call fails
      setUser(null);
      router.replace('/auth/login');
      
      // Re-throw the error so the calling component can handle it
      throw new Error(error instanceof Error ? error.message : 'Failed to sign out');
    } finally {
      setIsLoading(false);
      console.log('AuthContext: SignOut process completed');
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isInitialized,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}