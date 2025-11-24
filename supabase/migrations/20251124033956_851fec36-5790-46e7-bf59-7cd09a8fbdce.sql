-- Create subscription tier enum
CREATE TYPE subscription_tier AS ENUM ('free', 'premium');

-- Create user_subscriptions table
CREATE TABLE user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  tier subscription_tier NOT NULL DEFAULT 'free',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view own subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Create weekly_usage table
CREATE TABLE weekly_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  generations_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Enable RLS
ALTER TABLE weekly_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view own usage"
  ON weekly_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Add is_public column to user_sessions
ALTER TABLE user_sessions 
ADD COLUMN is_public boolean DEFAULT false;

-- Create index for performance
CREATE INDEX idx_user_sessions_public ON user_sessions(is_public, created_at DESC) 
WHERE is_public = true;

-- Update user_sessions RLS policies
DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;

CREATE POLICY "Users can view own or public sessions"
  ON user_sessions FOR SELECT
  USING (
    auth.uid() = user_id 
    OR (is_public = true AND auth.uid() IS NOT NULL)
  );

-- Function to check generation limit
CREATE OR REPLACE FUNCTION check_generation_limit(p_user_id uuid)
RETURNS json AS $$
DECLARE
  v_tier subscription_tier;
  v_week_start date;
  v_count integer;
  v_limit integer := 3;
BEGIN
  -- Get user tier
  SELECT tier INTO v_tier
  FROM user_subscriptions
  WHERE user_id = p_user_id;

  -- If no subscription found, default to free
  IF v_tier IS NULL THEN
    v_tier := 'free';
  END IF;

  -- If premium, always allowed
  IF v_tier = 'premium' THEN
    RETURN json_build_object(
      'allowed', true,
      'tier', 'premium',
      'remaining', null,
      'limit', null
    );
  END IF;

  -- Calculate week start (Monday)
  v_week_start := date_trunc('week', CURRENT_DATE)::date;

  -- Get or create weekly usage record
  INSERT INTO weekly_usage (user_id, week_start, generations_count)
  VALUES (p_user_id, v_week_start, 0)
  ON CONFLICT (user_id, week_start) DO NOTHING;

  -- Get current count
  SELECT generations_count INTO v_count
  FROM weekly_usage
  WHERE user_id = p_user_id AND week_start = v_week_start;

  -- Check if can generate
  IF v_count < v_limit THEN
    RETURN json_build_object(
      'allowed', true,
      'tier', 'free',
      'remaining', v_limit - v_count,
      'limit', v_limit
    );
  ELSE
    RETURN json_build_object(
      'allowed', false,
      'tier', 'free',
      'remaining', 0,
      'limit', v_limit
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to increment weekly usage
CREATE OR REPLACE FUNCTION increment_weekly_usage(p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_week_start date;
BEGIN
  v_week_start := date_trunc('week', CURRENT_DATE)::date;
  
  INSERT INTO weekly_usage (user_id, week_start, generations_count)
  VALUES (p_user_id, v_week_start, 1)
  ON CONFLICT (user_id, week_start) 
  DO UPDATE SET 
    generations_count = weekly_usage.generations_count + 1,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create free subscription on user signup
CREATE OR REPLACE FUNCTION handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_subscriptions (user_id, tier)
  VALUES (NEW.id, 'free');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_subscription();

-- Migrate existing data: create free subscriptions for existing users
INSERT INTO user_subscriptions (user_id, tier)
SELECT DISTINCT user_id, 'free'::subscription_tier
FROM user_sessions
ON CONFLICT (user_id) DO NOTHING;

-- Mark all existing sessions as public (since they're from free users)
UPDATE user_sessions
SET is_public = true
WHERE user_id IN (
  SELECT user_id 
  FROM user_subscriptions 
  WHERE tier = 'free'
);