import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import type { SiteObject } from '@/pages/Index';

interface SyncTabProps {
  objects: SiteObject[];
}

export default function SyncTab({ objects }: SyncTabProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline' | null>(null);

  const getAllPhotos = () => {
    const photos: { id: string; data: string }[] = [];
    
    objects.forEach(obj => {
      if (obj.objectPhoto) {
        photos.push({
          id: `obj_${obj.id}`,
          data: obj.objectPhoto
        });
      }
      
      obj.visits.forEach(visit => {
        visit.photos.forEach((photo, index) => {
          photos.push({
            id: `visit_${visit.id}_${index}`,
            data: photo
          });
        });
      });
    });
    
    return photos;
  };

  const checkServerStatus = async () => {
    setServerStatus('checking');
    try {
      const response = await fetch('https://functions.poehali.dev/b79c8b0e-36c3-4ab2-bb2b-123cec40662a', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      setServerStatus(response.ok ? 'online' : 'offline');
      return response.ok;
    } catch (error) {
      console.error('Server check error:', error);
      setServerStatus('offline');
      return false;
    }
  };

  const downloadBackup = () => {
    const data = {
      objects: objects,
      users: JSON.parse(localStorage.getItem('mchs_users') || '[]'),
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profire_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('Подготовка данных...');
    
    try {
      const users = localStorage.getItem('mchs_users');
      const payload = {
        action: 'sync',
        objects: objects,
        users: users ? JSON.parse(users) : []
      };
      
      const payloadSize = new Blob([JSON.stringify(payload)]).size;
      const sizeMB = (payloadSize / (1024 * 1024)).toFixed(2);
      
      setSyncStatus(`Отправка данных (${sizeMB} МБ)...`);
      
      const response = await fetch('https://functions.poehali.dev/b79c8b0e-36c3-4ab2-bb2b-123cec40662a', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        setSyncStatus(`✓ Синхронизировано ${result.data.objects.length} объектов, загружено ${result.uploaded_photos} фото`);
        setLastSync(new Date().toLocaleString('ru-RU'));
        localStorage.setItem('mchs_objects', JSON.stringify(result.data.objects));
        localStorage.setItem('mchs_last_sync', new Date().toISOString());
        
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setSyncStatus(`✗ Ошибка: ${result.error || 'Неизвестная ошибка'}`);
      }
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      setSyncStatus(`✗ Ошибка: ${errorMsg}`);
      console.error('Sync error details:', {
        error,
        errorMessage: errorMsg,
        objectsCount: objects.length,
        payloadSizeMB: (new Blob([JSON.stringify({ action: 'sync', objects, users: JSON.parse(localStorage.getItem('mchs_users') || '[]') })]).size / (1024 * 1024)).toFixed(2)
      });
      alert(`Ошибка синхронизации: ${errorMsg}\n\nПроверьте консоль браузера (F12) для деталей.`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownload = async () => {
    setIsSyncing(true);
    setSyncStatus('Загрузка данных с сервера...');
    
    try {
      const response = await fetch('https://functions.poehali.dev/b79c8b0e-36c3-4ab2-bb2b-123cec40662a', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setSyncStatus(`✓ Загружено ${result.data.objects.length} объектов с сервера`);
        localStorage.setItem('mchs_objects', JSON.stringify(result.data.objects));
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setSyncStatus('✗ Ошибка загрузки');
      }
    } catch (error) {
      setSyncStatus('✗ Ошибка подключения к серверу');
      console.error('Download error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const totalPhotos = getAllPhotos().length;
  const savedSync = localStorage.getItem('mchs_last_sync');
  const displayLastSync = lastSync || (savedSync ? new Date(savedSync).toLocaleString('ru-RU') : 'Никогда');

  return (
    <div className="space-y-4">
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
              <Icon name="CloudUpload" size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Синхронизация с сервером</h2>
              <p className="text-slate-400">
                Выгрузите фотографии на сервер для надежного хранения. Офлайн данные останутся на устройстве, 
                но будут продублированы на сервере.
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
              <span className="text-slate-300">Фотографий в системе</span>
              <span className="text-white font-medium">{totalPhotos}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
              <span className="text-slate-300">Последняя синхронизация</span>
              <span className="text-white font-medium">{displayLastSync}</span>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="grid md:grid-cols-2 gap-3">
              <Button 
                onClick={handleSync}
                disabled={isSyncing || objects.length === 0}
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 h-12"
              >
                <Icon name="CloudUpload" size={18} className="mr-2" />
                Загрузить на сервер
              </Button>

              <Button 
                onClick={handleDownload}
                disabled={isSyncing}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800 h-12"
              >
                <Icon name="CloudDownload" size={18} className="mr-2" />
                Скачать с сервера
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-3">
              <Button 
                onClick={downloadBackup}
                disabled={objects.length === 0}
                variant="outline"
                className="border-green-600 text-green-300 hover:bg-green-900/20 h-12"
              >
                <Icon name="Download" size={18} className="mr-2" />
                Резервная копия
              </Button>
              
              <Button 
                onClick={checkServerStatus}
                disabled={serverStatus === 'checking'}
                variant="outline"
                className="border-blue-600 text-blue-300 hover:bg-blue-900/20 h-12"
              >
                <Icon name={serverStatus === 'checking' ? 'Loader2' : 'Wifi'} size={18} className={`mr-2 ${serverStatus === 'checking' ? 'animate-spin' : ''}`} />
                {serverStatus === 'checking' ? 'Проверка...' : serverStatus === 'online' ? 'Сервер доступен' : serverStatus === 'offline' ? 'Сервер недоступен' : 'Проверить сервер'}
              </Button>
            </div>
          </div>

          {syncStatus && (
            <div className={`p-4 rounded-lg ${
              syncStatus.startsWith('✓') 
                ? 'bg-green-500/10 border border-green-500/30' 
                : syncStatus.startsWith('✗')
                ? 'bg-red-500/10 border border-red-500/30'
                : 'bg-blue-500/10 border border-blue-500/30'
            }`}>
              <p className={`text-sm ${
                syncStatus.startsWith('✓') 
                  ? 'text-green-300' 
                  : syncStatus.startsWith('✗')
                  ? 'text-red-300'
                  : 'text-blue-300'
              }`}>
                {syncStatus}
              </p>
            </div>
          )}

          <div className="mt-6 flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <Icon name="Info" size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-blue-200 font-medium mb-2">Как работает синхронизация</p>
              <ul className="text-blue-300/80 space-y-2 list-disc list-inside">
                <li>Все данные хранятся на сервере <code className="bg-slate-900/50 px-1 rounded">profire23.store</code></li>
                <li>Папка с файлами: <code className="bg-slate-900/50 px-1 rounded">profire_data/</code></li>
                <li>База данных: <code className="bg-slate-900/50 px-1 rounded">database.json</code></li>
                <li>Фотографии: <code className="bg-slate-900/50 px-1 rounded">photos/*.jpg</code></li>
                <li className="font-medium pt-1">При синхронизации объединяются визиты от разных техников по времени создания</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}