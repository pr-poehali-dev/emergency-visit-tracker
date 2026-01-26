import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import SyncButton from '@/components/SyncButton';
import type { SiteObject } from '@/pages/Index';
import heic2any from 'heic2any';

interface CreateTaskScreenProps {
  object: SiteObject;
  userName: string;
  userRole: 'technician' | 'director' | 'supervisor' | null;
  onBack: () => void;
  onSave: (updatedObject: SiteObject) => void;
  onSync?: () => Promise<void>;
}

export default function CreateTaskScreen({ 
  object, 
  userName, 
  userRole,
  onBack, 
  onSave,
  onSync
}: CreateTaskScreenProps) {
  const [taskDescription, setTaskDescription] = useState('');
  const [taskRecipient, setTaskRecipient] = useState<'technician' | 'director'>('technician');
  const [taskPhotos, setTaskPhotos] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newPhotos: string[] = [];

      for (const file of filesArray) {
        try {
          let processedFile = file;
          
          if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic')) {
            const convertedBlob = await heic2any({
              blob: file,
              toType: 'image/jpeg',
              quality: 0.8
            }) as Blob;
            processedFile = new File([convertedBlob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
          }

          const reader = new FileReader();
          const photoData = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(processedFile);
          });
          
          newPhotos.push(photoData);
        } catch (error) {
          console.error('Photo processing error:', error);
          alert('Ошибка обработки фото');
        }
      }

      setTaskPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setTaskPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskDescription.trim()) {
      alert('Укажите описание задачи');
      return;
    }

    setIsSending(true);

    const newTask = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: 'task' as const,
      comment: '',
      photos: taskPhotos,
      createdBy: userName,
      createdByRole: userRole || 'technician',
      createdAt: new Date().toISOString(),
      taskDescription: taskDescription,
      taskRecipient: taskRecipient,
      taskCompleted: false,
      smsNotifications: [] as any[]
    };

    const updatedObject = {
      ...object,
      visits: [...object.visits, newTask]
    };

    const users = localStorage.getItem('mchs_users');
    if (users) {
      try {
        const usersList = JSON.parse(users);
        const recipientPhones = usersList
          .filter((u: any) => {
            if (taskRecipient === 'director') {
              return u.role === 'director' && u.phone;
            } else {
              return (u.role === 'technician' || u.role === 'supervisor') && u.phone;
            }
          })
          .map((u: any) => u.phone);
        
        if (recipientPhones.length > 0) {
          const response = await fetch('https://functions.poehali.dev/337019d5-dd82-4aaa-8118-0093926f6759', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phones: recipientPhones,
              object_name: object.name,
              task_description: taskDescription
            })
          });
          
          const result = await response.json();
          if (result.status === 'success' && result.notifications) {
            newTask.smsNotifications = result.notifications;
          }
        }
      } catch (error) {
        console.error('SMS notification error:', error);
      }
    }

    onSave(updatedObject);
    setIsSending(false);
    onBack();
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <Icon name="ArrowLeft" size={18} className="mr-2" />
            Назад к объекту
          </Button>
          {onSync && <SyncButton onSync={onSync} />}
        </div>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Icon name="ClipboardList" size={24} className="text-primary" />
              Создать задачу
            </CardTitle>
            <div className="mt-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
              <p className="text-slate-300 text-sm">
                <span className="font-medium">{object.name}</span>
              </p>
              <p className="text-slate-400 text-xs mt-1">{object.address}</p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-200">Для кого задача? *</Label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setTaskRecipient('technician')}
                    className={`flex-1 p-3 rounded-lg border transition-all ${
                      taskRecipient === 'technician'
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'bg-slate-900/50 border-slate-600 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <Icon name="Users" size={20} className="mx-auto mb-1" />
                    <div className="text-sm font-medium">Для техников</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskRecipient('director')}
                    className={`flex-1 p-3 rounded-lg border transition-all ${
                      taskRecipient === 'director'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                        : 'bg-slate-900/50 border-slate-600 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <Icon name="UserCog" size={20} className="mx-auto mb-1" />
                    <div className="text-sm font-medium">Для директора</div>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Описание задачи *</Label>
                <textarea
                  placeholder="Опишите задачу для техников..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-600 text-white rounded-md px-3 py-2 min-h-[120px] resize-y placeholder:text-slate-500"
                  required
                />
                <p className="text-xs text-slate-500">
                  {taskRecipient === 'director' 
                    ? 'Задачу сможет закрыть только директор'
                    : 'Задачу смогут закрыть техники и руководители'}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Фото и файлы (опционально)</Label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/heic,image/heif"
                  capture="environment"
                  multiple
                  onChange={handlePhotoUpload}
                  className="w-full bg-slate-900/50 border border-slate-600 text-white rounded-md file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-white"
                />
                {taskPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {taskPhotos.map((photo, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                        <img 
                          src={photo} 
                          alt={`Фото ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Icon name="X" size={14} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <Icon name="MessageCircle" size={16} className="text-blue-400 mt-0.5" />
                  <p className="text-xs text-blue-300">
                    {taskRecipient === 'director'
                      ? 'После создания задачи директор получит SMS-уведомление'
                      : 'После создания задачи техники получат SMS-уведомление на свои телефоны'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  type="submit"
                  disabled={isSending}
                  className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-medium disabled:opacity-50"
                >
                  <Icon name={isSending ? "Loader2" : "Check"} size={18} className={`mr-2 ${isSending ? 'animate-spin' : ''}`} />
                  {isSending ? 'Отправка...' : 'Создать задачу'}
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}