'use client';

import { useEffect, useState } from 'react';
import { installOffer, type InstallOffer } from '@/lib/install.ts';

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

/**
 * Registers the offline-page service worker once per visit (FR-MOBILE-1504). Renders nothing; the root layout
 * includes it on every page. Only on https or localhost, where browsers allow service workers.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => undefined);
  }, []);
  return null;
}

/**
 * "Install the app" (FR-MOBILE-1504): the browser's own install prompt on Android and desktop Chrome or Edge,
 * and a short "Share › Add to Home Screen" hint on iPhone Safari. Hidden once the app is installed.
 */
export function InstallApp({ className = '' }: { className?: string }) {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [offer, setOffer] = useState<InstallOffer>('none');
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setOffer(installOffer({ standalone, promptReady: false, userAgent: navigator.userAgent }));
    const ready = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
      setOffer(installOffer({ standalone, promptReady: true, userAgent: navigator.userAgent }));
    };
    const installed = () => setOffer('none');
    window.addEventListener('beforeinstallprompt', ready);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', ready);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  if (offer === 'none') return null;
  if (offer === 'prompt' && prompt) {
    return (
      <button
        type="button"
        className={`btn btn-secondary font-studio ${className}`}
        onClick={async () => {
          await prompt.prompt();
          const choice = await prompt.userChoice;
          if (choice.outcome === 'accepted') setOffer('none');
          setPrompt(null);
        }}
      >
        ⇩ Install the app
      </button>
    );
  }
  return (
    <span className={`grid gap-1 ${className}`}>
      <button type="button" className="btn btn-secondary font-studio" aria-expanded={showHint} onClick={() => setShowHint((open) => !open)}>
        ⇩ Install the app
      </button>
      {showHint ? (
        <span role="note" className="text-sm text-muted">
          Tap the Share button <span aria-hidden="true">⎙</span> at the bottom of Safari, then &quot;Add to Home Screen&quot;.
        </span>
      ) : null}
    </span>
  );
}
