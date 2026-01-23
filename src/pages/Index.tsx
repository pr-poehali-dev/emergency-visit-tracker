import { useState } from 'react';
import LoginScreen from '@/components/LoginScreen';
import ObjectsListScreen from '@/components/ObjectsListScreen';
import ObjectHistoryScreen from '@/components/ObjectHistoryScreen';
import CreateVisitScreen from '@/components/CreateVisitScreen';
import DirectorPanel from '@/components/DirectorPanel';

type Screen = 'login' | 'objects' | 'history' | 'create' | 'director';
type UserRole = 'technician' | 'director' | null;

export interface Visit {
  id: string;
  date: string;
  type: 'planned' | 'unplanned';
  comment: string;
  photos: string[];
  createdBy: string;
  createdAt: string;
}

export interface SiteObject {
  id: string;
  name: string;
  address: string;
  visits: Visit[];
}

function Index() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userName, setUserName] = useState<string>('');
  const [selectedObject, setSelectedObject] = useState<SiteObject | null>(null);

  const [objects] = useState<SiteObject[]>([
    {
      id: '1',
      name: 'ТЦ "Галерея"',
      address: 'ул. Ленина, 45',
      visits: [
        {
          id: '1',
          date: '2026-01-20',
          type: 'planned',
          comment: 'Проверка системы пожаротушения, все работает исправно. Датчики в норме.',
          photos: ['https://placehold.co/600x400/0EA5E9/fff?text=Система+пожаротушения'],
          createdBy: 'Иванов И.И.',
          createdAt: '2026-01-20T10:30:00'
        },
        {
          id: '2',
          date: '2026-01-15',
          type: 'unplanned',
          comment: 'Срочный выезд по заявке клиента. Замена датчика дыма.',
          photos: ['https://placehold.co/600x400/8B5CF6/fff?text=Датчик+дыма'],
          createdBy: 'Петров П.П.',
          createdAt: '2026-01-15T14:20:00'
        }
      ]
    },
    {
      id: '2',
      name: 'Офисный центр "Сити"',
      address: 'пр. Мира, 12',
      visits: [
        {
          id: '3',
          date: '2026-01-18',
          type: 'planned',
          comment: 'Плановое техническое обслуживание систем безопасности',
          photos: ['https://placehold.co/600x400/F97316/fff?text=ТО+систем'],
          createdBy: 'Сидоров С.С.',
          createdAt: '2026-01-18T09:00:00'
        }
      ]
    },
    {
      id: '3',
      name: 'Склад "Логистик+"',
      address: 'ул. Промышленная, 8',
      visits: []
    },
    {
      id: '4',
      name: 'Бизнес-центр "Альфа"',
      address: 'ул. Гагарина, 23',
      visits: []
    }
  ]);

  const handleLogin = (role: UserRole, name: string) => {
    setUserRole(role);
    setUserName(name);
    setCurrentScreen('objects');
  };

  const handleSelectObject = (obj: SiteObject) => {
    setSelectedObject(obj);
    setCurrentScreen('history');
  };

  const handleCreateVisit = () => {
    setCurrentScreen('create');
  };

  const handleBackToObjects = () => {
    setSelectedObject(null);
    setCurrentScreen('objects');
  };

  const handleBackToHistory = () => {
    setCurrentScreen('history');
  };

  const handleOpenDirectorPanel = () => {
    setCurrentScreen('director');
  };

  const handleSaveVisit = (visit: Omit<Visit, 'id' | 'createdAt'>) => {
    console.log('Сохранение визита:', visit);
    setCurrentScreen('history');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {currentScreen === 'login' && <LoginScreen onLogin={handleLogin} />}
      
      {currentScreen === 'objects' && (
        <ObjectsListScreen 
          objects={objects}
          userRole={userRole}
          userName={userName}
          onSelectObject={handleSelectObject}
          onOpenDirectorPanel={handleOpenDirectorPanel}
        />
      )}
      
      {currentScreen === 'history' && selectedObject && (
        <ObjectHistoryScreen 
          object={selectedObject}
          onBack={handleBackToObjects}
          onCreateVisit={handleCreateVisit}
        />
      )}
      
      {currentScreen === 'create' && selectedObject && (
        <CreateVisitScreen 
          object={selectedObject}
          userName={userName}
          onBack={handleBackToHistory}
          onSave={handleSaveVisit}
        />
      )}
      
      {currentScreen === 'director' && (
        <DirectorPanel 
          objects={objects}
          onBack={handleBackToObjects}
        />
      )}
    </div>
  );
}

export default Index;