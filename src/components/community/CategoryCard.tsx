import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Music, Sparkles, Headphones, MessageCircle } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface CategoryCardProps {
  category: 'all' | 'preset' | 'creator' | 'binaural' | 'voice';
  audioCount: number;
  onPlayAll: () => void;
  isLoading?: boolean;
}

const categoryConfig: Record<string, { label: string; icon: LucideIcon; gradient: string }> = {
  all: {
    label: 'all',
    icon: Music,
    gradient: 'from-primary/20 to-primary/5',
  },
  preset: {
    label: 'preset',
    icon: Music,
    gradient: 'from-accent/20 to-accent/5',
  },
  creator: {
    label: 'creator',
    icon: Sparkles,
    gradient: 'from-secondary/20 to-secondary/5',
  },
  binaural: {
    label: 'binaural',
    icon: Headphones,
    gradient: 'from-muted/40 to-muted/10',
  },
  voice: {
    label: 'voice',
    icon: MessageCircle,
    gradient: 'from-primary/15 to-primary/5',
  },
};

export const CategoryCard = ({ category, audioCount, onPlayAll, isLoading }: CategoryCardProps) => {
  const config = categoryConfig[category];
  const Icon = config.icon;

  return (
    <Card 
      className={`h-[200px] p-6 flex flex-col justify-between transition-all duration-300 hover:scale-105 hover:shadow-lg bg-gradient-to-br ${config.gradient} border-border/50`}
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Icon className="h-6 w-6 text-foreground/70" />
          <h3 className="text-2xl font-semibold lowercase">{config.label}</h3>
        </div>
        <p className="text-muted-foreground lowercase">
          {audioCount} {audioCount === 1 ? 'audio' : 'audios'}
        </p>
      </div>

      <Button
        onClick={onPlayAll}
        disabled={isLoading || audioCount === 0}
        className="w-full lowercase"
        size="lg"
      >
        <Play className="h-5 w-5 mr-2" />
        play all
      </Button>
    </Card>
  );
};
