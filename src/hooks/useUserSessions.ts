import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export type UserSession = {
  id: string;
  user_id: string;
  session_type: 'preset' | 'creator' | 'binaural' | 'voice';
  mood?: string;
  ambient?: string;
  vibe_description?: string;
  binaural_experience?: string;
  voice_journey?: string;
  voice_gender?: string;
  audio_url: string;
  duration_seconds: number;
  times_played: number;
  last_played_at?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
};

export const useUserSessions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user sessions
  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['user-sessions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching sessions:', error);
        throw error;
      }
      
      return data as UserSession[];
    },
    enabled: !!user,
  });

  // Mark session as played
  const markAsPlayedMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase.rpc('increment_session_play_count', {
        session_id: sessionId,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
    },
    onError: (error) => {
      console.error('Error marking session as played:', error);
    },
  });

  // Toggle favorite status
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ sessionId, isFavorite }: { sessionId: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_favorite: !isFavorite })
        .eq('id', sessionId);
      
      if (error) throw error;
    },
    onSuccess: (_, { isFavorite }) => {
      queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
      toast({
        title: isFavorite ? "⭐ Removed from favorites" : "⭐ Added to favorites",
        duration: 2000,
      });
    },
    onError: (error) => {
      console.error('Error toggling favorite:', error);
      toast({
        title: "❌ Error",
        description: "Could not update favorite status",
        variant: "destructive",
      });
    },
  });

  // Delete session
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
      toast({
        title: "🗑️ Session deleted",
        duration: 2000,
      });
    },
    onError: (error) => {
      console.error('Error deleting session:', error);
      toast({
        title: "❌ Error",
        description: "Could not delete session",
        variant: "destructive",
      });
    },
  });

  return {
    sessions: sessions || [],
    isLoading,
    error,
    markAsPlayed: (sessionId: string) => markAsPlayedMutation.mutate(sessionId),
    toggleFavorite: (sessionId: string, isFavorite: boolean) => 
      toggleFavoriteMutation.mutate({ sessionId, isFavorite }),
    deleteSession: (sessionId: string) => deleteSessionMutation.mutate(sessionId),
  };
};
