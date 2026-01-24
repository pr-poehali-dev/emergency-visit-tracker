import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import TaskCompletionForm from './TaskCompletionForm';
import type { Visit, SiteObject } from '@/pages/Index';

interface VisitCardProps {
  visit: Visit;
  index: number;
  userRole: 'technician' | 'director' | 'supervisor' | null;
  editingVisit: string | null;
  taskComment: string;
  taskPhotos: string[];
  isCompleting: boolean;
  object: SiteObject;
  onPhotoClick: (photo: string) => void;
  onEditClick: (visitId: string) => void;
  onDeletePhoto: (visitId: string, photoIndex: number) => void;
  onDeleteVisit: (visitId: string) => void;
  onCancelEdit: () => void;
  onTaskCommentChange: (comment: string) => void;
  onTaskPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTaskPhotoRemove: (index: number) => void;
  onCompleteTask: (visitId: string) => void;
  formatDate: (dateString: string) => string;
}

export default function VisitCard({
  visit,
  index,
  userRole,
  editingVisit,
  taskComment,
  taskPhotos,
  isCompleting,
  object,
  onPhotoClick,
  onEditClick,
  onDeletePhoto,
  onDeleteVisit,
  onCancelEdit,
  onTaskCommentChange,
  onTaskPhotoUpload,
  onTaskPhotoRemove,
  onCompleteTask,
  formatDate
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
                onClick={() => onEditClick(visit.id)}
                className="text-slate-400 hover:text-white"
              >
                <Icon name="Edit" size={16} className="mr-1" />
                Редактировать
              </Button>
            </div>
          ) : visit.type === 'task' && !visit.taskCompleted ? (
            <Button
              size="sm"
              onClick={() => onEditClick(visit.id)}
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
                {editingVisit === visit.id && userRole === 'director' && (
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

        {editingVisit === visit.id && visit.type === 'task' && !visit.taskCompleted && userRole !== 'director' && (
          <TaskCompletionForm
            taskComment={taskComment}
            taskPhotos={taskPhotos}
            isCompleting={isCompleting}
            onCommentChange={onTaskCommentChange}
            onPhotoUpload={onTaskPhotoUpload}
            onPhotoRemove={onTaskPhotoRemove}
            onComplete={() => onCompleteTask(visit.id)}
            onCancel={onCancelEdit}
          />
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
