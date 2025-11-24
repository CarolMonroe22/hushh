import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CommunityFiltersProps {
  sessionType: 'all' | 'preset' | 'creator' | 'binaural' | 'voice';
  sortBy: 'newest' | 'oldest' | 'most-played';
  onSessionTypeChange: (type: 'all' | 'preset' | 'creator' | 'binaural' | 'voice') => void;
  onSortByChange: (sort: 'newest' | 'oldest' | 'most-played') => void;
}

export const CommunityFilters = ({
  sessionType,
  sortBy,
  onSessionTypeChange,
  onSortByChange,
}: CommunityFiltersProps) => {
  const sessionTypes = [
    { value: 'all', label: 'all' },
    { value: 'preset', label: 'preset' },
    { value: 'creator', label: 'creator' },
    { value: 'binaural', label: 'binaural' },
    { value: 'voice', label: 'voice' },
  ] as const;

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex flex-wrap gap-2">
        {sessionTypes.map((type) => (
          <Button
            key={type.value}
            variant={sessionType === type.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSessionTypeChange(type.value)}
            className="lowercase"
          >
            {type.label}
          </Button>
        ))}
      </div>

      <Select value={sortBy} onValueChange={onSortByChange as (value: string) => void}>
        <SelectTrigger className="w-[180px] lowercase">
          <SelectValue placeholder="sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest" className="lowercase">newest</SelectItem>
          <SelectItem value="oldest" className="lowercase">oldest</SelectItem>
          <SelectItem value="most-played" className="lowercase">most played</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
