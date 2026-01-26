import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { offlineStorage } from '@/lib/offlineStorage';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      console.log(navigator.onLine ? '🌐 Онлайн' : '📴 Офлайн');
    };

    const updatePendingCount = async () => {
      try {
        const pending = await offlineStorage.getPendingSync();
        setPendingCount(pending.length);
      } catch (error) {
        console.error('Ошибка получения счётчика:', error);
      }
    };

    // Обновляем при изменении статуса сети
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Периодически проверяем очередь
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  if (isOnline && pendingCount === 0) {
    return null; // Не показываем индикатор если всё в порядке
  }

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 ${
      isOnline ? 'bg-amber-500/90' : 'bg-red-500/90'
    }`}>
      <Icon 
        name={isOnline ? "CloudUpload" : "WifiOff"} 
        size={16} 
        className="text-white" 
      />
      <span className="text-white text-sm font-medium">
        {isOnline 
          ? `${pendingCount} записей ожидают синхронизации`
          : 'Офлайн режим'
        }
      </span>
    </div>
  );
}
