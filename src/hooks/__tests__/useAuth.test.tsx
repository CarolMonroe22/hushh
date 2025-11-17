import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../useAuth';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn((callback) => {
        // Simulate initial state
        setTimeout(() => callback('SIGNED_OUT', null), 0);
        return {
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        };
      }),
      getSession: vi.fn(() =>
        Promise.resolve({
          data: { session: null },
          error: null,
        })
      ),
      signUp: vi.fn(() =>
        Promise.resolve({
          data: { user: null, session: null },
          error: null,
        })
      ),
      signInWithPassword: vi.fn(() =>
        Promise.resolve({
          data: { user: null, session: null },
          error: null,
        })
      ),
      signOut: vi.fn(() =>
        Promise.resolve({
          error: null,
        })
      ),
      signInWithOAuth: vi.fn(() =>
        Promise.resolve({
          data: { provider: 'google', url: null },
          error: null,
        })
      ),
    },
  },
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);
    expect(result.current.session).toBe(null);
  });

  it('should provide auth methods', () => {
    const { result } = renderHook(() => useAuth());

    expect(typeof result.current.signUp).toBe('function');
    expect(typeof result.current.signIn).toBe('function');
    expect(typeof result.current.signOut).toBe('function');
    expect(typeof result.current.signInWithGoogle).toBe('function');
  });

  it('should set loading to false after initialization', async () => {
    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should call signUp with correct parameters', async () => {
    const { result } = renderHook(() => useAuth());
    const { supabase } = await import('@/integrations/supabase/client');

    const email = 'test@example.com';
    const password = 'password123';
    const fullName = 'Test User';

    await result.current.signUp(email, password, fullName);

    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email,
      password,
      options: {
        emailRedirectTo: expect.any(String),
        data: {
          full_name: fullName,
        },
      },
    });
  });

  it('should call signIn with correct parameters', async () => {
    const { result } = renderHook(() => useAuth());
    const { supabase } = await import('@/integrations/supabase/client');

    const email = 'test@example.com';
    const password = 'password123';

    await result.current.signIn(email, password);

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email,
      password,
    });
  });

  it('should call signOut', async () => {
    const { result } = renderHook(() => useAuth());
    const { supabase } = await import('@/integrations/supabase/client');

    await result.current.signOut();

    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('should call signInWithGoogle with correct parameters', async () => {
    const { result } = renderHook(() => useAuth());
    const { supabase } = await import('@/integrations/supabase/client');

    await result.current.signInWithGoogle();

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: expect.any(String),
      },
    });
  });
});
