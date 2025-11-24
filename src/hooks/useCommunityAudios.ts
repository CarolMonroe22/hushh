import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { type UserSession } from './useUserSessions';

type CommunitySession = UserSession & {
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

export const useCommunityAudios = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['community-audios'],
    queryFn: async () => {
      // First get public sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (sessionsError) throw sessionsError;
      if (!sessions || sessions.length === 0) return [];
      
      // Get unique user IDs
      const userIds = [...new Set(sessions.map(s => s.user_id))];
      
      // Fetch profiles for those users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);
      
      if (profilesError) throw profilesError;
      
      // Create a map of user_id to profile
      const profileMap = new Map(
        profiles?.map(p => [p.user_id, p]) || []
      );
      
      // Combine sessions with their profiles
      const communityData: CommunitySession[] = sessions.map(session => ({
        ...session,
        session_type: session.session_type as 'preset' | 'creator' | 'binaural' | 'voice',
        profiles: profileMap.get(session.user_id) || null,
      }));
      
      return communityData;
    },
  });

  return {
    communityAudios: data || [],
    isLoading,
  };
};