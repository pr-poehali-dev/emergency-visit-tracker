import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  if (!showPrompt || !deferredPrompt) return null;

  const dismissed = localStorage.getItem('pwa-prompt-dismissed');
  if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 p-4 z-50 animate-in slide-in-from-bottom duration-300">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
      >
        <X size={20} />
      </button>

      <div className="flex items-start gap-3">
        <div className="bg-sky-500 rounded-lg p-2 flex-shrink-0">
          <Download className="text-white" size={24} />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
            Установить приложение
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
            Установите приложение на телефон для быстрого доступа и работы офлайн
          </p>

          <button
            onClick={handleInstall}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Установить
          </button>
        </div>
      </div>
    </div>
  );
}
