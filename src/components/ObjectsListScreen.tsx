import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import type { SiteObject } from '@/pages/Index';

interface ObjectsListScreenProps {
  objects: SiteObject[];
  userRole: 'technician' | 'director' | null;
  userName: string;
  onSelectObject: (obj: SiteObject) => void;
  onOpenDirectorPanel: () => void;
}

export default function ObjectsListScreen({ 
  objects, 
  userRole, 
  userName,
  onSelectObject,
  onOpenDirectorPanel 
}: ObjectsListScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');

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
        setTimeout(() => setSyncStatus(''), 2000);
        return;
      }

      setSyncStatus(`Загрузка ${photos.length} фото на сервер...`);
      
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
        setSyncStatus(`✓ Загружено ${photos.length} фото`);
        localStorage.setItem('mchs_last_sync', new Date().toISOString());
        setTimeout(() => setSyncStatus(''), 3000);
      } else {
        setSyncStatus('✗ Ошибка синхронизации');
        setTimeout(() => setSyncStatus(''), 3000);
      }
    } catch (error) {
      setSyncStatus('✗ Ошибка подключения');
      console.error('Sync error:', error);
      setTimeout(() => setSyncStatus(''), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredObjects = objects.filter(obj => 
    obj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    obj.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Объекты</h1>
            <p className="text-slate-400">
              Привет, {userName} • {userRole === 'director' ? 'Директор' : 'Техник'}
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={handleSync}
              disabled={isSyncing}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <Icon name="CloudUpload" size={18} className="mr-2" />
              {isSyncing ? 'Загрузка...' : 'Синхронизация'}
            </Button>
            
            {userRole === 'director' && (
              <Button 
                onClick={onOpenDirectorPanel}
                className="bg-secondary hover:bg-secondary/90"
              >
                <Icon name="Settings" size={18} className="mr-2" />
                Панель управления
              </Button>
            )}
          </div>
        </div>

        {syncStatus && (
          <div className={`mb-4 p-3 rounded-lg ${
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

        <div className="mb-6">
          <div className="relative">
            <Icon 
              name="Search" 
              size={20} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" 
            />
            <Input
              type="text"
              placeholder="Поиск по названию или адресу..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 h-12"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredObjects.map((obj) => (
            <Card 
              key={obj.id}
              className="border-slate-700 bg-slate-800/50 backdrop-blur-sm hover:bg-slate-800/70 transition-all cursor-pointer hover-scale group"
              onClick={() => onSelectObject(obj)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                      <Icon name="Building2" size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">
                        {obj.name}
                      </h3>
                      <p className="text-sm text-slate-400 flex items-center gap-1">
                        <Icon name="MapPin" size={14} />
                        {obj.address}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                  <div className="flex items-center gap-2">
                    <Icon name="Calendar" size={16} className="text-slate-400" />
                    <span className="text-sm text-slate-300">
                      {obj.visits.length > 0 
                        ? `${obj.visits.length} посещений` 
                        : 'Нет посещений'
                      }
                    </span>
                  </div>
                  
                  {obj.visits.length > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="bg-primary/20 text-primary border-primary/30"
                    >
                      Активный
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredObjects.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Icon name="Search" size={32} className="text-slate-500" />
            </div>
            <p className="text-slate-400 text-lg">Объекты не найдены</p>
            <p className="text-slate-500 text-sm">Попробуйте изменить параметры поиска</p>
          </div>
        )}
      </div>
    </div>
  );
}