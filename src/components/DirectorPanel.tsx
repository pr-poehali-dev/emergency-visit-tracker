import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import type { SiteObject, User } from '@/pages/Index';
import ExportTab from './director/ExportTab';
import ObjectsTab from './director/ObjectsTab';
import UsersTab from './director/UsersTab';
import ObjectsManagementTab from './director/ObjectsManagementTab';
import SyncTab from './director/SyncTab';

interface DirectorPanelProps {
  objects: SiteObject[];
  users: User[];
  onBack: () => void;
  onUpdateUsers: (users: User[]) => void;
  onUpdateObjects: (objects: SiteObject[]) => void;
}

export default function DirectorPanel({ objects, users, onBack, onUpdateUsers, onUpdateObjects }: DirectorPanelProps) {
  const [selectedTab, setSelectedTab] = useState('export');

  const totalVisits = objects.reduce((sum, obj) => sum + obj.visits.length, 0);
  const plannedVisits = objects.reduce(
    (sum, obj) => sum + obj.visits.filter(v => v.type === 'planned').length, 
    0
  );
  const unplannedVisits = totalVisits - plannedVisits;

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="text-slate-300 hover:text-white hover:bg-slate-800 mb-4"
          >
            <Icon name="ArrowLeft" size={18} className="mr-2" />
            Назад к объектам
          </Button>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
              <Icon name="Settings" size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Панель управления</h1>
              <p className="text-slate-400">Контроль и отчётность</p>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Объектов</p>
                    <p className="text-2xl font-bold text-white">{objects.length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Icon name="Building2" size={20} className="text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Всего актов</p>
                    <p className="text-2xl font-bold text-white">{totalVisits}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                    <Icon name="FileText" size={20} className="text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Плановых</p>
                    <p className="text-2xl font-bold text-white">{plannedVisits}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Icon name="Calendar" size={20} className="text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Внеплановых</p>
                    <p className="text-2xl font-bold text-white">{unplannedVisits}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                    <Icon name="AlertCircle" size={20} className="text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="export" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Icon name="Download" size={16} className="mr-2" />
              Экспорт данных
            </TabsTrigger>
            <TabsTrigger value="objects" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Icon name="Building2" size={16} className="mr-2" />
              Объекты
            </TabsTrigger>
            <TabsTrigger value="manage" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Icon name="Settings" size={16} className="mr-2" />
              Управление
            </TabsTrigger>
            <TabsTrigger value="sync" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Icon name="CloudUpload" size={16} className="mr-2" />
              Синхронизация
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Icon name="Users" size={16} className="mr-2" />
              Пользователи
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export">
            <ExportTab objects={objects} />
          </TabsContent>

          <TabsContent value="objects">
            <ObjectsTab objects={objects} />
          </TabsContent>

          <TabsContent value="manage">
            <ObjectsManagementTab objects={objects} onUpdateObjects={onUpdateObjects} />
          </TabsContent>

          <TabsContent value="sync">
            <SyncTab objects={objects} />
          </TabsContent>

          <TabsContent value="users">
            <UsersTab users={users} onUpdateUsers={onUpdateUsers} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}