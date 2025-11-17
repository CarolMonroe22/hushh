# 🧪 Testing Guide - Hushh

## 📋 Overview

This project uses **Vitest** as the testing framework with **React Testing Library** for component testing.

### Testing Stack

- **Test Runner:** Vitest
- **Component Testing:** @testing-library/react
- **DOM Environment:** happy-dom
- **Assertions:** Vitest + @testing-library/jest-dom
- **User Interactions:** @testing-library/user-event

---

## 🚀 Running Tests

### Basic Commands

```bash
# Run all tests (watch mode)
npm test

# Run tests once (CI mode)
npm test -- --run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test src/hooks/__tests__/useAuth.test.tsx

# Run tests matching a pattern
npm test -- --grep="useAuth"
```

---

## 📁 Test Structure

```
src/
├── hooks/
│   ├── __tests__/
│   │   ├── useAuth.test.tsx
│   │   └── useUserSessions.test.tsx
│   ├── useAuth.tsx
│   └── useUserSessions.ts
├── lib/
│   ├── __tests__/
│   │   └── utils.test.ts
│   └── utils.ts
├── components/
│   ├── __tests__/
│   │   └── SessionHistory.test.tsx
│   └── SessionHistory.tsx
└── test/
    ├── setup.ts           # Global test setup
    └── mocks/             # Shared mocks
        └── supabase.ts
```

---

## ✍️ Writing Tests

### Hook Testing Example

```typescript
// src/hooks/__tests__/useAuth.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../useAuth';

describe('useAuth', () => {
  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);
  });

  it('should set loading to false after initialization', async () => {
    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});
```

### Component Testing Example

```typescript
// src/components/__tests__/SessionHistory.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SessionHistory } from '../SessionHistory';

describe('SessionHistory', () => {
  it('should render session list', () => {
    render(<SessionHistory sessions={mockSessions} />);

    expect(screen.getByText('My Sessions')).toBeInTheDocument();
  });

  it('should display empty state when no sessions', () => {
    render(<SessionHistory sessions={[]} />);

    expect(screen.getByText('No sessions yet')).toBeInTheDocument();
  });
});
```

### Utility Function Testing Example

```typescript
// src/lib/__tests__/utils.test.ts
import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn utility', () => {
  it('should merge class names', () => {
    const result = cn('px-2 py-1', 'px-4');
    expect(result).toBe('py-1 px-4');
  });
});
```

---

## 🎭 Mocking

### Mocking Supabase Client

```typescript
// In your test file
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn((callback) => {
        callback('SIGNED_OUT', null);
        return {
          data: {
            subscription: { unsubscribe: vi.fn() },
          },
        };
      }),
      getSession: vi.fn(() =>
        Promise.resolve({
          data: { session: null },
          error: null,
        })
      ),
    },
  },
}));
```

### Mocking External APIs

```typescript
// Mock ElevenLabs API
global.fetch = vi.fn((url) => {
  if (url.includes('elevenlabs.io')) {
    return Promise.resolve({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    });
  }
});
```

### Mocking React Query

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

render(<Component />, { wrapper });
```

---

## 🎯 Best Practices

### 1. **Test Behavior, Not Implementation**

```typescript
// ❌ Bad - Testing implementation details
it('should call setState with user data', () => {
  const { result } = renderHook(() => useAuth());
  expect(result.current.setState).toHaveBeenCalledWith(...);
});

// ✅ Good - Testing behavior
it('should display user name after login', async () => {
  render(<UserProfile />);
  await userEvent.click(screen.getByText('Login'));
  expect(screen.getByText('John Doe')).toBeInTheDocument();
});
```

### 2. **Use Accessibility Queries**

```typescript
// Preferred query order:
// 1. getByRole
screen.getByRole('button', { name: /submit/i });

// 2. getByLabelText
screen.getByLabelText(/email/i);

// 3. getByPlaceholderText
screen.getByPlaceholderText(/enter email/i);

// 4. getByText
screen.getByText(/welcome/i);

// 5. getByTestId (last resort)
screen.getByTestId('custom-element');
```

### 3. **Wait for Async Updates**

```typescript
import { waitFor, screen } from '@testing-library/react';

// ✅ Good
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// ✅ Also good - using findBy
expect(await screen.findByText('Loaded')).toBeInTheDocument();
```

### 4. **Clean Up After Each Test**

```typescript
// Already configured in src/test/setup.ts
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
```

### 5. **Group Related Tests**

```typescript
describe('useAuth', () => {
  describe('initialization', () => {
    it('should start with loading state', () => {});
    it('should load session from storage', () => {});
  });

  describe('sign in', () => {
    it('should sign in with email', () => {});
    it('should handle sign in errors', () => {});
  });

  describe('sign out', () => {
    it('should clear user state', () => {});
  });
});
```

---

## 📊 Coverage Reports

### Generating Coverage

```bash
# Generate coverage report
npm run test:coverage

