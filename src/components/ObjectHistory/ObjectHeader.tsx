import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import type { SiteObject } from '@/pages/Index';

interface ObjectHeaderProps {
  object: SiteObject;
  userRole: 'technician' | 'director' | 'supervisor' | null;
  onBack: () => void;
  onCreateVisit: () => void;
  onCreateTask: () => void;
}

export default function ObjectHeader({
  object,
  userRole,
  onBack,
  onCreateVisit,
  onCreateTask
}: ObjectHeaderProps) {
  return (
    <>
      <Button 
        variant="ghost" 
        onClick={onBack}
        className="text-slate-300 hover:text-white hover:bg-slate-800 mb-4"
      >
        <Icon name="ArrowLeft" size={18} className="mr-2" />
        Назад к объектам
      </Button>
      
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
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
          
          {(userRole === 'director' || userRole === 'supervisor') && (
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
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm mb-6">
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
    </>
  );
}