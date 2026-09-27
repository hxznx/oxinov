'use client';

import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';
const KEY = 'ox-theme';

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

/** Switches between the dark default and the Daylight theme; remembered on this device only. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => setTheme(currentTheme()), []);

  function toggle() {
    const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Storage can be blocked; the choice then lasts for this page view only.
    }
    setTheme(next);
  }

  return (
    <button type="button" onClick={toggle} className="btn btn-secondary text-sm" aria-pressed={theme === 'light'}>
      {theme === 'dark' ? 'Daylight theme' : 'Dark theme'}
    </button>
  );
}

/** Inline, render-blocking script so the saved or device theme applies before first paint. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${KEY}');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='dark'}})();`;