# Open coverage report in browser
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

### Coverage Thresholds

Currently, coverage thresholds are **not enforced** to allow incremental improvement. Recommended targets:

- **Statements:** 80%
- **Branches:** 75%
- **Functions:** 80%
- **Lines:** 80%

To enforce thresholds, add to `vite.config.ts`:

```typescript
test: {
  coverage: {
    thresholds: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
  },
}
```

---

## 🔧 Configuration

### vite.config.ts

```typescript
test: {
  globals: true,
  environment: "happy-dom",
  setupFiles: ["./src/test/setup.ts"],
  css: true,
  coverage: {
    provider: "v8",
    reporter: ["text", "json", "html"],
    exclude: [
      "node_modules/",
      "src/test/",
      "**/*.d.ts",
      "**/*.config.*",
      "**/mockData",
      "**/dist",
    ],
  },
}
```

### src/test/setup.ts

```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Global mocks (matchMedia, IntersectionObserver, etc.)
```

---

## 🚧 Current Test Coverage

As of this implementation:

```
File                        | % Stmts | % Branch | % Funcs | % Lines
----------------------------|---------|----------|---------|--------
src/hooks/useAuth.tsx       |   95%   |   90%    |  100%   |   95%
src/lib/utils.ts            |  100%   |  100%    |  100%   |  100%
----------------------------|---------|----------|---------|--------
TOTAL                       |   ~5%   |   ~5%    |   ~5%   |   ~5%
```

### Priority Areas to Test

1. **Hooks:**
   - ✅ useAuth (done)
   - ⬜ useUserSessions
   - ⬜ useConnectivity

2. **Components:**
   - ⬜ SessionHistory
   - ⬜ AuthModal
   - ⬜ SessionPlayer controls

3. **Utilities:**
   - ✅ cn function (done)
   - ⬜ Audio utility functions (when extracted)

4. **Edge Functions:**
   - ⬜ generate-custom-asmr
   - ⬜ interpret-vibe-prompt
   - ⬜ Rate limiting logic

---

## 🎓 Learning Resources

### Official Documentation

- **Vitest:** https://vitest.dev/
- **React Testing Library:** https://testing-library.com/react
- **Testing Library Queries:** https://testing-library.com/docs/queries/about

### Recommended Reading

- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Which Query Should I Use?](https://testing-library.com/docs/queries/about#priority)
- [Testing Implementation Details](https://kentcdodds.com/blog/testing-implementation-details)

---

## 🐛 Debugging Tests

### Visual Debugging

```typescript
import { screen } from '@testing-library/react';

// Print the current DOM
screen.debug();

// Print a specific element
screen.debug(screen.getByRole('button'));
```

### Run Tests in Debug Mode

```bash
# Node.js debugging
node --inspect-brk ./node_modules/.bin/vitest --run

# VS Code debugging (add to .vscode/launch.json)
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["test", "--", "--run"],
  "console": "integratedTerminal"
}
```

### Verbose Output

```bash
# Show all test names
npm test -- --reporter=verbose

# Show detailed errors
npm test -- --reporter=verbose --bail
```

---

## ✅ Testing Checklist

Before committing code, ensure:

- [ ] All tests pass (`npm test -- --run`)
- [ ] New features have corresponding tests
- [ ] Bug fixes include regression tests
- [ ] Coverage hasn't decreased significantly
- [ ] No skipped tests (`.skip()`) in committed code
- [ ] No focused tests (`.only()`) in committed code

---

## 🚀 CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm test -- --run
      - run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

---

## 📝 Next Steps

1. **Increase Coverage:**
   - Add tests for `useUserSessions` hook
   - Test critical user flows (session creation, playback)
   - Add component integration tests

2. **E2E Testing:**
   - Consider adding Playwright for end-to-end tests
   - Test full user journeys (signup → create session → play)

3. **Performance Testing:**
   - Add performance benchmarks for audio processing
   - Test memory leaks in long-running sessions

4. **Visual Regression:**
   - Consider Chromatic or Percy for visual testing
   - Ensure UI consistency across changes

---

**Last Updated:** 2025-11-17

---

For questions or improvements, consult:
- `REVIEW_HUSHH.md` - General code review
- `ENVIRONMENT_SETUP.md` - Environment configuration
- [Vitest Documentation](https://vitest.dev/)
