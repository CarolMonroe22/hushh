import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, ThumbsUp, RotateCw, Plus } from "lucide-react";

interface SessionCompleteProps {
  sessionTitle: string;
  loopCount: number;
  onReplay: () => void;
  onNewSession: () => void;
  onFeedback?: (type: 'loved' | 'liked') => void;
  onJoinWaitlist?: (email: string) => void;
}

export const SessionComplete = ({
  sessionTitle,
  loopCount,
  onReplay,
  onNewSession,
  onFeedback,
  onJoinWaitlist,
}: SessionCompleteProps) => {
  const [sessionFeedback, setSessionFeedback] = useState<'loved' | 'liked' | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  const handleFeedback = (type: 'loved' | 'liked') => {
    setSessionFeedback(type);
    onFeedback?.(type);
  };

  const handleWaitlistSubmit = () => {
    if (waitlistEmail.trim() && waitlistEmail.includes('@')) {
      setEmailSubmitted(true);
      onJoinWaitlist?.(waitlistEmail);
    }
  };

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <h3 className="text-2xl font-light text-white">
          Session Complete
        </h3>
        {loopCount > 0 && (
          <p className="text-sm text-white/60">
            You listened {loopCount + 1} {loopCount === 0 ? 'time' : 'times'}
          </p>
        )}
        <p className="text-white/80 font-light">
          {sessionTitle || "Your session"}
        </p>
      </div>

      <div className="flex justify-center gap-3">
        <Button
          size="sm"
          variant={sessionFeedback === 'loved' ? "default" : "outline"}
          className={`gap-2 ${
            sessionFeedback === 'loved'
              ? "bg-red-500/20 border-red-400/40 text-red-300"
              : "bg-black/20 border-white/20 text-white/80 hover:bg-white/10"
          }`}
          onClick={() => handleFeedback('loved')}
        >
          <Heart className={`w-4 h-4 ${sessionFeedback === 'loved' ? 'fill-red-400' : ''}`} />
          Loved it
        </Button>
        <Button
          size="sm"
          variant={sessionFeedback === 'liked' ? "default" : "outline"}
          className={`gap-2 ${
            sessionFeedback === 'liked'
              ? "bg-blue-500/20 border-blue-400/40 text-blue-300"
              : "bg-black/20 border-white/20 text-white/80 hover:bg-white/10"
          }`}
          onClick={() => handleFeedback('liked')}
        >
          <ThumbsUp className={`w-4 h-4 ${sessionFeedback === 'liked' ? 'fill-blue-400' : ''}`} />
          Good
        </Button>
      </div>

      {onJoinWaitlist && (
        <div className="space-y-3 pt-4 border-t border-white/10">
          <p className="text-sm text-white/70">
            Want longer sessions? (5, 10, 30 minutes)
          </p>
          {!emailSubmitted ? (
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                className="bg-black/20 border-white/20 text-white placeholder:text-white/40"
              />
              <Button
                size="sm"
                onClick={handleWaitlistSubmit}
                disabled={!waitlistEmail.trim() || !waitlistEmail.includes('@')}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                Join Waitlist
              </Button>
            </div>
          ) : (
            <p className="text-sm text-green-400/80">
              ✓ You're on the list! We'll notify you soon.
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20 gap-2"
          onClick={onReplay}
        >
          <RotateCw className="w-4 h-4" />
          Replay
        </Button>
        <Button
          className="flex-1 bg-white/20 hover:bg-white/30 text-white border border-white/30 gap-2"
          onClick={onNewSession}
        >
          <Plus className="w-4 h-4" />
          New Session
        </Button>
      </div>
    </div>
  );
};
