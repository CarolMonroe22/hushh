import { useState, useEffect } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { ExampleSession } from '@/hooks/useExampleSessions';
import { ASMR_PROMPTS, BINAURAL_PROMPTS, JOURNEY_PROMPTS } from '@/lib/generationPrompts';

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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
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

  // Auto-generate title and key
  const generateTitle = (): string => {
    switch (sessionType) {
      case 'preset':
        if (mood && ambient) {
          return `${mood.charAt(0).toUpperCase() + mood.slice(1)} with ${ambient.charAt(0).toUpperCase() + ambient.slice(1)}`;
        }
        return 'Preset Session';
        
      case 'binaural':
        if (binauralExp) {
          const exp = BINAURAL_EXPERIENCES.find(e => e.value === binauralExp);
          return exp ? `${exp.label} Experience` : 'Binaural Experience';
        }
        return 'Binaural Experience';
        
      case 'voice':
        if (voiceJourney) {
          const journey = VOICE_JOURNEYS.find(j => j.value === voiceJourney);
          return journey ? `${journey.label} (${voiceGender || 'female'} voice)` : 'Voice Journey';
        }
        return 'Voice Journey';
        
      case 'creator':
        if (vibeDesc) {
          const words = vibeDesc.split(' ').filter(w => w.length > 3).slice(0, 4).join(' ');
          return words || 'Custom Vibe';
        }
        return 'Custom Vibe';
        
      default:
        return 'Example Session';
    }
  };

  const generateExampleKey = (): string => {
    const timestamp = Date.now().toString().slice(-4);
    
    switch (sessionType) {
      case 'preset':
        return mood && ambient ? `preset-${mood}-${ambient}` : `preset-${timestamp}`;
        
      case 'binaural':
        return binauralExp ? `binaural-${binauralExp}` : `binaural-${timestamp}`;
        
      case 'voice':
        return voiceJourney ? `voice-${voiceJourney}-${voiceGender || 'female'}` : `voice-${timestamp}`;
        
      case 'creator':
        return `creator-${timestamp}`;
        
      default:
        return `example-${timestamp}`;
    }
  };

  // Auto-initialize values when modal opens
  useEffect(() => {
    if (open && !example) {
      // Generar valores iniciales si hay opciones seleccionadas
      const title = generateTitle();
      const key = generateExampleKey();
      
      if (title && !formValues.title) {
        setValue('title', title);
      }
      if (key && !formValues.example_key) {
        setValue('example_key', key);
      }
    }
  }, [open, example]);

  // Auto-update title and key when options change
  useEffect(() => {
    if (!example) {
      const subscription = watch((value, { name }) => {
        if (['mood', 'ambient', 'binaural_experience', 'voice_journey', 'voice_gender', 'vibe_description', 'session_type'].includes(name || '')) {
          setValue('title', generateTitle());
          setValue('example_key', generateExampleKey());
        }
      });
      
      return () => subscription.unsubscribe();
    }
  }, [watch, setValue, sessionType, mood, ambient, binauralExp, voiceJourney, voiceGender, vibeDesc, example]);

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
      toast.success(example ? 'Example updated!' : '✅ Example created! Generate audio from the table.');
      reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed: ${error.message}`);
    },
  });

  const onSubmit = (data: FormData) => {
    // Validar que título y key existan
    if (!data.title || data.title.trim() === '') {
      toast.error('Title is required. Please select session options to generate it.');
      return;
    }
    
    if (!data.example_key || data.example_key.trim() === '') {
      toast.error('Example key is required. Please select session options to generate it.');
      return;
    }
    
    toast.info('Creating example...');
    mutation.mutate(data);
  };

  const getGenerationPrompt = (): string => {
    switch (sessionType) {
      case 'preset':
        if (mood && ambient) {
          const key = `${mood}_${ambient}`;
          return ASMR_PROMPTS[key] || '⚠️ Prompt not found for this combination';
        }
        return '👆 Select mood and ambient to see the real prompt that will be used for generation';
        
      case 'binaural':
        if (binauralExp) {
          return BINAURAL_PROMPTS[binauralExp] || '⚠️ Prompt not found for this experience';
        }
        return '👆 Select an experience to see the real prompt that will be used for generation';
        
      case 'voice':
        if (voiceJourney) {
          const prompt = JOURNEY_PROMPTS[voiceJourney] || '⚠️ Prompt not found';
          return `🎤 Voice Journey Prompt:\n\n${prompt}\n\n📊 Configuration:\n- Gender: ${voiceGender || 'female'}\n- Ambient: ${ambient || 'none'}`;
        }
        return '👆 Select a journey type to see the real prompt that will be used for generation';
        
      case 'creator':
        if (vibeDesc && vibeDesc.length >= 20) {
          return `📝 Your Input:\n"${vibeDesc}"\n\n⚡ AI Reinterpretation Flow (same as users):\n\n1. Your description is sent to AI\n2. AI analyzes and optimizes it\n3. Chooses appropriate voice gender\n4. Selects matching ambient sound\n5. Generates professional 100-150 word ASMR prompt\n6. Creates catchy 2-4 word title\n\nThe AI transforms your input into a professional prompt automatically.`;
        }
        return vibeDesc 
          ? '⚠️ Description must be at least 20 characters' 
          : '👆 Write your vibe description to see what will happen';
        
      default:
        return '👆 Select a session type to begin';
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
                <Label htmlFor="title">Title (auto-generated, editable)</Label>
                <Input 
                  id="title" 
                  {...register('title')} 
                  placeholder="Select options above to auto-generate..." 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="example_key">Example Key (auto-generated, editable)</Label>
                <Input 
                  id="example_key" 
                  {...register('example_key')} 
                  placeholder="Will be generated automatically..." 
                />
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

          {/* Preview Section */}
          <div className="border-t pt-4">
            <Collapsible open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" className="w-full justify-between hover:bg-primary/5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="font-semibold">Example Preview & Generation Prompt</span>
                  </div>
                  <ChevronDown className={`h-5 w-5 transition-transform ${isPreviewOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-1">✨ Title:</p>
                      <p className="font-bold">{formValues.title || '(auto-generated)'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-1">🔑 Example Key:</p>
                      <p className="font-mono text-sm">{formValues.example_key || '(auto-generated)'}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-semibold text-muted-foreground">🎯 Real Generation Prompt:</p>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">60 seconds</span>
                    </div>
                    <ScrollArea className="h-[250px] w-full rounded border bg-background/50 p-4">
                      <pre className="text-xs whitespace-pre-wrap font-mono">{getGenerationPrompt()}</pre>
                    </ScrollArea>
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setValue('title', generateTitle());
                      setValue('example_key', generateExampleKey());
                      toast.success('Title and key regenerated!');
                    }}
                  >
                    🔄 Regenerate Title & Key
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating example...
                </>
              ) : (
                '💾 Save Example'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
