import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showStatus && isOnline) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all ${
      isOnline 
        ? 'bg-green-500/90 text-white' 
        : 'bg-red-500/90 text-white'
    }`}>
      <Icon 
        name={isOnline ? 'Wifi' : 'WifiOff'} 
        size={20} 
      />
      <span className="font-medium">
        {isOnline ? 'Подключение восстановлено' : 'Нет подключения к интернету'}
      </span>
    </div>
  );
}
