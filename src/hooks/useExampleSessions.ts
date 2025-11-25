import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ExampleSession = {
  id: string;
  example_key: string;
  title: string;
  description?: string;
  session_type: 'preset' | 'creator' | 'binaural' | 'voice';
  binaural_experience?: string;
  vibe_description?: string;
  mood?: string;
  ambient?: string;
  audio_url: string;
  duration_seconds: number;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export const useExampleSessions = () => {
  const { data: examples, isLoading, error } = useQuery({
    queryKey: ['example-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('example_sessions')
        .select('*')
        .eq('is_featured', true)
        .order('display_order', { ascending: true });
      
      if (error) {
        console.error('Error fetching example sessions:', error);
        throw error;
      }
      
      return data as ExampleSession[];
    },
    staleTime: 0, // Always fetch fresh data from database
  });

  return {
    examples: examples || [],
    isLoading,
    error,
  };
};
