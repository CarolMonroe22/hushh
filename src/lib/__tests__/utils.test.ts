import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    const result = cn('px-2 py-1', 'px-4');
    expect(result).toBe('py-1 px-4');
  });

  it('should handle conditional classes', () => {
    const result = cn('base-class', {
      'active-class': true,
      'inactive-class': false,
    });
    expect(result).toContain('base-class');
    expect(result).toContain('active-class');
    expect(result).not.toContain('inactive-class');
  });

  it('should handle undefined and null values', () => {
    const result = cn('valid-class', undefined, null, 'another-class');
    expect(result).toBe('valid-class another-class');
  });

  it('should handle empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should merge Tailwind conflicting classes correctly', () => {
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toBe('text-blue-500');
  });

  it('should handle arrays of classes', () => {
    const result = cn(['class-1', 'class-2'], 'class-3');
    expect(result).toBe('class-1 class-2 class-3');
  });

  it('should handle complex Tailwind merging scenarios', () => {
    const result = cn(
      'p-4 text-sm',
      'p-2', // Should override p-4
      'text-lg' // Should override text-sm
    );
    expect(result).toBe('text-lg p-2');
  });
});
