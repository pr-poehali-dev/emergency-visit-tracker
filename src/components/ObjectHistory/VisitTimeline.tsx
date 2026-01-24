import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import VisitCard from './VisitCard';
import type { Visit } from '@/pages/Index';

interface VisitTimelineProps {
  visits: Visit[];
  userRole: 'technician' | 'director' | 'supervisor' | null;
  editingVisit: string | null;
  taskComment: string;
  taskPhotos: string[];
  isCompleting: boolean;
  formatDate: (date: string) => string;
  onCreateVisit: () => void;
  onPhotoClick: (photo: string) => void;
  onEditClick: (visitId: string) => void;
  onDeletePhoto: (visitId: string, photoIndex: number) => void;
  onDeleteVisit: (visitId: string) => void;
  onCancelEdit: () => void;
  onTaskCommentChange: (comment: string) => void;
  onTaskPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTaskPhotoRemove: (index: number) => void;
  onCompleteTask: (visitId: string) => void;
}

export default function VisitTimeline({
  visits,
  userRole,
  editingVisit,
  taskComment,
  taskPhotos,
  isCompleting,
  formatDate,
  onCreateVisit,
  onPhotoClick,
  onEditClick,
  onDeletePhoto,
  onDeleteVisit,
  onCancelEdit,
  onTaskCommentChange,
  onTaskPhotoUpload,
  onTaskPhotoRemove,
  onCompleteTask
}: VisitTimelineProps) {
  if (visits.length === 0) {
    return (
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
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-accent"></div>
      
      <div className="space-y-6">
        {visits.map((visit, index) => (
          <VisitCard
            key={visit.id}
            visit={visit}
            index={index}
            userRole={userRole}
            editingVisit={editingVisit}
            taskComment={taskComment}
            taskPhotos={taskPhotos}
            isCompleting={isCompleting}
            formatDate={formatDate}
            onPhotoClick={onPhotoClick}
            onEditClick={onEditClick}
            onDeletePhoto={onDeletePhoto}
            onDeleteVisit={onDeleteVisit}
            onCancelEdit={onCancelEdit}
            onTaskCommentChange={onTaskCommentChange}
            onTaskPhotoUpload={onTaskPhotoUpload}
            onTaskPhotoRemove={onTaskPhotoRemove}
            onCompleteTask={onCompleteTask}
          />
        ))}
      </div>
    </div>
  );
}
