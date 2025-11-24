import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { type UserSession } from './useUserSessions';

type CommunitySession = UserSession & {
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

export const useSaveToCollection = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (session: CommunitySession) => {
      if (!user) throw new Error('Must be logged in to save');

      const { error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: user.id,
          audio_url: session.audio_url,
          session_type: session.session_type,
          mood: session.mood,
          ambient: session.ambient,
          vibe_description: session.vibe_description,
          binaural_experience: session.binaural_experience,
          voice_journey: session.voice_journey,
          voice_gender: session.voice_gender,
          duration_seconds: session.duration_seconds,
          is_public: false,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Saved ✨',
        description: 'Audio saved to your collection',
      });
      queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
    },
    onError: (error: any) => {
      const message = error?.message?.includes('duplicate')
        ? 'Already in your collection'
        : 'Failed to save audio';
      
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    },
  });

  const saveToCollection = (session: CommunitySession) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to save audios',
      });
      return;
    }

    saveMutation.mutate(session);
  };

  return {
    saveToCollection,
    isSaving: saveMutation.isPending,
  };
};
