import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export const useCommunityLikes = (sessionId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: isLiked = false } = useQuery({
    queryKey: ['community-like', sessionId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('community_likes')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!sessionId,
  });

  const { data: likesCount = 0 } = useQuery({
    queryKey: ['community-likes-count', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('likes_count')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return data.likes_count || 0;
    },
    enabled: !!sessionId,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be logged in to like');

      await supabase
        .from('community_likes')
        .insert({ session_id: sessionId, user_id: user.id });

      await supabase
        .from('user_sessions')
        .update({ likes_count: likesCount + 1 })
        .eq('id', sessionId);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['community-like', sessionId, user?.id] });
      await queryClient.cancelQueries({ queryKey: ['community-likes-count', sessionId] });

      const previousLiked = queryClient.getQueryData(['community-like', sessionId, user?.id]);
      const previousCount = queryClient.getQueryData(['community-likes-count', sessionId]);

      queryClient.setQueryData(['community-like', sessionId, user?.id], true);
      queryClient.setQueryData(['community-likes-count', sessionId], (old: number = 0) => old + 1);

      return { previousLiked, previousCount };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(['community-like', sessionId, user?.id], context?.previousLiked);
      queryClient.setQueryData(['community-likes-count', sessionId], context?.previousCount);
      toast({
        title: 'Error',
        description: 'Failed to like audio',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['community-like', sessionId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['community-likes-count', sessionId] });
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be logged in to unlike');

      await supabase
        .from('community_likes')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', user.id);

      await supabase
        .from('user_sessions')
        .update({ likes_count: Math.max(0, likesCount - 1) })
        .eq('id', sessionId);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['community-like', sessionId, user?.id] });
      await queryClient.cancelQueries({ queryKey: ['community-likes-count', sessionId] });

      const previousLiked = queryClient.getQueryData(['community-like', sessionId, user?.id]);
      const previousCount = queryClient.getQueryData(['community-likes-count', sessionId]);

      queryClient.setQueryData(['community-like', sessionId, user?.id], false);
      queryClient.setQueryData(['community-likes-count', sessionId], (old: number = 0) => Math.max(0, old - 1));

      return { previousLiked, previousCount };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(['community-like', sessionId, user?.id], context?.previousLiked);
      queryClient.setQueryData(['community-likes-count', sessionId], context?.previousCount);
      toast({
        title: 'Error',
        description: 'Failed to unlike audio',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['community-like', sessionId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['community-likes-count', sessionId] });
    },
  });

  const toggleLike = () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to like audios',
      });
      return;
    }

    if (isLiked) {
      unlikeMutation.mutate();
    } else {
      likeMutation.mutate();
    }
  };

  return {
    isLiked,
    likesCount,
    toggleLike,
    isLoading: likeMutation.isPending || unlikeMutation.isPending,
  };
};
