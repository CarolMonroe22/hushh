import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserProfileCardProps {
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
  };
  stats: {
    totalSessions: number;
    totalPlays: number;
    mostUsedType: string;
  };
}

export const UserProfileCard = ({ profile, stats }: UserProfileCardProps) => {
  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardContent className="p-8">
        <div className="flex flex-col items-center space-y-6">
          <Avatar className="h-32 w-32">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-4xl">
              {profile.full_name ? getInitials(profile.full_name) : <User className="h-16 w-16" />}
            </AvatarFallback>
          </Avatar>

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold lowercase">{profile.full_name || 'anonymous user'}</h1>
            <p className="text-muted-foreground lowercase">
              member since {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
            </p>
          </div>

          <div className="flex gap-8 pt-4 border-t border-border w-full justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.totalSessions}</p>
              <p className="text-sm text-muted-foreground lowercase">public sessions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.totalPlays}</p>
              <p className="text-sm text-muted-foreground lowercase">total plays</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold lowercase">{stats.mostUsedType}</p>
              <p className="text-sm text-muted-foreground lowercase">favorite type</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
