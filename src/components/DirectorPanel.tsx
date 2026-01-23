import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import type { SiteObject, User } from '@/pages/Index';

interface DirectorPanelProps {
  objects: SiteObject[];
  users: User[];
  onBack: () => void;
  onUpdateUsers: (users: User[]) => void;
}

export default function DirectorPanel({ objects, users, onBack, onUpdateUsers }: DirectorPanelProps) {
  const [selectedTab, setSelectedTab] = useState('export');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'technician' as 'technician' | 'director'
  });

  const totalVisits = objects.reduce((sum, obj) => sum + obj.visits.length, 0);
  const plannedVisits = objects.reduce(
    (sum, obj) => sum + obj.visits.filter(v => v.type === 'planned').length, 
    0
  );
  const unplannedVisits = totalVisits - plannedVisits;

  const handleExport = () => {
    alert('Экспорт в ЛКИР МЧС запущен. Требуется электронная подпись.');
  };

  const handleAddUser = () => {
    if (!newUser.username || !newUser.password || !newUser.fullName) {
      alert('Заполните все поля');
      return;
    }

    if (users.find(u => u.username === newUser.username)) {
      alert('Пользователь с таким логином уже существует');
      return;
    }

    const user: User = {
      id: Date.now().toString(),
      ...newUser,
      createdAt: new Date().toISOString()
    };

    onUpdateUsers([...users, user]);
    setNewUser({ username: '', password: '', fullName: '', role: 'technician' });
    setIsAddingUser(false);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;

    if (!editingUser.username || !editingUser.password || !editingUser.fullName) {
      alert('Заполните все поля');
      return;
    }

    const existingUser = users.find(u => u.username === editingUser.username && u.id !== editingUser.id);
    if (existingUser) {
      alert('Пользователь с таким логином уже существует');
      return;
    }

    onUpdateUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: string) => {
    if (users.length === 1) {
      alert('Нельзя удалить последнего пользователя');
      return;
    }

    if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      onUpdateUsers(users.filter(u => u.id !== userId));
    }
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
                      Акты экспортируются в формате XML для ЛКИР МЧС.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="objects" className="space-y-4">
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Объекты под контролем</h2>
                <div className="space-y-3">
                  {objects.map((obj) => (
                    <div 
                      key={obj.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700"
                    >
                      <div>
                        <h3 className="text-white font-medium mb-1">{obj.name}</h3>
                        <p className="text-sm text-slate-400">{obj.address}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-slate-400">Актов посещений</p>
                          <p className="text-lg font-semibold text-white">{obj.visits.length}</p>
                        </div>
                        <Badge 
                          variant="secondary"
                          className={
                            obj.visits.length > 0 
                              ? 'bg-primary/20 text-primary border-primary/30'
                              : 'bg-slate-700/50 text-slate-400 border-slate-600'
                          }
                        >
                          {obj.visits.length > 0 ? 'Активный' : 'Новый'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Пользователи системы</h2>
              <Button 
                onClick={() => setIsAddingUser(true)}
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              >
                <Icon name="UserPlus" size={18} className="mr-2" />
                Добавить пользователя
              </Button>
            </div>

            {isAddingUser && (
              <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Новый пользователь</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-slate-200 mb-2 block">Полное имя</Label>
                      <Input
                        placeholder="Иванов Иван Иванович"
                        value={newUser.fullName}
                        onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                        className="bg-slate-900/50 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-200 mb-2 block">Логин</Label>
                      <Input
                        placeholder="ivanov"
                        value={newUser.username}
                        onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                        className="bg-slate-900/50 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-200 mb-2 block">Пароль</Label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        className="bg-slate-900/50 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-200 mb-2 block">Роль</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setNewUser({...newUser, role: 'technician'})}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            newUser.role === 'technician'
                              ? 'border-primary bg-primary/10'
                              : 'border-slate-700 bg-slate-900/50'
                          }`}
                        >
                          <Icon name="Wrench" size={20} className="text-primary mx-auto mb-2" />
                          <p className="text-white font-medium">Техник</p>
                        </button>
                        <button
                          onClick={() => setNewUser({...newUser, role: 'director'})}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            newUser.role === 'director'
                              ? 'border-secondary bg-secondary/10'
                              : 'border-slate-700 bg-slate-900/50'
                          }`}
                        >
                          <Icon name="Crown" size={20} className="text-secondary mx-auto mb-2" />
                          <p className="text-white font-medium">Директор</p>
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button 
                        onClick={handleAddUser}
                        className="flex-1 bg-gradient-to-r from-primary to-secondary"
                      >
                        <Icon name="Check" size={18} className="mr-2" />
                        Создать
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setIsAddingUser(false);
                          setNewUser({ username: '', password: '', fullName: '', role: 'technician' });
                        }}
                        className="border-slate-600 text-slate-300 hover:bg-slate-800"
                      >
                        Отмена
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              {users.map((user) => (
                <Card key={user.id} className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
                  <CardContent className="p-4">
                    {editingUser?.id === user.id ? (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-slate-200 mb-2 block">Полное имя</Label>
                          <Input
                            value={editingUser.fullName}
                            onChange={(e) => setEditingUser({...editingUser, fullName: e.target.value})}
                            className="bg-slate-900/50 border-slate-600 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-200 mb-2 block">Логин</Label>
                          <Input
                            value={editingUser.username}
                            onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                            className="bg-slate-900/50 border-slate-600 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-200 mb-2 block">Новый пароль (оставьте пустым, чтобы не менять)</Label>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            value={editingUser.password}
                            onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                            className="bg-slate-900/50 border-slate-600 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-200 mb-2 block">Роль</Label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => setEditingUser({...editingUser, role: 'technician'})}
                              className={`p-3 rounded-lg border-2 transition-all ${
                                editingUser.role === 'technician'
                                  ? 'border-primary bg-primary/10'
                                  : 'border-slate-700 bg-slate-900/50'
                              }`}
                            >
                              <Icon name="Wrench" size={18} className="text-primary mx-auto mb-1" />
                              <p className="text-white text-sm">Техник</p>
                            </button>
                            <button
                              onClick={() => setEditingUser({...editingUser, role: 'director'})}
                              className={`p-3 rounded-lg border-2 transition-all ${
                                editingUser.role === 'director'
                                  ? 'border-secondary bg-secondary/10'
                                  : 'border-slate-700 bg-slate-900/50'
                              }`}
                            >
                              <Icon name="Crown" size={18} className="text-secondary mx-auto mb-1" />
                              <p className="text-white text-sm">Директор</p>
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleUpdateUser}
                            size="sm"
                            className="bg-primary hover:bg-primary/90"
                          >
                            <Icon name="Check" size={16} className="mr-1" />
                            Сохранить
                          </Button>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingUser(null)}
                            className="border-slate-600 text-slate-300"
                          >
                            Отмена
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                            <Icon 
                              name={user.role === 'director' ? 'Crown' : 'User'} 
                              size={20} 
                              className="text-white" 
                            />
                          </div>
                          <div>
                            <h3 className="text-white font-medium">{user.fullName}</h3>
                            <p className="text-sm text-slate-400">@{user.username}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant="secondary"
                            className={
                              user.role === 'director'
                                ? 'bg-secondary/20 text-secondary border-secondary/30'
                                : 'bg-primary/20 text-primary border-primary/30'
                            }
                          >
                            {user.role === 'director' ? 'Директор' : 'Техник'}
                          </Badge>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingUser(user)}
                              className="text-slate-400 hover:text-white hover:bg-slate-700"
                            >
                              <Icon name="Edit" size={16} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Icon name="Trash2" size={16} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
