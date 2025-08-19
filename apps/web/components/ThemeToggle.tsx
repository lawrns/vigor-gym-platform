'use client';
import { useTheme } from 'next-themes';
import { Icons } from '../lib/icons/registry';
import { Button } from './ui/Button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Cambiar tema"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <Icons.Sun className="h-5 w-5" /> : <Icons.Moon className="h-5 w-5" />}
    </Button>
  );
}
