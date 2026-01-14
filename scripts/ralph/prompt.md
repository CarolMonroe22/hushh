# Ralph Base Prompt - Hushh Visual Improvements

## Context
You are working on the Hushh app, an ASMR/ambient audio generator built with React + TypeScript + Tailwind CSS.

## Target File
`src/pages/Index.tsx` - This is the main landing page containing mood and ambient card components.

## Code Patterns

### Mood Cards Location
Look for `MOODS.map` - the cards are rendered in a grid with buttons.

### Ambient Cards Location
Look for `AMBIENTS.map` - similar structure to mood cards.

### Current Card Structure
```tsx
<button
  key={item.value}
  onClick={() => setSelected(item.value)}
  className={`p-5 rounded-xl border-2 transition-all duration-300 ease-out text-left ${
    selected === item.value
      ? "border-primary bg-primary/15 shadow-md shadow-primary/20"
      : "border-border/30 bg-card/60 hover:bg-card/80 hover:border-border/60"
  }`}
>
  <div className="mb-2 text-muted-foreground">{item.icon}</div>
  <div className="text-sm font-medium lowercase">{item.label}</div>
</button>
```

## Rules
1. Read the file first before making any changes
2. Make ONLY the change specified in the task
3. Do not refactor or improve other code
4. Preserve existing functionality
5. Use Tailwind CSS classes only
6. Test that the build passes after changes

## Verification
After making changes, run:
```bash
npm run build
```

If build fails, fix the issue before completing.
