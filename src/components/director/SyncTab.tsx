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

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('Подготовка данных...');
    
    try {
      const photos = getAllPhotos();
      
      if (photos.length === 0) {
        setSyncStatus('Нет фотографий для синхронизации');
        setIsSyncing(false);
        return;
      }

      setSyncStatus(`Загрузка ${photos.length} фотографий на сервер...`);
      
      const response = await fetch('https://functions.poehali.dev/1dfc483e-0291-4d5e-8cf8-b29716b7da40', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'upload',
          photos: photos
        })
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setSyncStatus(`✓ Успешно загружено ${photos.length} фотографий`);
        setLastSync(new Date().toLocaleString('ru-RU'));
        
        localStorage.setItem('mchs_last_sync', new Date().toISOString());
      } else {
        setSyncStatus('✗ Ошибка синхронизации');
      }
    } catch (error) {
      setSyncStatus('✗ Ошибка подключения к серверу');
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownload = async () => {
    setIsSyncing(true);
    setSyncStatus('Загрузка данных с сервера...');
    
    try {
      const response = await fetch('https://functions.poehali.dev/1dfc483e-0291-4d5e-8cf8-b29716b7da40', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'download'
        })
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setSyncStatus(`✓ Загружено ${result.photos.length} фотографий с сервера`);
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

          <div className="grid md:grid-cols-2 gap-3 mb-4">
            <Button 
              onClick={handleSync}
              disabled={isSyncing || totalPhotos === 0}
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

          <div className="mt-6 flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <Icon name="Info" size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-amber-200 font-medium mb-1">Где хранятся фотографии</p>
              <ul className="text-amber-300/80 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="font-medium">Локально:</span>
                  <span>В памяти браузера (localStorage) каждого устройства</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-medium">На сервере:</span>
                  <span>S3 хранилище в папке <code className="bg-slate-900/50 px-1 rounded">mchs_photos/</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-medium">Доступ:</span>
                  <span className="break-all">https://cdn.poehali.dev/projects/[ключ]/bucket/mchs_photos/</span>
                </li>
                <li className="text-amber-200 font-medium pt-1">💡 После публикации на Beget фото будут доступны по вашему домену</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}