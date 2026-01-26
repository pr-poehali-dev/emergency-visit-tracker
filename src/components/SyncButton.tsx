import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface SyncButtonProps {
  onSync: () => Promise<void>;
  className?: string;
}

export default function SyncButton({ onSync, className = '' }: SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await onSync();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSync}
      disabled={isSyncing}
      className={`text-slate-300 hover:text-white hover:bg-slate-800 ${className}`}
      title="Синхронизировать данные с сервером"
    >
      <Icon 
        name={isSyncing ? "Loader2" : "RefreshCw"} 
        size={18} 
        className={isSyncing ? 'animate-spin' : ''} 
      />
      <span className="ml-2 hidden md:inline">Синхронизация</span>
    </Button>
  );
}
