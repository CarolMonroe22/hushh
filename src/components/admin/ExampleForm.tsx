import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
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
  voice_journey?: string;
  voice_gender?: string;
  duration_seconds: number;
  is_featured: boolean;
  display_order: number;
};

// Visual option definitions
const MOODS = [
  { value: 'relax', label: 'Relax', emoji: '🌙' },
  { value: 'sleep', label: 'Sleep', emoji: '😴' },
  { value: 'focus', label: 'Focus', emoji: '🎯' },
  { value: 'gratitude', label: 'Gratitude', emoji: '🙏' },
  { value: 'boost', label: 'Boost', emoji: '⚡' },
  { value: 'stoic', label: 'Stoic', emoji: '🗿' },
];

const AMBIENTS = [
  { value: 'rain', label: 'Rain', emoji: '🌧️' },
  { value: 'ocean', label: 'Ocean', emoji: '🌊' },
  { value: 'forest', label: 'Forest', emoji: '🌲' },
  { value: 'fireplace', label: 'Fireplace', emoji: '🔥' },
  { value: 'whitenoise', label: 'White Noise', emoji: '📻' },
  { value: 'city', label: 'City', emoji: '🏙️' },
];

const BINAURAL_EXPERIENCES = [
  { value: 'barbershop', label: 'Barbershop', emoji: '💈', description: 'Close personal attention' },
  { value: 'spa', label: 'Spa', emoji: '🧖', description: 'Relaxing treatment' },
  { value: 'library', label: 'Library', emoji: '📚', description: 'Quiet study space' },
  { value: 'cafe', label: 'Cafe', emoji: '☕', description: 'Cozy atmosphere' },
  { value: 'forest', label: 'Forest', emoji: '🌲', description: 'Nature sounds' },
];

const VOICE_JOURNEYS = [
  { value: 'story', label: 'Story', emoji: '📖' },
  { value: 'prayer', label: 'Prayer', emoji: '🙏' },
  { value: 'stoic', label: 'Stoic', emoji: '🏛️' },
  { value: 'manifest', label: 'Manifest', emoji: '✨' },
  { value: 'motivate', label: 'Motivate', emoji: '🔥' },
];

const SUGGESTED_VIBES = [
  'deep focus for work',
  'calm evening meditation',
  'creative flow state',
  'peaceful sleep',
  'morning manifestation',
  'stoic wisdom reflection',
];

