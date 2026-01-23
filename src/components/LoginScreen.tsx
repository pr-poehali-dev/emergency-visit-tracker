import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { downloadFromServer } from '@/lib/sync';

interface LoginScreenProps {
  onLogin: (role: 'technician' | 'director', name: string) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSyncMessage('');
    
    try {
      let users = localStorage.getItem('mchs_users');
      
      if (!users) {
        setSyncMessage('Загрузка данных с сервера...');
        const result = await downloadFromServer();
        
        if (result.success) {
          users = localStorage.getItem('mchs_users');
          setSyncMessage('✓ Данные загружены');
        }
      }
      
      if (users) {
        const usersList = JSON.parse(users);
        const user = usersList.find((u: any) => u.username === login && u.password === password);
        
        if (user) {
          onLogin(user.role, user.fullName);
          return;
        }
      }
      
      alert('Неверный логин или пароль');
    } catch (error) {
      console.error('Login error:', error);
      setSyncMessage('✗ Ошибка загрузки данных');
      alert('Ошибка подключения к серверу. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="mb-6">
            <img 
              src="https://cdn.poehali.dev/projects/01f36c76-3df1-4720-9a9a-9dfe8734a6fe/bucket/06bb4586-6890-42d6-b2d4-7803af50a519.png" 
              alt="PROFIRE - ЮГ" 
              className="mx-auto w-80 h-auto"
            />
          </div>
          <p className="text-slate-300">Система учёта посещений объектов</p>
        </div>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white">Вход в систему</CardTitle>
            <CardDescription className="text-slate-400">
              Введите данные для авторизации
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login" className="text-slate-200">Логин</Label>
                <div className="relative">
                  <Icon 
                    name="User" 
                    size={18} 
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" 
                  />
                  <Input
                    id="login"
                    type="text"
                    placeholder="Введите логин"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">Пароль</Label>
                <div className="relative">
                  <Icon 
                    name="Lock" 
                    size={18} 
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" 
                  />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Введите пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              {syncMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  syncMessage.startsWith('✓') 
                    ? 'bg-green-500/10 border border-green-500/30 text-green-300'
                    : syncMessage.startsWith('✗')
                    ? 'bg-red-500/10 border border-red-500/30 text-red-300'
                    : 'bg-blue-500/10 border border-blue-500/30 text-blue-300'
                }`}>
                  {syncMessage}
                </div>
              )}

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity text-white font-medium h-11"
              >
                <Icon name={isLoading ? "Loader2" : "LogIn"} size={18} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Загрузка...' : 'Войти'}
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-700">
              <Button
                type="button"
                variant="ghost"
                className="w-full text-slate-400 hover:text-white hover:bg-slate-800"
                onClick={async () => {
                  setIsLoading(true);
                  setSyncMessage('Синхронизация с сервером...');
                  try {
                    const result = await downloadFromServer();
                    if (result.success) {
                      setSyncMessage(`✓ ${result.message}`);
                    } else {
                      setSyncMessage(`✗ ${result.message}`);
                    }
                  } catch (error) {
                    setSyncMessage('✗ Ошибка подключения');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
              >
                <Icon name="CloudDownload" size={18} className="mr-2" />
                Загрузить данные с сервера
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}