import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface LoginScreenProps {
  onLogin: (role: 'technician' | 'director', name: string) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const users = localStorage.getItem('mchs_users');
    if (users) {
      const usersList = JSON.parse(users);
      const user = usersList.find((u: any) => u.username === login && u.password === password);
      
      if (user) {
        onLogin(user.role, user.fullName);
        return;
      }
    }
    
    alert('Неверный логин или пароль');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="mb-6">
            <img 
              src="https://cdn.poehali.dev/projects/01f36c76-3df1-4720-9a9a-9dfe8734a6fe/bucket/6edc3eb5-a2c2-411f-bbf0-b9a85eda81cb.png" 
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

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity text-white font-medium h-11"
              >
                <Icon name="LogIn" size={18} className="mr-2" />
                Войти
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}