export const ExampleForm = ({ open, onOpenChange, example }: ExampleFormProps) => {
  const queryClient = useQueryClient();
  const [showPreview, setShowPreview] = useState(false);
  
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

  const formValues = watch();
  const sessionType = formValues.session_type;
  const mood = formValues.mood;
  const ambient = formValues.ambient;
  const binauralExp = formValues.binaural_experience;
  const vibeDesc = formValues.vibe_description;
  const voiceJourney = formValues.voice_journey;
  const voiceGender = formValues.voice_gender;

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

  const getPreviewPrompt = () => {
    switch (sessionType) {
      case 'preset':
        return `Generate ASMR session with mood: ${mood || 'not set'}, ambient: ${ambient || 'not set'}`;
      case 'creator':
        return `Generate custom vibe: "${vibeDesc || 'not set'}"`;
      case 'binaural':
        return `Generate binaural experience: ${binauralExp || 'not set'}`;
      case 'voice':
        return `Generate voice journey: ${voiceJourney || 'not set'}, voice: ${voiceGender || 'not set'}`;
      default:
        return 'Select a session type';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{example ? 'Edit Example' : 'Create Example'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Visual Tabs for Session Type */}
          <Tabs value={sessionType} onValueChange={(value) => setValue('session_type', value as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="preset">Preset</TabsTrigger>
              <TabsTrigger value="creator">Creator</TabsTrigger>
              <TabsTrigger value="binaural">Binaural</TabsTrigger>
              <TabsTrigger value="voice">Voice</TabsTrigger>
            </TabsList>

            {/* Preset Tab */}
            <TabsContent value="preset" className="space-y-4 mt-4">
              <div className="space-y-3">
                <Label>Mood</Label>
                <div className="grid grid-cols-3 gap-2">
                  {MOODS.map((option) => (
                    <Card
                      key={option.value}
                      className={`p-4 cursor-pointer transition-all hover:scale-105 ${
                        mood === option.value ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                      onClick={() => setValue('mood', option.value)}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">{option.emoji}</div>
                        <div className="text-sm font-medium">{option.label}</div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Ambient</Label>
                <div className="grid grid-cols-3 gap-2">
                  {AMBIENTS.map((option) => (
                    <Card
                      key={option.value}
                      className={`p-4 cursor-pointer transition-all hover:scale-105 ${
                        ambient === option.value ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                      onClick={() => setValue('ambient', option.value)}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">{option.emoji}</div>
                        <div className="text-sm font-medium">{option.label}</div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Creator Tab */}
            <TabsContent value="creator" className="space-y-4 mt-4">
              <div className="space-y-3">
                <Label htmlFor="vibe_description">Describe Your Vibe</Label>
                <Textarea 
                  id="vibe_description" 
                  {...register('vibe_description')}
                  placeholder="Describe the experience you want to create..."
                  className="min-h-[100px]"
                />
                <div className="text-xs text-muted-foreground">
                  {vibeDesc?.length || 0} characters
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Suggested Examples</Label>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_VIBES.map((vibe) => (
                    <Button
                      key={vibe}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('vibe_description', vibe)}
                    >
                      {vibe}
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Binaural Tab */}
            <TabsContent value="binaural" className="space-y-4 mt-4">
              <div className="space-y-3">
                <Label>Binaural Experience</Label>
                <div className="grid grid-cols-2 gap-3">
                  {BINAURAL_EXPERIENCES.map((option) => (
                    <Card
                      key={option.value}
                      className={`p-4 cursor-pointer transition-all hover:scale-105 ${
                        binauralExp === option.value ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                      onClick={() => setValue('binaural_experience', option.value)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{option.emoji}</div>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Voice Tab */}
            <TabsContent value="voice" className="space-y-4 mt-4">
              <div className="space-y-3">
                <Label>Voice Journey Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {VOICE_JOURNEYS.map((option) => (
                    <Card
                      key={option.value}
                      className={`p-4 cursor-pointer transition-all hover:scale-105 ${
                        voiceJourney === option.value ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                      onClick={() => setValue('voice_journey', option.value)}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">{option.emoji}</div>
                        <div className="text-sm font-medium">{option.label}</div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Voice Gender</Label>
                <RadioGroup 
                  value={voiceGender || 'female'}
                  onValueChange={(value) => setValue('voice_gender', value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female" className="cursor-pointer">Female</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male" className="cursor-pointer">Male</Label>
                  </div>
                </RadioGroup>
              </div>
            </TabsContent>
          </Tabs>

          {/* Administrative Fields */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">Administrative Fields</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" {...register('title', { required: true })} placeholder="Example title" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="example_key">Example Key *</Label>
                <Input id="example_key" {...register('example_key', { required: true })} placeholder="unique-key" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea id="description" {...register('description')} placeholder="Internal notes..." />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Duration</Label>
                <div className="flex gap-2">
                  {[60, 120, 180, 300].map((duration) => (
                    <Button
                      key={duration}
                      type="button"
                      variant={formValues.duration_seconds === duration ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setValue('duration_seconds', duration)}
                    >
                      {duration}s
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input 
                  id="display_order" 
                  type="number" 
                  {...register('display_order', { valueAsNumber: true })} 
                />
              </div>

              <div className="flex items-center space-x-2 pt-7">
                <Switch
                  id="is_featured"
                  checked={formValues.is_featured}
                  onCheckedChange={(checked) => setValue('is_featured', checked)}
                />
                <Label htmlFor="is_featured">Featured</Label>
              </div>
            </div>
          </div>

          {/* Preview Prompt */}
          <Collapsible open={showPreview} onOpenChange={setShowPreview}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" className="w-full justify-between">
                <span className="text-sm font-medium">Preview Generation Prompt</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showPreview ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="p-4 bg-muted/50">
                <code className="text-xs">{getPreviewPrompt()}</code>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex justify-end space-x-2 pt-4">
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
