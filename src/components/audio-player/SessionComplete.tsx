import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SessionCompleteProps {
  sessionFeedback: 'loved' | 'liked' | null;
  onFeedbackChange: (feedback: 'loved' | 'liked') => void;
  waitlistEmail: string;
  onWaitlistEmailChange: (email: string) => void;
  emailSubmitted: boolean;
  onWaitlistSubmit: () => void;
  onReplay: () => void;
  onNewSession: () => void;
}

export const SessionComplete = ({
  sessionFeedback,
  onFeedbackChange,
  waitlistEmail,
  onWaitlistEmailChange,
  emailSubmitted,
  onWaitlistSubmit,
  onReplay,
  onNewSession,
}: SessionCompleteProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-lg w-full px-4">
        {/* Header */}
        <div className="space-y-2">
          <div className="text-6xl mb-4">✨</div>
          <h2 className="text-3xl font-light lowercase tracking-wide">session complete</h2>
        </div>

        {/* Feedback Section */}
        <div className="space-y-4 py-6 border-y border-border/30">
          <p className="text-muted-foreground text-sm">how was your experience?</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => onFeedbackChange('loved')}
              className={`px-6 py-3 rounded-lg border transition-all ${
                sessionFeedback === 'loved'
                  ? 'border-primary bg-primary/10 scale-105'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <span className="text-2xl">❤️</span>
              <p className="text-xs mt-1 lowercase">loved it</p>
            </button>
            <button
              onClick={() => onFeedbackChange('liked')}
              className={`px-6 py-3 rounded-lg border transition-all ${
                sessionFeedback === 'liked'
                  ? 'border-primary bg-primary/10 scale-105'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <span className="text-2xl">👍</span>
              <p className="text-xs mt-1 lowercase">it was good</p>
            </button>
          </div>
        </div>

        {/* Extended Sessions Teaser + Waitlist */}
        {sessionFeedback && (
          <div className="space-y-4 py-6 bg-card/30 rounded-lg px-6">
            <div className="space-y-2">
              <p className="text-sm font-medium lowercase">
                ✨ want longer sessions?
              </p>
              <p className="text-xs text-muted-foreground">
                join the waitlist for extended 5, 10, and 30-minute experiences
              </p>
            </div>

            {!emailSubmitted ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="email"
                  placeholder="your email"
                  value={waitlistEmail}
                  onChange={(e) => onWaitlistEmailChange(e.target.value)}
                  className="lowercase"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onWaitlistSubmit();
                  }}
                />
                <Button
                  onClick={onWaitlistSubmit}
                  size="sm"
                  className="lowercase tracking-wide whitespace-nowrap"
                >
                  join waitlist
                </Button>
              </div>
            ) : (
              <div className="text-sm text-primary lowercase flex items-center justify-center gap-2">
                <span>✓</span> you're on the list!
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button
            onClick={onReplay}
            variant="outline"
            size="lg"
            className="lowercase tracking-wide"
          >
            <span className="mr-2">🔄</span>
            replay this session
          </Button>
          <Button
            onClick={onNewSession}
            size="lg"
            className="lowercase tracking-wide"
          >
            create new session
          </Button>
        </div>
      </div>
    </div>
  );
};
