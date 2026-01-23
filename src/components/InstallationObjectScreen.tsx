import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import type { SiteObject, InstallationDay } from '@/pages/Index';

interface InstallationObjectScreenProps {
  object: SiteObject;
  userName: string;
  onBack: () => void;
  onUpdateObject: (updatedObject: SiteObject) => void;
}

export default function InstallationObjectScreen({ 
  object, 
  userName,
  onBack, 
  onUpdateObject 
}: InstallationObjectScreenProps) {
  const [isAddingDay, setIsAddingDay] = useState(false);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const days = object.installationDays || [];
  const nextDayNumber = days.length + 1;

  const handleSaveDay = () => {
    if (!comment.trim()) {
      alert('Добавьте комментарий');
      return;
    }

    if (photos.length === 0) {
      alert('Добавьте хотя бы одно фото');
      return;
    }

    const newDay: InstallationDay = {
      id: Date.now().toString(),
      dayNumber: nextDayNumber,
      comment: comment.trim(),
      photos,
      createdBy: userName,
      createdAt: new Date().toISOString()
    };

    const updatedDays = [...days, newDay];
    onUpdateObject({ ...object, installationDays: updatedDays });
    
    setComment('');
    setPhotos([]);
    setIsAddingDay(false);
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
              <div className="flex items-center gap-2 mb-2">
                <Icon name="HardHat" size={24} className="text-secondary" />
                <Badge className="bg-secondary/20 text-secondary border-secondary/30">МОНТАЖ</Badge>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">{object.name}</h1>
              <p className="text-slate-400 flex items-center gap-2 mb-2">
                <Icon name="MapPin" size={16} />
                {object.address}
              </p>
              {object.description && (
                <p className="text-slate-300 text-sm mb-3 italic">{object.description}</p>
              )}
              {(object.contactName || object.contactPhone) && (
                <div className="mt-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700 inline-block">
                  <p className="text-sm font-semibold text-slate-200 mb-1 flex items-center gap-2">
                    <Icon name="Phone" size={14} />
                    Контакты объекта:
                  </p>
                  {object.contactName && (
                    <p className="text-sm text-slate-300">👤 {object.contactName}</p>
                  )}
                  {object.contactPhone && (
                    <p className="text-sm text-slate-300">📞 {object.contactPhone}</p>
                  )}
                </div>
              )}
            </div>

            {!isAddingDay && (
              <Button 
                onClick={() => setIsAddingDay(true)}
                className="bg-gradient-to-r from-secondary to-accent hover:opacity-90 transition-opacity"
              >
                <Icon name="Plus" size={18} className="mr-2" />
                Добавить день {nextDayNumber}
              </Button>
            )}
          </div>
        </div>

        {isAddingDay && (
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">День {nextDayNumber}</h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-200 mb-2 block">Комментарий</Label>
                  <Textarea
                    placeholder="Опишите выполненные работы за день..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="bg-slate-900/50 border-slate-600 text-white min-h-[100px]"
                  />
                </div>
                <div>
                  <Label className="text-slate-200 mb-2 block">Фотоотчёт</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files) {
                        Array.from(files).forEach(file => {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const base64 = event.target?.result as string;
                            setPhotos(prev => [...prev, base64]);
                          };
                          reader.readAsDataURL(file);
                        });
                      }
                    }}
                    className="bg-slate-900/50 border-slate-600 text-white"
                  />
                  {photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {photos.map((photo, idx) => (
                        <div key={idx} className="relative">
                          <img src={photo} alt={`Фото ${idx + 1}`} className="rounded-lg w-full h-24 object-cover" />
                          <button
                            onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center"
                          >
                            <Icon name="X" size={14} className="text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleSaveDay} className="flex-1 bg-secondary">
                    <Icon name="Save" size={18} className="mr-2" />
                    Сохранить день
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsAddingDay(false);
                      setComment('');
                      setPhotos([]);
                    }}
                    className="border-slate-600"
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {days.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <Icon name="Calendar" size={40} className="text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Нет отчётов</h3>
              <p className="text-slate-400">Начните добавлять дни работы</p>
            </div>
          ) : (
            days.map((day) => (
              <Card key={day.id} className="border-slate-700 bg-slate-800/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-secondary/20 text-secondary flex items-center justify-center text-sm font-bold">
                        {day.dayNumber}
                      </span>
                      День {day.dayNumber}
                    </h3>
                    <span className="text-sm text-slate-400">
                      {new Date(day.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <p className="text-slate-300 mb-3">{day.comment}</p>
                  <p className="text-sm text-slate-500 mb-3 flex items-center gap-1">
                    <Icon name="User" size={14} />
                    {day.createdBy}
                  </p>
                  {day.photos.length > 0 && (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                      {day.photos.map((photo, idx) => (
                        <img 
                          key={idx} 
                          src={photo} 
                          alt={`День ${day.dayNumber} фото ${idx + 1}`}
                          className="rounded-lg w-full h-24 object-cover cursor-pointer hover:opacity-80 transition"
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}