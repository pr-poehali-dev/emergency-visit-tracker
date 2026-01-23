import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import type { SiteObject } from '@/pages/Index';

interface ObjectHistoryScreenProps {
  object: SiteObject;
  userRole: 'technician' | 'director' | null;
  onBack: () => void;
  onCreateVisit: () => void;
  onUpdateObject: (updatedObject: SiteObject) => void;
}

export default function ObjectHistoryScreen({ 
  object, 
  userRole,
  onBack, 
  onCreateVisit,
  onUpdateObject
}: ObjectHistoryScreenProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [editingVisit, setEditingVisit] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen p-4 md:p-6">
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
                  onClick={() => alert('Функция в разработке')}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  <Icon name="ClipboardList" size={18} className="mr-2" />
                  Создать задачу
                </Button>
              )}
            </div>
          </div>
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
                  <div className="absolute -left-[52px] top-8 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30">
                    <Icon 
                      name={visit.type === 'planned' ? 'Calendar' : 'AlertCircle'} 
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
                                : 'bg-accent/20 text-accent border-accent/30'
                            }
                          >
                            {visit.type === 'planned' ? 'Плановое' : 'Внеплановое'}
                          </Badge>
                          <span className="text-sm text-slate-400">
                            {formatDate(visit.createdAt)}
                          </span>
                        </div>
                        <p className="text-slate-300 mb-2">{visit.comment}</p>
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
                            <img 
                              src={photo} 
                              alt={`Фото ${photoIndex + 1}`}
                              className="w-full h-full object-cover transition-transform group-hover:scale-110 cursor-pointer"
                              onClick={() => setSelectedPhoto(photo)}
                            />
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
                            <div 
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                              onClick={() => setSelectedPhoto(photo)}
                            >
                              <Icon name="ZoomIn" size={24} className="text-white" />
                            </div>
                          </div>
                        ))}
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