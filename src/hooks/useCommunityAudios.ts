import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { type UserSession } from './useUserSessions';
import { useAudioUrl } from './useAudioUrl';

type CommunitySession = UserSession & {
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

interface UseCommunityAudiosOptions {
  search?: string;
  sessionType?: 'all' | 'preset' | 'creator' | 'binaural' | 'voice';
  sortBy?: 'newest' | 'oldest' | 'most-played';
  limit?: number;
}

export const useCommunityAudios = (options: UseCommunityAudiosOptions = {}) => {
  const { search = '', sessionType = 'all', sortBy = 'newest', limit = 50 } = options;
  const { getAudioUrl } = useAudioUrl();

  const { data, isLoading } = useQuery({
    queryKey: ['community-audios', search, sessionType, sortBy, limit],
    queryFn: async () => {
      let query = supabase
        .from('user_sessions')
        .select('*')
        .eq('is_public', true);

      // Filter by session type
      if (sessionType !== 'all') {
        query = query.eq('session_type', sessionType);
      }

      // Search across multiple fields
      if (search) {
        query = query.or(`vibe_description.ilike.%${search}%,mood.ilike.%${search}%,ambient.ilike.%${search}%,binaural_experience.ilike.%${search}%,voice_journey.ilike.%${search}%`);
      }

      // Sort
      switch (sortBy) {
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'most-played':
          query = query.order('times_played', { ascending: false });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      query = query.limit(limit);

      const { data: sessions, error: sessionsError } = await query;
      
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
      
      // Combine sessions with their profiles and convert audio URLs
      const communityData: CommunitySession[] = sessions.map(session => ({
        ...session,
        audio_url: getAudioUrl(session.audio_url),
        session_type: session.session_type as 'preset' | 'creator' | 'binaural' | 'voice',
        profiles: profileMap.get(session.user_id) || null,
      }));

      // Additional search filtering for user names (not supported in postgres query)
      if (search) {
        return communityData.filter(session => 
          session.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
          || !search // if no match on name, keep if already matched on other fields
        );
      }
      
      return communityData;
    },
  });

  return {
    communityAudios: data || [],
    isLoading,
  };
};
