# Contributing to Hushh

Thank you for your interest in contributing to Hushh! This document provides guidelines and instructions for contributing.

## Development Setup

1. **Clone the repository**
```sh
git clone <YOUR_GIT_URL>
cd hushh
```

2. **Install dependencies**
```sh
npm install
```

3. **Set up environment variables**
```sh
cp .env.example .env
# Edit .env with your Supabase credentials
```

4. **Start development server**
```sh
npm run dev
```

The app will be available at `http://localhost:8080`

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow existing code formatting
- Run `npm run lint` before committing
- Keep components small and focused (under 300 lines when possible)

### Component Guidelines

- Place reusable UI components in `src/components/ui/`
- Place feature-specific components in `src/components/`
- Use proper TypeScript types (avoid `any`)
- Add JSDoc comments for complex functions

### State Management

- Use React Query for server state
- Use React hooks (useState, useEffect) for local state
- Extract complex logic into custom hooks

### Commit Messages

Use clear, descriptive commit messages:
- ✅ "Add voice gender selection to Voice Journeys"
- ✅ "Fix audio playback race condition on mobile"
- ✅ "Refactor session history into separate component"
- ❌ "Fix bug"
- ❌ "Update stuff"

## Testing

Currently, this project doesn't have tests. We welcome contributions to add testing infrastructure!

Planned testing tools:
- Vitest for unit tests
- React Testing Library for component tests
- Playwright for E2E tests

## Pull Request Process

1. Create a new branch for your feature/fix
2. Make your changes
3. Run `npm run lint` to check for issues
4. Test your changes locally
5. Commit your changes with clear messages
6. Push to your fork and submit a pull request

## Security

- **NEVER** commit `.env` files or credentials
- Use environment variables for sensitive data
- Report security vulnerabilities privately to the maintainers

## Questions?

Feel free to open an issue for:
- Bug reports
- Feature requests
- Questions about the codebase
- Suggestions for improvements

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
