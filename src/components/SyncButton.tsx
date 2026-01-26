import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface SyncButtonProps {
  onSync: () => Promise<void>;
  className?: string;
}

export default function SyncButton({ onSync, className = '' }: SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  
  useEffect(() => {
    console.log('🔘 SyncButton смонтирован, onSync:', typeof onSync);
  }, [onSync]);

  const handleSync = async () => {
    console.log('🔄 SyncButton: Начало синхронизации');
    setIsSyncing(true);
    try {
      await onSync();
      console.log('✅ SyncButton: Синхронизация завершена');
    } catch (error) {
      console.error('❌ SyncButton: Ошибка синхронизации', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSync}
      disabled={isSyncing}
      className={`border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white ${className}`}
      title="Синхронизировать данные с сервером"
    >
      <Icon 
        name={isSyncing ? "Loader2" : "RefreshCw"} 
        size={18} 
        className={isSyncing ? 'animate-spin' : ''} 
      />
      <span className="ml-2 hidden sm:inline">{isSyncing ? 'Загрузка...' : 'Синхронизация'}</span>
    </Button>
  );
}