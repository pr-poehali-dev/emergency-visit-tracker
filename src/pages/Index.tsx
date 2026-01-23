import { useState, useEffect } from 'react';
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

export interface User {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: 'technician' | 'director';
  createdAt: string;
}

function Index() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userName, setUserName] = useState<string>('');
  const [selectedObject, setSelectedObject] = useState<SiteObject | null>(null);

  const getInitialUsers = (): User[] => {
    const saved = localStorage.getItem('mchs_users');
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      {
        id: '1',
        username: 'director',
        password: 'director',
        fullName: 'Директор',
        role: 'director',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        username: 'tech',
        password: 'tech',
        fullName: 'Техник',
        role: 'technician',
        createdAt: new Date().toISOString()
      }
    ];
  };

  const [users, setUsers] = useState<User[]>(getInitialUsers);

  useEffect(() => {
    localStorage.setItem('mchs_users', JSON.stringify(users));
  }, [users]);

  const getInitialObjects = (): SiteObject[] => {
    const saved = localStorage.getItem('mchs_objects');
    if (saved) {
      return JSON.parse(saved);
    }
    return [
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
    ];
  };

  const [objects, setObjects] = useState<SiteObject[]>(getInitialObjects);

  useEffect(() => {
    localStorage.setItem('mchs_objects', JSON.stringify(objects));
  }, [objects]);

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
    if (!selectedObject) return;

    const newVisit: Visit = {
      ...visit,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };

    setObjects(prevObjects => 
      prevObjects.map(obj => 
        obj.id === selectedObject.id
          ? { ...obj, visits: [...obj.visits, newVisit] }
          : obj
      )
    );

    setSelectedObject(prev => 
      prev ? { ...prev, visits: [...prev.visits, newVisit] } : null
    );

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
          users={users}
          onBack={handleBackToObjects}
          onUpdateUsers={setUsers}
        />
      )}
    </div>
  );
}

export default Index;