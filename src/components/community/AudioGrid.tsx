import { Skeleton } from '@/components/ui/skeleton';
import { Music } from 'lucide-react';

interface AudioGridProps {
  children: React.ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
}

export const AudioGrid = ({ children, isLoading, isEmpty, emptyMessage = 'no audios found' }: AudioGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[200px] rounded-lg" />
        ))}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Music className="h-16 w-16 text-muted-foreground/50" />
        <p className="text-lg text-muted-foreground lowercase">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {children}
    </div>
  );
};
