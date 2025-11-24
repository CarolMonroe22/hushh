import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, Lock, Infinity } from 'lucide-react';
import { Link } from 'react-router-dom';

const Premium = () => {
  const { user } = useAuth();
  const { subscription, isPremium, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground lowercase">loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-4xl font-bold lowercase">premium</h1>
          </div>
          <p className="text-xl text-muted-foreground lowercase">
            coming soon
          </p>
        </div>

        {/* Current Status Card for authenticated users */}
        {user && (
          <Card className="max-w-md mx-auto mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg lowercase">your plan</CardTitle>
                <Badge variant={isPremium ? "default" : "secondary"}>
                  {isPremium ? 'premium' : 'free'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground lowercase">
                {isPremium 
                  ? 'you have unlimited access to all features.'
                  : 'you are currently on the free plan with 3 generations per week.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Coming Soon Card */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-2 lowercase">we're working on something special</CardTitle>
            <CardDescription className="lowercase">
              premium features are under development. want to be one of the first to access unlimited sessions?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Placeholder Benefits */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Infinity className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium lowercase">unlimited generations</p>
                  <p className="text-sm text-muted-foreground lowercase">create as many sessions as you want</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Zap className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium lowercase">extended sessions</p>
                  <p className="text-sm text-muted-foreground lowercase">longer audio experiences (coming soon)</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Lock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium lowercase">private sessions</p>
                  <p className="text-sm text-muted-foreground lowercase">your audios stay private</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground mb-4 lowercase">
                we're still defining the premium experience and pricing. stay tuned!
              </p>
              <Link to="/">
                <Button variant="outline" className="lowercase">
                  back to home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Premium;