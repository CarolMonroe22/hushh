import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  fullName: z.string().trim().min(2, { message: "Name must be at least 2 characters" }).max(100).optional(),
});

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal = ({ open, onOpenChange, onSuccess, initialMode = 'login' }: AuthModalProps) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();

  // Reset to initial mode when modal opens
  useEffect(() => {
    if (open) {
      setIsLogin(initialMode === 'login');
    }
  }, [open, initialMode]);

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      // Reset state after close animation
      setTimeout(() => {
        setEmail('');
        setPassword('');
        setFullName('');
        setIsLogin(true);
      }, 200);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validationData = isLogin 
        ? { email, password }
        : { email, password, fullName };
      
      authSchema.parse(validationData);

      setIsSubmitting(true);

      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Login Failed",
              description: "Invalid email or password",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else {
          toast({
            title: "Welcome back!",
            description: "You've successfully logged in",
          });
          handleClose();
          onSuccess?.();
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('User already registered')) {
            toast({
              title: "Account Exists",
              description: "This email is already registered. Please login instead.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else {
          toast({
            title: "✅ Account Created!",
            description: "Please check your email to confirm your account. You may need to check your spam folder.",
            duration: 8000,
          });
          setTimeout(() => {
            handleClose();
            onSuccess?.();
          }, 1000);
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Something went wrong",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 bg-card border-border">
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-8 space-y-6">
          {/* Heart icon */}
          <div className="flex justify-center mb-2">
            <div className="text-5xl">💖</div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-light lowercase tracking-wide">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-sm text-muted-foreground lowercase">
              {isLogin ? 'sign in to continue' : 'sign up to get started'}
            </p>
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="lowercase text-sm">
                  full name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="your name"
                  required={!isLogin}
                  disabled={isSubmitting}
                  className="bg-input border-border"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="lowercase text-sm">
                email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={isSubmitting}
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="lowercase text-sm">
                password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                required
                disabled={isSubmitting}
                minLength={6}
                className="bg-input border-border"
              />
            </div>

            <Button
              type="submit"
              className="w-full py-6 text-base lowercase tracking-wide"
              disabled={isSubmitting}
              size="lg"
            >
              {isSubmitting ? 'loading...' : (isLogin ? 'sign in' : 'create account')}
            </Button>
          </form>

          {/* Toggle login/signup */}
          <div className="text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              disabled={isSubmitting}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors lowercase"
            >
              {isLogin ? "don't have an account? sign up" : 'already have an account? sign in'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
