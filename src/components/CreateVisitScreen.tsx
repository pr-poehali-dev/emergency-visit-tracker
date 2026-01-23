import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';
import type { SiteObject, Visit } from '@/pages/Index';

interface CreateVisitScreenProps {
  object: SiteObject;
  userName: string;
  onBack: () => void;
  onSave: (visit: Omit<Visit, 'id' | 'createdAt'>) => void;
}

export default function CreateVisitScreen({ 
  object, 
  userName,
  onBack, 
  onSave 
}: CreateVisitScreenProps) {
  const [visitType, setVisitType] = useState<'planned' | 'unplanned' | null>(null);
  const [comment, setComment] = useState('');
  const [unplannedReason, setUnplannedReason] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const maxSize = file.type.startsWith('video/') ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
        
        if (file.size > maxSize) {
          const limitMB = file.type.startsWith('video/') ? 100 : 10;
          alert(`Файл слишком большой. Максимум ${limitMB}МБ для ${file.type.startsWith('video/') ? 'видео' : 'фото'}`);
          continue;
        }
        
        const reader = new FileReader();
        
        await new Promise<void>((resolve, reject) => {
          reader.onload = async (e) => {
            try {
              const base64 = e.target?.result as string;
              setPhotos(prev => [...prev, base64]);
              resolve();
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      if (event.target) event.target.value = '';
    }
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoRemove = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!visitType) {
      alert('Выберите тип посещения');
      return;
    }

    if (visitType === 'unplanned' && !unplannedReason.trim()) {
      alert('Укажите причину внепланового посещения');
      return;
    }

    if (photos.length === 0) {
      alert('Добавьте хотя бы одно фото или видео');
      return;
    }

    if (!comment.trim()) {
      alert('Добавьте комментарий');
      return;
    }

    try {
      const finalComment = visitType === 'unplanned' 
        ? `Причина: ${unplannedReason.trim()}\n\n${comment.trim()}`
        : comment.trim();

      onSave({
        date: new Date().toISOString().split('T')[0],
        type: visitType,
        comment: finalComment,
        photos,
        createdBy: userName
      });
    } catch (error) {
      console.error('Save visit error:', error);
      alert('Ошибка сохранения посещения');
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 relative">
      {object.objectPhoto && (
        <div 
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: `url(${object.objectPhoto})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-purple-900/90 to-slate-900/95 backdrop-blur-sm" />
        </div>
      )}
      <div className="relative z-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="text-slate-300 hover:text-white hover:bg-slate-800 mb-4"
          >
            <Icon name="ArrowLeft" size={18} className="mr-2" />
            Назад
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Новое посещение</h1>
            <div className="space-y-1">
              <p className="text-lg text-white font-semibold">{object.name}</p>
              <p className="text-slate-400 text-sm flex items-center gap-1">
                <Icon name="MapPin" size={14} />
                {object.address}
              </p>
              {object.contactName && (
                <p className="text-slate-400 text-sm flex items-center gap-1">
                  <Icon name="User" size={14} />
                  {object.contactName}
                  {object.contactPhone && ` • ${object.contactPhone}`}
                </p>
              )}
            </div>
          </div>
        </div>

        {object.description && (
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon name="FileText" size={20} className="text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-1">Описание объекта</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">{object.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {!visitType ? (
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Выберите тип посещения</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setVisitType('planned')}
                    className="group relative p-6 rounded-xl border-2 border-slate-700 hover:border-primary bg-slate-900/50 hover:bg-slate-900 transition-all text-left overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Icon name="Calendar" size={24} className="text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">Плановое</h3>
                      <p className="text-sm text-slate-400">Регулярное техническое обслуживание по графику</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setVisitType('unplanned')}
                    className="group relative p-6 rounded-xl border-2 border-slate-700 hover:border-accent bg-slate-900/50 hover:bg-slate-900 transition-all text-left overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Icon name="AlertCircle" size={24} className="text-accent" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">Внеплановое</h3>
                      <p className="text-sm text-slate-400">Срочный выезд по заявке или инциденту</p>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">Детали посещения</h2>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setVisitType(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      <Icon name="Edit" size={16} className="mr-2" />
                      Изменить тип
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-slate-200 mb-2 block">Тип посещения</Label>
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                        visitType === 'planned' 
                          ? 'bg-primary/20 text-primary border border-primary/30' 
                          : 'bg-accent/20 text-accent border border-accent/30'
                      }`}>
                        <Icon 
                          name={visitType === 'planned' ? 'Calendar' : 'AlertCircle'} 
                          size={16} 
                        />
                        <span className="font-medium">
                          {visitType === 'planned' ? 'Плановое' : 'Внеплановое'}
                        </span>
                      </div>
                    </div>

                    {visitType === 'unplanned' && (
                      <div>
                        <Label htmlFor="unplanned-reason" className="text-slate-200 mb-2 block">
                          Причина внепланового посещения *
                        </Label>
                        <Textarea
                          id="unplanned-reason"
                          placeholder="Заявка клиента, сработка сигнализации, авария..."
                          value={unplannedReason}
                          onChange={(e) => setUnplannedReason(e.target.value)}
                          className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 min-h-[80px]"
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="comment" className="text-slate-200 mb-2 block">
                        Комментарий
                      </Label>
                      <Textarea
                        id="comment"
                        placeholder="Опишите выполненные работы, состояние оборудования..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 min-h-[120px]"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-white">Фото и видео</h2>
                      <p className="text-sm text-slate-400 mt-1">Добавьте фото/видео с объекта (видео до 100МБ)</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleCameraClick}
                        disabled={isUploading}
                        className="bg-secondary hover:bg-secondary/90"
                      >
                        <Icon name="Camera" size={18} className="mr-2" />
                        Камера
                      </Button>
                      <Button 
                        onClick={handleGalleryClick}
                        disabled={isUploading}
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-800"
                      >
                        <Icon name="Image" size={18} className="mr-2" />
                        Галерея
                      </Button>
                    </div>
                  </div>

                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*,video/*"
                    capture="environment"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  {isUploading && (
                    <div className="mb-4 p-4 rounded-lg bg-primary/10 border border-primary/30">
                      <div className="flex items-center gap-3">
                        <div className="animate-spin">
                          <Icon name="Loader2" size={20} className="text-primary" />
                        </div>
                        <span className="text-primary font-medium">Загрузка фото...</span>
                      </div>
                    </div>
                  )}

                  {photos.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center">
                      <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                        <Icon name="Image" size={32} className="text-slate-500" />
                      </div>
                      <p className="text-slate-400 mb-2">Нет фотографий</p>
                      <p className="text-sm text-slate-500">Добавьте фото с камеры или галереи</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {photos.map((photo, index) => (
                        <div key={index} className="relative aspect-video rounded-lg overflow-hidden group">
                          {photo.startsWith('data:video') ? (
                            <video 
                              src={photo} 
                              className="w-full h-full object-cover"
                              controls
                            />
                          ) : (
                            <img 
                              src={photo} 
                              alt={`Фото ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <button
                            onClick={() => handlePhotoRemove(index)}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            <Icon name="X" size={16} className="text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex items-center gap-4">
                <Button 
                  onClick={handleSave}
                  className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity h-12 text-base"
                >
                  <Icon name="Save" size={18} className="mr-2" />
                  Сохранить посещение
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onBack}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800 h-12"
                >
                  Отмена
                </Button>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-800/30 border border-slate-700">
                <Icon name="Lock" size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-slate-300 font-medium mb-1">Защита данных</p>
                  <p className="text-slate-400">После сохранения посещение может редактировать только директор. Все изменения логируются.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}