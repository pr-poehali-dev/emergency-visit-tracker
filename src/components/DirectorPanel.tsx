import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import type { SiteObject } from '@/pages/Index';

interface DirectorPanelProps {
  objects: SiteObject[];
  onBack: () => void;
}

export default function DirectorPanel({ objects, onBack }: DirectorPanelProps) {
  const [selectedTab, setSelectedTab] = useState('export');

  const totalVisits = objects.reduce((sum, obj) => sum + obj.visits.length, 0);
  const plannedVisits = objects.reduce(
    (sum, obj) => sum + obj.visits.filter(v => v.type === 'planned').length, 
    0
  );
  const unplannedVisits = totalVisits - plannedVisits;

  const handleExport = () => {
    alert('Экспорт в ЛКИР МЧС запущен. Требуется электронная подпись.');
  };

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
              Управление объектами
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Icon name="Users" size={16} className="mr-2" />
              Пользователи
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                    <Icon name="FileDown" size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-2">Выгрузка в ЛКИР МЧС</h2>
                    <p className="text-slate-400">
                      Экспорт всех актов посещений в формате для загрузки в систему МЧС. 
                      Требуется электронная подпись директора.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                    <span className="text-slate-300">Период</span>
                    <span className="text-white font-medium">Январь 2026</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                    <span className="text-slate-300">Объектов</span>
                    <span className="text-white font-medium">{objects.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                    <span className="text-slate-300">Актов посещений</span>
                    <span className="text-white font-medium">{totalVisits}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                    <span className="text-slate-300">Фотографий</span>
                    <span className="text-white font-medium">
                      {objects.reduce((sum, obj) => 
                        sum + obj.visits.reduce((s, v) => s + v.photos.length, 0), 0
                      )}
                    </span>
                  </div>
                </div>

                <Button 
                  onClick={handleExport}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 h-12"
                >
                  <Icon name="FileDown" size={18} className="mr-2" />
                  Начать экспорт с ЭП
                </Button>

                <div className="mt-4 flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <Icon name="Info" size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-amber-200 font-medium mb-1">Требования МЧС</p>
                    <p className="text-amber-300/80">
                      Для выгрузки необходима квалифицированная электронная подпись директора. 
                      Акты экспортируются в формате XML для ЛКИР.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="objects" className="space-y-4">
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Список объектов</h2>
                  <Button className="bg-secondary hover:bg-secondary/90">
                    <Icon name="Plus" size={18} className="mr-2" />
                    Добавить объект
                  </Button>
                </div>

                <div className="space-y-3">
                  {objects.map((obj) => (
                    <div 
                      key={obj.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700 hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                          <Icon name="Building2" size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{obj.name}</p>
                          <p className="text-sm text-slate-400">{obj.address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                          {obj.visits.length} актов
                        </Badge>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                          <Icon name="Edit" size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Управление пользователями</h2>
                  <Button className="bg-secondary hover:bg-secondary/90">
                    <Icon name="UserPlus" size={18} className="mr-2" />
                    Добавить пользователя
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <span className="text-white font-semibold">Д</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">Директор</p>
                        <p className="text-sm text-slate-400">director@example.com</p>
                      </div>
                    </div>
                    <Badge className="bg-secondary/20 text-secondary border-secondary/30">
                      Директор
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <span className="text-white font-semibold">И</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">Иванов И.И.</p>
                        <p className="text-sm text-slate-400">ivanov@example.com</p>
                      </div>
                    </div>
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      Техник
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <span className="text-white font-semibold">П</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">Петров П.П.</p>
                        <p className="text-sm text-slate-400">petrov@example.com</p>
                      </div>
                    </div>
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      Техник
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
