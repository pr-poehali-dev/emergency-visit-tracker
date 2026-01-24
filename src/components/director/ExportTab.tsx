import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import type { SiteObject } from '@/pages/Index';
import JSZip from 'jszip';

interface ExportTabProps {
  objects: SiteObject[];
}

export default function ExportTab({ objects }: ExportTabProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string>('');

  const activeObjects = objects.filter(obj => !obj.deleted);
  
  const totalVisits = activeObjects.reduce((sum, obj) => sum + obj.visits.length, 0);
  const totalPhotos = activeObjects.reduce((sum, obj) => 
    sum + obj.visits.reduce((s, v) => s + v.photos.length, 0), 0
  );

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus('Подготовка данных...');

    try {
      const zip = new JSZip();

      for (const obj of activeObjects) {
        const objectFolder = zip.folder(obj.name);
        if (!objectFolder) continue;

        for (const visit of obj.visits) {
          const visitDate = new Date(visit.date).toLocaleDateString('ru-RU').replace(/\./g, '-');
          const visitFolder = objectFolder.folder(visitDate);
          if (!visitFolder) continue;

          for (let i = 0; i < visit.photos.length; i++) {
            const photo = visit.photos[i];
            
            if (photo.startsWith('data:image')) {
              const base64Data = photo.split(',')[1];
              visitFolder.file(`фото_${i + 1}.jpg`, base64Data, { base64: true });
            } else if (photo.startsWith('http')) {
              try {
                const response = await fetch(photo);
                const blob = await response.blob();
                visitFolder.file(`фото_${i + 1}.jpg`, blob);
              } catch (err) {
                console.error('Ошибка загрузки фото:', err);
              }
            }
          }

          const actText = `
АКТ ПОСЕЩЕНИЯ ОБЪЕКТА

Объект: ${obj.name}
Адрес: ${obj.address}
Дата посещения: ${new Date(visit.date).toLocaleDateString('ru-RU')}
Тип: ${visit.type === 'planned' ? 'Плановое' : 'Внеплановое'}

Комментарий:
${visit.comment}

Техник: ${visit.createdBy}
Дата создания акта: ${new Date(visit.createdAt).toLocaleString('ru-RU')}
Количество фотографий: ${visit.photos.length}
`;
          visitFolder.file('акт.txt', actText);
        }
      }

      setExportStatus('Создание архива...');
      const content = await zip.generateAsync({ type: 'blob' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `Акты_посещений_${new Date().toLocaleDateString('ru-RU').replace(/\./g, '-')}.zip`;
      link.click();

      setExportStatus('✓ Архив успешно создан и загружен');
      setTimeout(() => setExportStatus(''), 3000);
    } catch (error) {
      setExportStatus('✗ Ошибка создания архива');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
              <Icon name="FileDown" size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Выгрузка данных</h2>
              <p className="text-slate-400">
                Скачайте архив со всеми актами посещений и фотографиями. 
                Структура: Название объекта → Дата посещения → Фотографии и акт.
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
              <span className="text-slate-300">Объектов</span>
              <span className="text-white font-medium">{objects.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
              <span className="text-slate-300">Актов посещений</span>
              <span className="text-white font-medium">{totalVisits}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
              <span className="text-slate-300">Фотографий</span>
              <span className="text-white font-medium">{totalPhotos}</span>
            </div>
          </div>

          <Button 
            onClick={handleExport}
            disabled={isExporting || objects.length === 0}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 h-12"
          >
            <Icon name="FileDown" size={18} className="mr-2" />
            {isExporting ? 'Создание архива...' : 'Скачать архив ZIP'}
          </Button>

          {exportStatus && (
            <div className={`mt-4 p-4 rounded-lg ${
              exportStatus.startsWith('✓') 
                ? 'bg-green-500/10 border border-green-500/30' 
                : exportStatus.startsWith('✗')
                ? 'bg-red-500/10 border border-red-500/30'
                : 'bg-blue-500/10 border border-blue-500/30'
            }`}>
              <p className={`text-sm ${
                exportStatus.startsWith('✓') 
                  ? 'text-green-300' 
                  : exportStatus.startsWith('✗')
                  ? 'text-red-300'
                  : 'text-blue-300'
              }`}>
                {exportStatus}
              </p>
            </div>
          )}

          <div className="mt-4 flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <Icon name="Info" size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-blue-200 font-medium mb-1">Структура архива</p>
              <p className="text-blue-300/80 mb-2">
                Архив содержит папки с названиями объектов, внутри — папки с датами посещений, 
                в каждой — фотографии и текстовый файл акта.
              </p>
              <code className="text-xs bg-slate-900/50 px-2 py-1 rounded text-blue-200 block">
                ТЦ "Галерея" → 20-01-2026 → фото_1.jpg, фото_2.jpg, акт.txt
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}