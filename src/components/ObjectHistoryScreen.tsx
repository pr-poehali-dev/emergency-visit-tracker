import { useState } from 'react';
import ObjectHeader from '@/components/ObjectHistory/ObjectHeader';
import VisitTimeline from '@/components/ObjectHistory/VisitTimeline';
import PhotoModal from '@/components/ObjectHistory/PhotoModal';
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
  const [isCompleting, setIsCompleting] = useState(false);

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

  const handleCompleteTask = async (visitId: string) => {
    if (!taskComment.trim()) {
      alert('Добавьте комментарий к выполненной задаче');
      return;
    }
    if (taskPhotos.length === 0) {
      alert('Добавьте хотя бы одно фото подтверждения');
      return;
    }

    setIsCompleting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 100));

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
    } catch (error) {
      console.error('Complete task error:', error);
      alert('Ошибка завершения задачи. Попробуйте ещё раз.');
    } finally {
      setIsCompleting(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert('Файл слишком большой. Максимум 20 МБ.');
      e.target.value = '';
      return;
    }

    try {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            const maxSize = 1280;
            if (width > maxSize || height > maxSize) {
              if (width > height) {
                height = (height / width) * maxSize;
                width = maxSize;
              } else {
                width = (width / height) * maxSize;
                height = maxSize;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              throw new Error('Canvas context not available');
            }
            
            ctx.drawImage(img, 0, 0, width, height);
            
            let compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            
            const sizeInMB = (compressedBase64.length * 0.75) / (1024 * 1024);
            if (sizeInMB > 2) {
              compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
            }
            
            setTaskPhotos([...taskPhotos, compressedBase64]);
            e.target.value = '';
          } catch (error) {
            console.error('Image compression error:', error);
            alert('Ошибка сжатия изображения. Попробуйте другое фото.');
            e.target.value = '';
          }
        };
        
        img.onerror = () => {
          alert('Ошибка обработки изображения');
          e.target.value = '';
        };
        
        img.src = base64;
      };

      reader.onerror = () => {
        alert('Ошибка загрузки фото');
        e.target.value = '';
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Photo upload error:', error);
      alert('Ошибка загрузки фото');
      e.target.value = '';
    }
  };

  const handleDeletePhoto = (visitId: string, photoIndex: number) => {
    const visit = object.visits.find(v => v.id === visitId);
    if (!visit) return;
    
    const updatedPhotos = visit.photos.filter((_, i) => i !== photoIndex);
    const updatedVisits = object.visits.map(v => 
      v.id === visitId ? { ...v, photos: updatedPhotos } : v
    );
    onUpdateObject({ ...object, visits: updatedVisits });
  };

  const handleDeleteVisit = (visitId: string) => {
    const updatedVisits = object.visits.filter(v => v.id !== visitId);
    onUpdateObject({ ...object, visits: updatedVisits });
    setEditingVisit(null);
  };

  const handleCancelEdit = () => {
    setEditingVisit(null);
    setTaskComment('');
    setTaskPhotos([]);
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
          <ObjectHeader
            object={object}
            userRole={userRole}
            onBack={onBack}
            onCreateVisit={onCreateVisit}
            onCreateTask={onCreateTask}
          />

          <VisitTimeline
            visits={object.visits}
            userRole={userRole}
            editingVisit={editingVisit}
            taskComment={taskComment}
            taskPhotos={taskPhotos}
            isCompleting={isCompleting}
            formatDate={formatDate}
            onCreateVisit={onCreateVisit}
            onPhotoClick={setSelectedPhoto}
            onEditClick={setEditingVisit}
            onDeletePhoto={handleDeletePhoto}
            onDeleteVisit={handleDeleteVisit}
            onCancelEdit={handleCancelEdit}
            onTaskCommentChange={setTaskComment}
            onTaskPhotoUpload={handlePhotoUpload}
            onTaskPhotoRemove={(index) => setTaskPhotos(taskPhotos.filter((_, i) => i !== index))}
            onCompleteTask={handleCompleteTask}
          />
        </div>
      </div>

      {selectedPhoto && (
        <PhotoModal 
          photoUrl={selectedPhoto} 
          onClose={() => setSelectedPhoto(null)} 
        />
      )}
    </div>
  );
}
