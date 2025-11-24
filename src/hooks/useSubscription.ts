import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useSubscription = () => {
  const { user } = useAuth();
  
  const { data, isLoading } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return {
    subscription: data,
    isPremium: data?.tier === 'premium',
    isFree: data?.tier === 'free',
    tier: data?.tier || 'free',
    isLoading,
  };
};