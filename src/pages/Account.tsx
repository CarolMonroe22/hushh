import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { BottomNavigation } from '@/components/BottomNavigation';

const profileSchema = z.object({
  full_name: z.string().trim().min(2, { message: "Name must be at least 2 characters" }).max(100),
  avatar_url: z.string().url({ message: "Must be a valid URL" }).optional().or(z.literal('')),
});

const passwordSchema = z.object({
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Account = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  
  // Profile form state
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Password form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch user statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      const { count: totalSessions } = await supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      const { count: favoritesCount } = await supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('is_favorite', true);

      const { data: sessions } = await supabase
        .from('user_sessions')
        .select('duration_seconds, mood, ambient')
        .eq('user_id', user?.id);

      const totalSeconds = sessions?.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) || 0;
      const totalMinutes = Math.floor(totalSeconds / 60);

      // Calculate most used mood
      const moodCounts = sessions?.reduce((acc, s) => {
        if (s.mood) acc[s.mood] = (acc[s.mood] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const topMood = moodCounts && Object.keys(moodCounts).length > 0
        ? Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0]
        : null;

      // Calculate most used ambient
      const ambientCounts = sessions?.reduce((acc, s) => {
        if (s.ambient) acc[s.ambient] = (acc[s.ambient] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const topAmbient = ambientCounts && Object.keys(ambientCounts).length > 0
        ? Object.entries(ambientCounts).sort((a, b) => b[1] - a[1])[0][0]
        : null;

      return {
        totalSessions: totalSessions || 0,
        favoritesCount: favoritesCount || 0,
        totalMinutes,
        topMood,
        topAmbient,
      };
    },
    enabled: !!user?.id,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: { full_name?: string; avatar_url?: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully",
      });
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update password",
        variant: "destructive",
      });
    },
  });

  // Resend confirmation email
  const resendConfirmation = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user?.email || '',
      });
      if (error) throw error;
      toast({
        title: "Email Sent",
        description: "Please check your inbox for the confirmation email",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send email",
        variant: "destructive",
      });
    }
  };

  // Set form values when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    try {
      profileSchema.parse({ full_name: fullName, avatar_url: avatarUrl });
      updateProfileMutation.mutate({
        full_name: fullName,
        avatar_url: avatarUrl || undefined,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    }
  };

  const handleUpdatePassword = async () => {
    try {
      passwordSchema.parse({ newPassword, confirmPassword });
      updatePasswordMutation.mutate(newPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/auth');
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-pulse text-4xl">🌙</div>
          <p className="text-muted-foreground lowercase">loading...</p>
        </div>
      </div>
    );
  }

  const isEmailConfirmed = !!user?.email_confirmed_at;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-light lowercase tracking-wider">my account</h1>
          <p className="text-sm text-muted-foreground lowercase mt-1">manage your profile and settings</p>
        </div>

        {/* Main content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="lowercase">profile</TabsTrigger>
            <TabsTrigger value="stats" className="lowercase">statistics</TabsTrigger>
            <TabsTrigger value="security" className="lowercase">security</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="lowercase">personal information</CardTitle>
                <CardDescription className="lowercase">
                  update your profile details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {profileLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback className="text-2xl">
                          {fullName?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      {isEditing && (
                        <div className="flex-1">
                          <Label htmlFor="avatar" className="lowercase">avatar url</Label>
                          <Input
                            id="avatar"
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            placeholder="https://..."
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name" className="lowercase">full name</Label>
                      <Input
                        id="name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="lowercase">email</Label>
                      <Input
                        id="email"
                        value={user.email || ''}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground lowercase">
                        email cannot be changed
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <Button
                            onClick={handleSaveProfile}
                            disabled={updateProfileMutation.isPending}
                            className="lowercase"
                          >
                            {updateProfileMutation.isPending ? 'saving...' : 'save changes'}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setIsEditing(false);
                              setFullName(profile?.full_name || '');
                              setAvatarUrl(profile?.avatar_url || '');
                            }}
                            className="lowercase"
                          >
                            cancel
                          </Button>
                        </>
                      ) : (
                        <Button onClick={() => setIsEditing(true)} className="lowercase">
                          edit profile
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-4">
            {statsLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
            ) : stats?.totalSessions === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center space-y-2">
                  <p className="text-muted-foreground lowercase">no sessions yet</p>
                  <p className="text-sm text-muted-foreground lowercase">
                    create your first session to see your statistics
                  </p>
                  <Button onClick={() => navigate('/')} className="lowercase mt-4">
                    create session
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium lowercase">total sessions</CardTitle>
                    <span className="text-2xl">🎧</span>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats?.totalSessions}</div>
                    <p className="text-xs text-muted-foreground lowercase mt-1">
                      sessions created
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium lowercase">favorites</CardTitle>
                    <span className="text-2xl">⭐</span>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats?.favoritesCount}</div>
                    <p className="text-xs text-muted-foreground lowercase mt-1">
                      saved to library
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium lowercase">listening time</CardTitle>
                    <span className="text-2xl">⏱️</span>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {stats?.totalMinutes ? `${stats.totalMinutes}m` : '0m'}
                    </div>
                    <p className="text-xs text-muted-foreground lowercase mt-1">
                      total minutes
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium lowercase">top preferences</CardTitle>
                    <span className="text-2xl">✨</span>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {stats?.topMood && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="lowercase">
                          {stats.topMood}
                        </Badge>
                        <span className="text-xs text-muted-foreground lowercase">mood</span>
                      </div>
                    )}
                    {stats?.topAmbient && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="lowercase">
                          {stats.topAmbient}
                        </Badge>
                        <span className="text-xs text-muted-foreground lowercase">ambient</span>
                      </div>
                    )}
                    {!stats?.topMood && !stats?.topAmbient && (
                      <p className="text-xs text-muted-foreground lowercase">
                        create more sessions
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="lowercase">email verification</CardTitle>
                <CardDescription className="lowercase">
                  manage your email confirmation status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium lowercase">email status</p>
                    <p className="text-xs text-muted-foreground lowercase mt-1">
                      {user.email}
                    </p>
                  </div>
                  <Badge variant={isEmailConfirmed ? "default" : "secondary"} className="lowercase">
                    {isEmailConfirmed ? '✓ verified' : '! unverified'}
                  </Badge>
                </div>
                {!isEmailConfirmed && (
                  <Button
                    variant="outline"
                    onClick={resendConfirmation}
                    className="lowercase w-full"
                  >
                    resend confirmation email
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="lowercase">change password</CardTitle>
                <CardDescription className="lowercase">
                  update your account password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="lowercase">new password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="lowercase">confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
                <Button
                  onClick={handleUpdatePassword}
                  disabled={updatePasswordMutation.isPending || !newPassword || !confirmPassword}
                  className="lowercase w-full"
                >
                  {updatePasswordMutation.isPending ? 'updating...' : 'update password'}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="lowercase text-destructive">danger zone</CardTitle>
                <CardDescription className="lowercase">
                  irreversible actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="lowercase w-full">
                      sign out
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="lowercase">sign out?</AlertDialogTitle>
                      <AlertDialogDescription className="lowercase">
                        you will need to log in again to access your account
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="lowercase">cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSignOut} className="lowercase">
                        sign out
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Account;
