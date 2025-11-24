import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useGenerationLimit = () => {
  const { user } = useAuth();
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['generation-limit', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .rpc('check_generation_limit', { p_user_id: user.id });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30s
  });

  const parsedData = data as any;
  
  return {
    limitInfo: data,
    canGenerate: parsedData?.allowed || false,
    remaining: parsedData?.remaining,
    limit: parsedData?.limit,
    tier: parsedData?.tier,
    isLoading,
    refetch,
  };
};