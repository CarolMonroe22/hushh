# Ralph Base Prompt - Hushh Landing Redesign v2

## Context
You are improving the visual design of the Hushh app landing page. The app is an ASMR/ambient audio generator built with React + TypeScript + Tailwind CSS.

The design goal is **premium, minimal, and refined** - think high-end wellness app aesthetic.

## Target Files
- Primary: `src/pages/Index.tsx` - Main landing page
- Secondary: `src/components/AmbientBackground.tsx` - Video background component
- CSS: `src/index.css` - Custom utility classes

## Typography Classes Available
These classes are defined in index.css:
- `text-display` - Large headlines (text-5xl md:text-7xl font-extralight tracking-tight)
- `text-headline` - Section headers (text-2xl md:text-3xl font-light tracking-tight)
- `text-body` - Body text (text-base font-normal leading-relaxed)
- `text-caption` - Captions (text-sm font-medium tracking-wide)
- `text-micro` - Micro labels (text-xs font-medium uppercase tracking-widest)

## Design Principles
1. **Minimal** - Remove unnecessary elements, keep it clean
2. **Refined** - Subtle borders, soft shadows, careful spacing
3. **Consistent** - Same patterns across all sections
4. **Premium** - High-end feel, no cluttered UI

## Rules
1. Read the file first before making any changes
2. Make ONLY the change specified in the task
3. Do not refactor or improve other code
4. Preserve existing functionality
5. Use Tailwind CSS classes only
6. Verify build passes after changes

## Verification
After making changes, run:
```bash
npm run build
```

If build fails, fix the issue before completing.
