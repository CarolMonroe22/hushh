import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { type UserSession } from './useUserSessions';

type ProfileSession = UserSession;

interface UserProfileStats {
  totalPlays: number;
  totalSessions: number;
  mostUsedType: string;
}

export const useUserProfile = (userId: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (profileError) throw profileError;

      // Fetch their public sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      
      if (sessionsError) throw sessionsError;

      // Calculate stats
      const totalPlays = sessions?.reduce((sum, s) => sum + (s.times_played || 0), 0) || 0;
      const totalSessions = sessions?.length || 0;
      
      // Find most used session type
      const typeCounts = sessions?.reduce((acc, s) => {
        acc[s.session_type] = (acc[s.session_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      const mostUsedType = Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'none';

      const stats: UserProfileStats = {
        totalPlays,
        totalSessions,
        mostUsedType,
      };

      return {
        profile,
        sessions: (sessions || []).map(s => ({
          ...s,
          session_type: s.session_type as 'preset' | 'creator' | 'binaural' | 'voice',
        })) as ProfileSession[],
        stats,
      };
    },
    enabled: !!userId,
  });

  return {
    profile: data?.profile || null,
    sessions: data?.sessions || [],
    stats: data?.stats || { totalPlays: 0, totalSessions: 0, mostUsedType: 'none' },
    isLoading,
  };
};
