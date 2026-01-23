import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import type { SiteObject } from '@/pages/Index';

interface ObjectsListScreenProps {
  objects: SiteObject[];
  userRole: 'technician' | 'director' | null;
  userName: string;
  onSelectObject: (obj: SiteObject) => void;
  onOpenDirectorPanel: () => void;
}

export default function ObjectsListScreen({ 
  objects, 
  userRole, 
  userName,
  onSelectObject,
  onOpenDirectorPanel 
}: ObjectsListScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredObjects = objects.filter(obj => 
    obj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    obj.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Объекты</h1>
            <p className="text-slate-400">
              Привет, {userName} • {userRole === 'director' ? 'Директор' : 'Техник'}
            </p>
          </div>
          
          {userRole === 'director' && (
            <Button 
              onClick={onOpenDirectorPanel}
              className="bg-secondary hover:bg-secondary/90"
            >
              <Icon name="Settings" size={18} className="mr-2" />
              Панель управления
            </Button>
          )}
        </div>

        <div className="mb-6">
          <div className="relative">
            <Icon 
              name="Search" 
              size={20} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" 
            />
            <Input
              type="text"
              placeholder="Поиск по названию или адресу..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 h-12"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredObjects.map((obj) => (
            <Card 
              key={obj.id}
              className="border-slate-700 bg-slate-800/50 backdrop-blur-sm hover:bg-slate-800/70 transition-all cursor-pointer hover-scale group"
              onClick={() => onSelectObject(obj)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                      <Icon name="Building2" size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">
                        {obj.name}
                      </h3>
                      <p className="text-sm text-slate-400 flex items-center gap-1">
                        <Icon name="MapPin" size={14} />
                        {obj.address}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                  <div className="flex items-center gap-2">
                    <Icon name="Calendar" size={16} className="text-slate-400" />
                    <span className="text-sm text-slate-300">
                      {obj.visits.length > 0 
                        ? `${obj.visits.length} посещений` 
                        : 'Нет посещений'
                      }
                    </span>
                  </div>
                  
                  {obj.visits.length > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="bg-primary/20 text-primary border-primary/30"
                    >
                      Активный
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredObjects.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Icon name="Search" size={32} className="text-slate-500" />
            </div>
            <p className="text-slate-400 text-lg">Объекты не найдены</p>
            <p className="text-slate-500 text-sm">Попробуйте изменить параметры поиска</p>
          </div>
        )}
      </div>
    </div>
  );
}
