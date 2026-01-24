import { useState, useEffect } from 'react';
import LoginScreen from '@/components/LoginScreen';
import ObjectsListScreen from '@/components/ObjectsListScreen';
import ObjectHistoryScreen from '@/components/ObjectHistoryScreen';
import CreateVisitScreen from '@/components/CreateVisitScreen';
import CreateTaskScreen from '@/components/CreateTaskScreen';
import InstallationObjectScreen from '@/components/InstallationObjectScreen';
import DirectorPanel from '@/components/DirectorPanel';

type Screen = 'login' | 'objects' | 'history' | 'create' | 'director' | 'createTask' | 'installation';
type UserRole = 'technician' | 'director' | 'supervisor' | null;

export interface SmsNotification {
  phone: string;
  status: 'sent' | 'failed' | 'queued';
  message_id?: number;
  cost?: number;
  error?: string;
}

export interface Visit {
  id: string;
  date: string;
  type: 'planned' | 'unplanned' | 'task';
  comment: string;
  photos: string[];
  createdBy: string;
  createdAt: string;
  taskDescription?: string;
  taskCompleted?: boolean;
  taskCompletedBy?: string;
  taskCompletedAt?: string;
  smsNotifications?: SmsNotification[];
}

export interface SiteObject {
  id: string;
  name: string;
  address: string;
  description?: string;
  contactName?: string;
  contactPhone?: string;
  objectPhoto?: string;
  objectType?: 'regular' | 'installation';
  visits: Visit[];
  installationDays?: InstallationDay[];
  deleted?: boolean;
}

export interface InstallationDay {
  id: string;
  dayNumber: number;
  date: string;
  comment: string;
  photos: string[];
  createdBy: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  fullName: string;
  phone?: string;
  role: 'technician' | 'director' | 'supervisor';
  createdAt: string;
}

function Index() {
  const getInitialSession = () => {
    const saved = localStorage.getItem('mchs_session');
    if (saved) {
      const session = JSON.parse(saved);
      return {
        screen: 'objects' as Screen,
        role: session.role as UserRole,
        name: session.name
      };
    }
    return {
      screen: 'login' as Screen,
      role: null as UserRole,
      name: ''
    };
  };

  const initialSession = getInitialSession();
  const [currentScreen, setCurrentScreen] = useState<Screen>(initialSession.screen);
  const [userRole, setUserRole] = useState<UserRole>(initialSession.role);
  const [userName, setUserName] = useState<string>(initialSession.name);
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

  const updateObjects = (newObjects: SiteObject[]) => {
    console.log('updateObjects called with:', newObjects.length, 'objects');
    setObjects(newObjects);
    try {
      localStorage.setItem('mchs_objects', JSON.stringify(newObjects));
      console.log('LocalStorage updated successfully');
    } catch (error) {
      console.error('LocalStorage save error:', error);
      alert('⚠️ Ошибка сохранения данных. Возможно LocalStorage переполнен.');
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('mchs_objects', JSON.stringify(objects));
    } catch (error) {
      console.error('LocalStorage save error:', error);
    }
  }, [objects]);

  const handleLogin = (role: UserRole, name: string) => {
    setUserRole(role);
    setUserName(name);
    setCurrentScreen('objects');
    localStorage.setItem('mchs_session', JSON.stringify({ role, name }));
  };

  const handleSelectObject = (obj: SiteObject) => {
    setSelectedObject(obj);
    if (obj.objectType === 'installation') {
      setCurrentScreen('installation');
    } else {
      setCurrentScreen('history');
    }
  };

  const handleCreateVisit = () => {
    setCurrentScreen('create');
  };

  const handleCreateTask = () => {
    setCurrentScreen('createTask');
  };

  const handleBackToObjects = () => {
    const savedObjects = localStorage.getItem('mchs_objects');
    if (savedObjects) {
      setObjects(JSON.parse(savedObjects));
    }
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

    try {
      const newVisit: Visit = {
        ...visit,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };

      const updatedObjects = objects.map(obj => 
        obj.id === selectedObject.id
          ? { ...obj, visits: [...obj.visits, newVisit] }
          : obj
      );

      updateObjects(updatedObjects);

      setSelectedObject(prev => 
        prev ? { ...prev, visits: [...prev.visits, newVisit] } : null
      );

      setCurrentScreen('history');
    } catch (error) {
      console.error('Save visit error:', error);
      alert('Ошибка сохранения посещения. Попробуйте еще раз.');
    }
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
          userRole={userRole}
          userName={userName}
          onBack={handleBackToObjects}
          onCreateVisit={handleCreateVisit}
          onCreateTask={handleCreateTask}
          onUpdateObject={(updatedObject) => {
            console.log('ObjectHistoryScreen onUpdateObject called with:', updatedObject);
            const updatedObjects = objects.map(obj => 
              obj.id === updatedObject.id ? updatedObject : obj
            );
            console.log('Calling updateObjects with updated list');
            updateObjects(updatedObjects);
            setSelectedObject(updatedObject);
            console.log('setSelectedObject called with updated object');
          }}
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
      
      {currentScreen === 'createTask' && selectedObject && (
        <CreateTaskScreen 
          object={selectedObject}
          userName={userName}
          onBack={handleBackToHistory}
          onSave={(updatedObject) => {
            const updatedObjects = objects.map(obj => 
              obj.id === updatedObject.id ? updatedObject : obj
            );
            updateObjects(updatedObjects);
            setSelectedObject(updatedObject);
          }}
        />
      )}
      
      {currentScreen === 'installation' && selectedObject && (
        <InstallationObjectScreen 
          object={selectedObject}
          userName={userName}
          onBack={handleBackToObjects}
          onUpdateObject={(updatedObject) => {
            const updatedObjects = objects.map(obj => 
              obj.id === updatedObject.id ? updatedObject : obj
            );
            updateObjects(updatedObjects);
            setSelectedObject(updatedObject);
          }}
        />
      )}
      
      {currentScreen === 'director' && (
        <DirectorPanel 
          objects={objects}
          users={users}
          onBack={handleBackToObjects}
          onUpdateUsers={setUsers}
          onUpdateObjects={updateObjects}
        />
      )}
    </div>
  );
}

export default Index;