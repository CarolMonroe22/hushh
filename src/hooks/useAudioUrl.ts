import { supabase } from '@/integrations/supabase/client';

export const useAudioUrl = () => {
  const getAudioUrl = (relativePath: string): string => {
    if (!relativePath) return '';
    
    // If already a full URL (blob: or https:), return as is
    if (relativePath.startsWith('blob:') || relativePath.startsWith('https://')) {
      return relativePath;
    }
    
    // Build full URL from Supabase Storage
    const { data } = supabase.storage
      .from('user-sessions')
      .getPublicUrl(relativePath);
    
    return data.publicUrl;
  };

  return { getAudioUrl };
};
