import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import type { SiteObject } from '@/pages/Index';

interface ObjectHistoryScreenProps {
  object: SiteObject;
  userRole: 'technician' | 'director' | 'supervisor' | null;
  userName: string;
  onBack: () => void;
  onCreateVisit: () => void;
  onCreateTask: () => void;
  onUpdateObject: (updatedObject: SiteObject) => void;
}

export default function ObjectHistoryScreen({ 
  object, 
  userRole,
  userName,
  onBack, 
  onCreateVisit,
  onCreateTask,
  onUpdateObject
}: ObjectHistoryScreenProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [editingVisit, setEditingVisit] = useState<string | null>(null);
  const [taskComment, setTaskComment] = useState('');
  const [taskPhotos, setTaskPhotos] = useState<string[]>([]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleCompleteTask = (visitId: string) => {
    if (!taskComment.trim()) {
      alert('Добавьте комментарий к выполненной задаче');
      return;
    }
    if (taskPhotos.length === 0) {
      alert('Добавьте хотя бы одно фото подтверждения');
      return;
    }

    const updatedVisits = object.visits.map(v => 
      v.id === visitId 
        ? { 
            ...v, 
            comment: taskComment,
            photos: taskPhotos,
            taskCompleted: true,
            taskCompletedBy: userName,
            taskCompletedAt: new Date().toISOString()
          } 
        : v
    );

    onUpdateObject({ ...object, visits: updatedVisits });
    setEditingVisit(null);
    setTaskComment('');
    setTaskPhotos([]);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Файл слишком большой. Максимум 10 МБ.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setTaskPhotos([...taskPhotos, base64]);
      e.target.value = '';
    };
    reader.onerror = () => {
      alert('Ошибка загрузки фото');
      e.target.value = '';
    };
    reader.readAsDataURL(file);
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="text-slate-300 hover:text-white hover:bg-slate-800 mb-4"
          >
            <Icon name="ArrowLeft" size={18} className="mr-2" />
            Назад к объектам
          </Button>
          
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{object.name}</h1>
              <div className="space-y-1">
                <p className="text-slate-400 flex items-center gap-2">
                  <Icon name="MapPin" size={16} />
                  {object.address}
                </p>
                {object.contactName && (
                  <p className="text-slate-400 flex items-center gap-2">
                    <Icon name="User" size={16} />
                    {object.contactName}
                    {object.contactPhone && ` • ${object.contactPhone}`}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={onCreateVisit}
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
              >
                <Icon name="Plus" size={18} className="mr-2" />
                Добавить посещение
              </Button>
              
              {userRole === 'director' && (
                <Button 
                  variant="outline"
                  onClick={onCreateTask}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  <Icon name="ClipboardList" size={18} className="mr-2" />
                  Создать задачу
                </Button>
              )}
            </div>
          </div>

          {object.description && (
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm mt-4">
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
        </div>

        {object.visits.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Icon name="FileText" size={40} className="text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Нет посещений</h3>
            <p className="text-slate-400 mb-6">Начните создание актов для этого объекта</p>
            <Button 
              onClick={onCreateVisit}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              <Icon name="Plus" size={18} className="mr-2" />
              Создать первое посещение
            </Button>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-accent"></div>
            
            <div className="space-y-6">
              {object.visits.map((visit, index) => (
                <Card 
                  key={visit.id}
                  className="border-slate-700 bg-slate-800/50 backdrop-blur-sm ml-20 animate-fade-in relative"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`absolute -left-[52px] top-8 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                    visit.type === 'task' 
                      ? (visit.taskCompleted ? 'bg-green-600 shadow-green-500/30' : 'bg-red-600 shadow-red-500/30')
                      : 'bg-gradient-to-br from-primary to-secondary shadow-primary/30'
                  }`}>
                    <Icon 
                      name={visit.type === 'planned' ? 'Calendar' : visit.type === 'task' ? 'ClipboardList' : 'AlertCircle'} 
                      size={16} 
                      className="text-white" 
                    />
                  </div>

                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            variant="secondary"
                            className={
                              visit.type === 'planned' 
                                ? 'bg-primary/20 text-primary border-primary/30' 
                                : visit.type === 'task'
                                ? (visit.taskCompleted ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30')
                                : 'bg-accent/20 text-accent border-accent/30'
                            }
                          >
                            {visit.type === 'planned' ? 'Плановое' : visit.type === 'task' ? (visit.taskCompleted ? 'Задача выполнена' : 'Задача') : 'Внеплановое'}
                          </Badge>
                          <span className="text-sm text-slate-400">
                            {formatDate(visit.createdAt)}
                          </span>
                        </div>
                        {visit.type === 'task' && visit.taskDescription && (
                          <div className="mb-2 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                            <p className="text-sm text-slate-400 mb-1">Задача от директора:</p>
                            <p className="text-slate-300">{visit.taskDescription}</p>
                          </div>
                        )}
                        {visit.comment && <p className="text-slate-300 mb-2">{visit.comment}</p>}
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <Icon name="User" size={14} />
                          {visit.createdBy}
                        </p>
                      </div>

                      {userRole === 'director' ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingVisit(visit.id)}
                            className="text-slate-400 hover:text-white"
                          >
                            <Icon name="Edit" size={16} className="mr-1" />
                            Редактировать
                          </Button>
                        </div>
                      ) : visit.type === 'task' && !visit.taskCompleted ? (
                        <Button
                          size="sm"
                          onClick={() => setEditingVisit(visit.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Icon name="CheckCircle" size={16} className="mr-1" />
                          Выполнить задачу
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Icon name="Lock" size={16} className="text-slate-500" />
                          <span className="text-xs text-slate-500">Защищено</span>
                        </div>
                      )}
                    </div>

                    {visit.photos.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {visit.photos.map((photo, photoIndex) => (
                          <div 
                            key={photoIndex}
                            className="relative aspect-video rounded-lg overflow-hidden group"
                          >
                            {photo.startsWith('data:video') || photo.includes('.mp4') || photo.includes('.webm') ? (
                              <video 
                                src={photo} 
                                className="w-full h-full object-cover cursor-pointer"
                                controls
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <>
                                <img 
                                  src={photo} 
                                  alt={`Фото ${photoIndex + 1}`}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-110 cursor-pointer"
                                  onClick={() => setSelectedPhoto(photo)}
                                />
                                <div 
                                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                  onClick={() => setSelectedPhoto(photo)}
                                >
                                  <Icon name="ZoomIn" size={24} className="text-white" />
                                </div>
                              </>
                            )}
                            {editingVisit === visit.id && userRole === 'director' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updatedPhotos = visit.photos.filter((_, i) => i !== photoIndex);
                                  const updatedVisits = object.visits.map(v => 
                                    v.id === visit.id ? { ...v, photos: updatedPhotos } : v
                                  );
                                  onUpdateObject({ ...object, visits: updatedVisits });
                                }}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors z-10"
                              >
                                <Icon name="Trash2" size={16} className="text-white" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {editingVisit === visit.id && visit.type === 'task' && !visit.taskCompleted && userRole !== 'director' && (
                      <div className="mt-4 space-y-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                        <h4 className="text-white font-medium flex items-center gap-2">
                          <Icon name="ClipboardCheck" size={18} className="text-green-400" />
                          Выполнение задачи
                        </h4>
                        
                        <div>
                          <label className="text-slate-200 text-sm mb-2 block">Комментарий к выполнению *</label>
                          <textarea
                            placeholder="Опишите что было сделано..."
                            value={taskComment}
                            onChange={(e) => setTaskComment(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-md px-3 py-2 min-h-[80px] resize-y"
                          />
                        </div>

                        <div>
                          <label className="text-slate-200 text-sm mb-2 block">Фото отчёта *</label>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/heic,image/heif"
                            capture="environment"
                            onChange={handlePhotoUpload}
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-md file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-green-600 file:text-white file:cursor-pointer hover:file:bg-green-700"
                          />
                          <p className="text-xs text-slate-500 mt-1">Максимум 10 МБ на фото</p>
                          {taskPhotos.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-3">
                              {taskPhotos.map((photo, idx) => (
                                <div key={idx} className="relative aspect-video rounded overflow-hidden">
                                  <img src={photo} alt={`Фото ${idx + 1}`} className="w-full h-full object-cover" />
                                  <button
                                    onClick={() => setTaskPhotos(taskPhotos.filter((_, i) => i !== idx))}
                                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center"
                                  >
                                    <Icon name="X" size={14} className="text-white" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleCompleteTask(visit.id)}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <Icon name="Check" size={16} className="mr-2" />
                            Завершить задачу
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingVisit(null);
                              setTaskComment('');
                              setTaskPhotos([]);
                            }}
                            className="border-slate-600 text-slate-300"
                          >
                            Отмена
                          </Button>
                        </div>
                      </div>
                    )}

                    {editingVisit === visit.id && userRole === 'director' && (
                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm('Удалить это посещение? Это действие нельзя отменить.')) {
                              const updatedVisits = object.visits.filter(v => v.id !== visit.id);
                              onUpdateObject({ ...object, visits: updatedVisits });
                              setEditingVisit(null);
                            }
                          }}
                        >
                          <Icon name="Trash2" size={16} className="mr-2" />
                          Удалить посещение
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingVisit(null)}
                        >
                          Отмена
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>

      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <Icon name="X" size={24} className="text-white" />
          </button>
          <img 
            src={selectedPhoto} 
            alt="Фото в полном размере" 
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}