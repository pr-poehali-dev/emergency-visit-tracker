import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import type { User } from '@/pages/Index';

interface UsersTabProps {
  users: User[];
  onUpdateUsers: (users: User[]) => void;
}

export default function UsersTab({ users, onUpdateUsers }: UsersTabProps) {
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'technician' as 'technician' | 'director' | 'supervisor'
  });

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

    console.log('🆕 Creating new user:', user);
    console.log('📋 Current users:', users.length);
    const updatedUsers = [...users, user];
    console.log('📋 Updated users list:', updatedUsers.length, updatedUsers);
    onUpdateUsers(updatedUsers);
    setNewUser({ username: '', password: '', fullName: '', phone: '', role: 'technician' });
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
    <div className="space-y-4">
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
                <Label className="text-slate-200 mb-2 block">Телефон (для SMS-уведомлений)</Label>
                <Input
                  placeholder="+7 (999) 123-45-67"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  className="bg-slate-900/50 border-slate-600 text-white"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Техники получат SMS при назначении задачи
                </p>
              </div>
              <div>
                <Label className="text-slate-200 mb-2 block">Роль</Label>
                <div className="grid grid-cols-3 gap-3">
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
                    onClick={() => setNewUser({...newUser, role: 'supervisor'})}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      newUser.role === 'supervisor'
                        ? 'border-accent bg-accent/10'
                        : 'border-slate-700 bg-slate-900/50'
                    }`}
                  >
                    <Icon name="UserCheck" size={20} className="text-accent mx-auto mb-2" />
                    <p className="text-white font-medium text-sm">Руководитель</p>
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
                <p className="text-xs text-slate-500 mt-2">
                  Руководитель имеет те же права, что и техник
                </p>
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
                    setNewUser({ username: '', password: '', fullName: '', phone: '', role: 'technician' });
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
                    <Label className="text-slate-200 mb-2 block">Телефон (для SMS-уведомлений)</Label>
                    <Input
                      placeholder="+7 (999) 123-45-67"
                      value={editingUser.phone || ''}
                      onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                      className="bg-slate-900/50 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-200 mb-2 block">Роль</Label>
                    <div className="grid grid-cols-3 gap-3">
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
                        onClick={() => setEditingUser({...editingUser, role: 'supervisor'})}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          editingUser.role === 'supervisor'
                            ? 'border-accent bg-accent/10'
                            : 'border-slate-700 bg-slate-900/50'
                        }`}
                      >
                        <Icon name="UserCheck" size={18} className="text-accent mx-auto mb-1" />
                        <p className="text-white text-xs">Руководитель</p>
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
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      user.role === 'director' 
                        ? 'bg-gradient-to-br from-secondary to-accent'
                        : user.role === 'supervisor'
                        ? 'bg-gradient-to-br from-accent to-primary'
                        : 'bg-gradient-to-br from-primary to-secondary'
                    }`}>
                      <Icon 
                        name={user.role === 'director' ? 'Crown' : user.role === 'supervisor' ? 'UserCheck' : 'Wrench'} 
                        size={20} 
                        className="text-white" 
                      />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{user.fullName}</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-slate-400">@{user.username}</p>
                        {user.phone && (
                          <span className="text-xs text-slate-500">• {user.phone}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant="secondary"
                      className={
                        user.role === 'director'
                          ? 'bg-secondary/20 text-secondary border-secondary/30'
                          : user.role === 'supervisor'
                          ? 'bg-accent/20 text-accent border-accent/30'
                          : 'bg-primary/20 text-primary border-primary/30'
                      }
                    >
                      {user.role === 'director' ? 'Директор' : user.role === 'supervisor' ? 'Руководитель' : 'Техник'}
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
    </div>
  );
}