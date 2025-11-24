import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { ExampleSession } from '@/hooks/useExampleSessions';

interface ExampleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  example: ExampleSession | null;
}

type FormData = {
  title: string;
  description?: string;
  example_key: string;
  session_type: 'preset' | 'creator' | 'binaural' | 'voice';
  binaural_experience?: string;
  vibe_description?: string;
  mood?: string;
  ambient?: string;
  duration_seconds: number;
  is_featured: boolean;
  display_order: number;
};

export const ExampleForm = ({ open, onOpenChange, example }: ExampleFormProps) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, watch, setValue, reset } = useForm<FormData>({
    defaultValues: example || {
      title: '',
      example_key: '',
      session_type: 'preset',
      duration_seconds: 60,
      is_featured: true,
      display_order: 0,
    },
  });

  const sessionType = watch('session_type');

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (example) {
        const { error } = await supabase
          .from('example_sessions')
          .update(data)
          .eq('id', example.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('example_sessions')
          .insert([{ ...data, audio_url: '' }]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-examples'] });
      toast.success(example ? 'Example updated' : 'Example created');
      reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed: ${error.message}`);
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{example ? 'Edit Example' : 'Create Example'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register('title', { required: true })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="example_key">Example Key</Label>
            <Input id="example_key" {...register('example_key', { required: true })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="session_type">Session Type</Label>
            <Select 
              value={sessionType} 
              onValueChange={(value) => setValue('session_type', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="preset">Preset</SelectItem>
                <SelectItem value="creator">Creator</SelectItem>
                <SelectItem value="binaural">Binaural</SelectItem>
                <SelectItem value="voice">Voice</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {sessionType === 'binaural' && (
            <div className="space-y-2">
              <Label htmlFor="binaural_experience">Binaural Experience</Label>
              <Select 
                value={watch('binaural_experience')} 
                onValueChange={(value) => setValue('binaural_experience', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="barbershop">Barbershop</SelectItem>
                  <SelectItem value="spa">Spa</SelectItem>
                  <SelectItem value="library">Library</SelectItem>
                  <SelectItem value="cafe">Cafe</SelectItem>
                  <SelectItem value="forest">Forest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {sessionType === 'creator' && (
            <div className="space-y-2">
              <Label htmlFor="vibe_description">Vibe Description</Label>
              <Textarea id="vibe_description" {...register('vibe_description')} />
            </div>
          )}

          {sessionType === 'preset' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="mood">Mood</Label>
                <Input id="mood" {...register('mood')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ambient">Ambient</Label>
                <Input id="ambient" {...register('ambient')} />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="duration_seconds">Duration (seconds)</Label>
            <Input 
              id="duration_seconds" 
              type="number" 
              {...register('duration_seconds', { valueAsNumber: true })} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_order">Display Order</Label>
            <Input 
              id="display_order" 
              type="number" 
              {...register('display_order', { valueAsNumber: true })} 
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_featured"
              checked={watch('is_featured')}
              onCheckedChange={(checked) => setValue('is_featured', checked)}
            />
            <Label htmlFor="is_featured">Featured</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
