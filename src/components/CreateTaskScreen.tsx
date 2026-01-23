import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import type { SiteObject } from '@/pages/Index';

interface CreateTaskScreenProps {
  object: SiteObject;
  userName: string;
  onBack: () => void;
  onSave: (updatedObject: SiteObject) => void;
}

export default function CreateTaskScreen({ 
  object, 
  userName, 
  onBack, 
  onSave 
}: CreateTaskScreenProps) {
  const [taskDescription, setTaskDescription] = useState('');
  const [isSending, setIsSending] = useState(false);

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
      photos: [],
      createdBy: userName,
      createdAt: new Date().toISOString(),
      taskDescription: taskDescription,
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
        const technicianPhones = usersList
          .filter((u: any) => (u.role === 'technician' || u.role === 'supervisor') && u.phone)
          .map((u: any) => u.phone);
        
        if (technicianPhones.length > 0) {
          const response = await fetch('https://functions.poehali.dev/337019d5-dd82-4aaa-8118-0093926f6759', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phones: technicianPhones,
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
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="text-slate-300 hover:text-white hover:bg-slate-800 mb-4"
        >
          <Icon name="ArrowLeft" size={18} className="mr-2" />
          Назад к объекту
        </Button>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Icon name="ClipboardList" size={24} className="text-primary" />
              Создать задачу для техников
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
                <Label className="text-slate-200">Описание задачи *</Label>
                <textarea
                  placeholder="Опишите задачу для техников..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-600 text-white rounded-md px-3 py-2 min-h-[120px] resize-y placeholder:text-slate-500"
                  required
                />
                <p className="text-xs text-slate-500">
                  Эта задача появится у техников как посещение, требующее выполнения
                </p>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <Icon name="MessageCircle" size={16} className="text-blue-400 mt-0.5" />
                  <p className="text-xs text-blue-300">
                    После создания задачи техники получат SMS-уведомление на свои телефоны
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