import { useState } from 'react';
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
  createdByRole?: 'technician' | 'director' | 'supervisor';
  createdAt: string;
  taskDescription?: string;
  taskRecipient?: 'technician' | 'director';
  taskCompleted?: boolean;
  taskCompletedBy?: string;
  taskCompletedAt?: string;
  smsNotifications?: SmsNotification[];
  deleted?: boolean;
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

  const updateUsers = async (newUsers: User[]) => {
    console.log('✅ updateUsers called with:', newUsers.length, 'users', newUsers);
    setUsers(newUsers);
    
    // Сохраняем на сервер автоматически
    try {
      console.log('🔄 Сохранение пользователей на сервер...');
      const payload = {
        action: 'sync',
        objects: [],
        users: newUsers
      };
      console.log('📤 Sending payload:', JSON.stringify(payload));
      
      const response = await fetch('https://functions.poehali.dev/b79c8b0e-36c3-4ab2-bb2b-123cec40662a', {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Пользователи сохранены:', result);
        
        // Сохраняем в localStorage
        localStorage.setItem('mchs_users', JSON.stringify(newUsers));
      } else {
        console.error('❌ Ошибка сохранения пользователей:', response.status);
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Ошибка сохранения пользователей:', error);
      console.warn('⚠️ Сохранение пользователей только локально (офлайн режим)');
      
      // В офлайн режиме сохраняем в localStorage
      try {
        localStorage.setItem('mchs_users', JSON.stringify(newUsers));
        console.log('✅ Пользователи сохранены локально (офлайн)');
      } catch (storageError) {
        console.error('❌ Ошибка сохранения пользователей в localStorage:', storageError);
        alert('❌ Не удалось сохранить пользователей. Освободите место в хранилище.');
      }
    }
  };

  const [objects, setObjects] = useState<SiteObject[]>([]);

  const updateObjects = (newObjects: SiteObject[]) => {
    console.log('✅ updateObjects called with:', newObjects.length, 'objects');
    setObjects(newObjects);
    localStorage.setItem('mchs_objects', JSON.stringify(newObjects));
  };

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
          userRole={userRole}
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
          onUpdateUsers={updateUsers}
          onUpdateObjects={updateObjects}
        />
      )}
    </div>
  );
}

export default Index;