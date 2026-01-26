import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import type { Visit } from '@/pages/Index';

interface VisitCardProps {
  visit: Visit;
  index: number;
  userRole: 'technician' | 'director' | 'supervisor' | null;
  editingVisit: string | null;
  taskComment: string;
  taskPhotos: string[];
  isCompleting: boolean;
  formatDate: (date: string) => string;
  onPhotoClick: (photo: string) => void;
  onEditClick: (visitId: string | null) => void;
  onDeletePhoto: (visitId: string, photoIndex: number) => void;
  onDeleteVisit: (visitId: string) => void;
  onTaskCommentChange: (comment: string) => void;
  onTaskPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTaskPhotoRemove: (index: number) => void;
  onCompleteTask: (visitId: string) => void;
  onCancelEdit: () => void;
}

export default function VisitCard({
  visit,
  index,
  userRole,
  editingVisit,
  taskComment,
  taskPhotos,
  isCompleting,
  formatDate,
  onPhotoClick,
  onEditClick,
  onDeletePhoto,
  onDeleteVisit,
  onTaskCommentChange,
  onTaskPhotoUpload,
  onTaskPhotoRemove,
  onCompleteTask,
  onCancelEdit
}: VisitCardProps) {
  return (
    <Card 
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
                <p className={`text-sm mb-1 ${
                  visit.createdByRole === 'director' 
                    ? 'text-blue-400' 
                    : visit.createdByRole === 'supervisor' 
                    ? 'text-amber-400' 
                    : 'text-slate-400'
                }`}>
                  Задача от {visit.createdByRole === 'director' ? 'директора' : visit.createdByRole === 'supervisor' ? `руководителя (${visit.createdBy})` : visit.createdBy}
                  {visit.taskRecipient && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-600">
                      для {visit.taskRecipient === 'director' ? 'директора' : 'техников'}
                    </span>
                  )}:
                </p>
                <p className="text-slate-300">{visit.taskDescription}</p>
              </div>
            )}
            {visit.comment && <p className="text-slate-300 mb-2">{visit.comment}</p>}
            <p className="text-sm text-slate-500 flex items-center gap-1">
              <Icon name="User" size={14} />
              {visit.createdBy}
            </p>
          </div>

          {visit.type === 'task' && !visit.taskCompleted ? (
            (() => {
              // Логируем для отладки
              console.log('🔍 Задача:', {
                id: visit.id,
                taskRecipient: visit.taskRecipient,
                createdByRole: visit.createdByRole,
                userRole,
                taskDescription: visit.taskDescription?.substring(0, 50)
              });
              
              // Определяем кто может закрыть задачу
              const canComplete = visit.taskRecipient === 'director' 
                ? userRole === 'director'
                : visit.taskRecipient === 'technician'
                ? (userRole === 'technician' || userRole === 'supervisor')
                : !visit.taskRecipient
                ? (userRole === 'technician' || userRole === 'supervisor')
                : false;
              
              if (canComplete) {
                return (
                  <Button
                    size="sm"
                    onClick={() => onEditClick(visit.id)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Icon name="CheckCircle" size={16} className="mr-1" />
                    Выполнить задачу
                  </Button>
                );
              }
              
              return (
                <div className="flex items-center gap-2">
                  <Icon name="Lock" size={16} className="text-amber-500" />
                  <span className="text-xs text-amber-400">
                    {visit.taskRecipient === 'director' ? 'Только для директора' : 'Только для техников'}
                  </span>
                </div>
              );
            })()
          ) : visit.type === 'task' && visit.taskCompleted ? (
            <div className="flex items-center gap-2">
              <Icon name="CheckCircle" size={16} className="text-green-500" />
              <span className="text-xs text-green-400">Выполнена</span>
            </div>
          ) : userRole === 'director' ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditClick(editingVisit === visit.id ? null : visit.id)}
                className="text-slate-400 hover:text-white"
              >
                <Icon name="Edit" size={16} className="mr-1" />
                Редактировать
              </Button>
            </div>
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
                      onClick={() => onPhotoClick(photo)}
                    />
                    <div 
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                      onClick={() => onPhotoClick(photo)}
                    >
                      <Icon name="ZoomIn" size={24} className="text-white" />
                    </div>
                  </>
                )}
                {userRole === 'director' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePhoto(visit.id, photoIndex);
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

        {editingVisit === visit.id && visit.type === 'task' && !visit.taskCompleted && (
          (visit.taskRecipient === 'director' && userRole === 'director') || 
          (visit.taskRecipient === 'technician' && (userRole === 'technician' || userRole === 'supervisor')) || 
          (!visit.taskRecipient && (userRole === 'technician' || userRole === 'supervisor'))
        ) && (
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
                onChange={(e) => onTaskCommentChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-md px-3 py-2 min-h-[80px] resize-y"
              />
            </div>

            <div>
              <label className="text-slate-200 text-sm mb-2 block">Фото отчёта *</label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/heic,image/heif"
                capture="environment"
                onChange={onTaskPhotoUpload}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-md file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-green-600 file:text-white file:cursor-pointer hover:file:bg-green-700"
              />
              <p className="text-xs text-slate-500 mt-1">Фото будет сжато до 1280px для надёжной синхронизации</p>
              {taskPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {taskPhotos.map((photo, idx) => (
                    <div key={idx} className="relative aspect-video rounded overflow-hidden">
                      <img src={photo} alt={`Фото ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => onTaskPhotoRemove(idx)}
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
                onClick={() => onCompleteTask(visit.id)}
                disabled={isCompleting}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {isCompleting ? (
                  <>
                    <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Icon name="Check" size={16} className="mr-2" />
                    Завершить задачу
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={onCancelEdit}
                disabled={isCompleting}
                className="border-slate-600 text-slate-300 disabled:opacity-50"
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
                  onDeleteVisit(visit.id);
                }
              }}
            >
              <Icon name="Trash2" size={16} className="mr-2" />
              Удалить посещение
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelEdit}
            >
              Отмена
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}