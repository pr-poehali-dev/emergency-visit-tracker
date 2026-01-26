import { useState, useEffect } from 'react';
import LoginScreen from '@/components/LoginScreen';
import ObjectsListScreen from '@/components/ObjectsListScreen';
import ObjectHistoryScreen from '@/components/ObjectHistoryScreen';
import CreateVisitScreen from '@/components/CreateVisitScreen';
import CreateTaskScreen from '@/components/CreateTaskScreen';
import InstallationObjectScreen from '@/components/InstallationObjectScreen';
import DirectorPanel from '@/components/DirectorPanel';
import SyncButton from '@/components/SyncButton';

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

  const getInitialObjects = (): SiteObject[] => {
    const saved = localStorage.getItem('mchs_objects');
    if (saved) {
      return JSON.parse(saved);
    }
    return [];
  };

  const [objects, setObjects] = useState<SiteObject[]>(getInitialObjects);

  // АВТОЗАГРУЗКА данных с сервера при первом запуске
  useEffect(() => {
    const autoLoad = async () => {
      console.log('🔄 Автозагрузка данных с сервера...');
      try {
        const response = await fetch('https://functions.poehali.dev/b79c8b0e-36c3-4ab2-bb2b-123cec40662a', {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('📦 Server response:', result);
          
          if (result.status === 'success' && result.data) {
            const serverObjects = result.data.objects || [];
            const serverUsers = result.data.users || [];
            
            console.log('✅ Загружено с сервера:', serverObjects.length, 'объектов');
            console.log('👥 Пользователей с сервера:', serverUsers.length);
            if (serverObjects[0]) console.log('📊 Пример объекта:', serverObjects[0]);
            
            // Всегда загружаем пользователей (даже если объектов нет)
            if (serverUsers.length > 0) {
              setUsers(serverUsers);
              localStorage.setItem('mchs_users', JSON.stringify(serverUsers));
              console.log('✅ Пользователи обновлены в localStorage');
            }
            
            // Загружаем объекты если есть
            if (serverObjects.length > 0) {
              setObjects(serverObjects);
              localStorage.setItem('mchs_objects', JSON.stringify(serverObjects));
              console.log('✅ Объекты обновлены в localStorage');
            } else {
              console.log('⚠️ На сервере нет объектов, используем локальные если есть');
            }
          }
        }
      } catch (error) {
        console.error('❌ Ошибка автозагрузки:', error);
      }
    };
    
    autoLoad();
  }, []);

  const updateObjects = async (newObjects: SiteObject[]) => {
    console.log('✅ updateObjects called with:', newObjects.length, 'objects');
    setObjects(newObjects);
    
    // Находим изменённые объекты (сравниваем с текущим состоянием)
    const changedObjects = newObjects.filter(newObj => {
      const oldObj = objects.find(o => o.id === newObj.id);
      if (!oldObj) return true; // Новый объект
      return JSON.stringify(oldObj) !== JSON.stringify(newObj); // Изменён
    });
    
    if (changedObjects.length === 0) {
      console.log('⏭️ Нет изменений, пропускаем сохранение');
      return;
    }
    
    console.log('🔄 Сохраняем', changedObjects.length, 'изменённых объектов');
    
    // Сохраняем только изменённые объекты на сервер
    try {
      const response = await fetch('https://functions.poehali.dev/b79c8b0e-36c3-4ab2-bb2b-123cec40662a', {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync',
          objects: changedObjects,
          users: []
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Автосохранение успешно:', result);
        
        // Сохраняем в localStorage только если не переполнен
        try {
          localStorage.setItem('mchs_objects', JSON.stringify(newObjects));
        } catch (storageError) {
          console.warn('⚠️ LocalStorage переполнен, но данные сохранены на сервере');
        }
      } else {
        console.error('❌ Ошибка автосохранения:', response.status);
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Ошибка автосохранения:', error);
      console.warn('⚠️ Сохранение только локально (офлайн режим)');
      
      // В офлайн режиме сохраняем в localStorage
      try {
        localStorage.setItem('mchs_objects', JSON.stringify(newObjects));
        console.log('✅ Данные сохранены локально (офлайн)');
      } catch (storageError) {
        console.error('❌ Ошибка сохранения в localStorage:', storageError);
        alert('❌ Не удалось сохранить данные. Освободите место в хранилище.');
      }
    }
  };

  // Удалён автоматический useEffect для localStorage - теперь сохранение идёт через updateObjects на сервер

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

  const handleSync = async () => {
    console.log('🔄 Ручная синхронизация...');
    try {
      const response = await fetch('https://functions.poehali.dev/b79c8b0e-36c3-4ab2-bb2b-123cec40662a', {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.status === 'success' && result.data) {
          const serverObjects = result.data.objects || [];
          const serverUsers = result.data.users || [];
          
          setObjects(serverObjects);
          setUsers(serverUsers);
          
          // Обновляем выбранный объект если он открыт
          if (selectedObject) {
            const updatedSelectedObject = serverObjects.find(obj => obj.id === selectedObject.id);
            if (updatedSelectedObject) {
              setSelectedObject(updatedSelectedObject);
            }
          }
          
          localStorage.setItem('mchs_objects', JSON.stringify(serverObjects));
          localStorage.setItem('mchs_users', JSON.stringify(serverUsers));
          
          console.log('✅ Синхронизация завершена:', serverObjects.length, 'объектов,', serverUsers.length, 'пользователей');
          alert('✅ Данные синхронизированы с сервером');
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Ошибка синхронизации:', error);
      alert('❌ Не удалось синхронизировать. Проверьте подключение к интернету.');
    }
  };

  const handleSaveVisit = async (visit: Omit<Visit, 'id' | 'createdAt'>) => {
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

      await updateObjects(updatedObjects);

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
          onSync={handleSync}
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
          onSync={handleSync}
          onUpdateObject={async (updatedObject) => {
            console.log('ObjectHistoryScreen onUpdateObject called with:', updatedObject);
            const updatedObjects = objects.map(obj => 
              obj.id === updatedObject.id ? updatedObject : obj
            );
            console.log('Calling updateObjects with updated list');
            await updateObjects(updatedObjects);
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
          onSync={handleSync}
        />
      )}
      
      {currentScreen === 'createTask' && selectedObject && (
        <CreateTaskScreen 
          object={selectedObject}
          userName={userName}
          userRole={userRole}
          onBack={handleBackToHistory}
          onSync={handleSync}
          onSave={async (updatedObject) => {
            const updatedObjects = objects.map(obj => 
              obj.id === updatedObject.id ? updatedObject : obj
            );
            await updateObjects(updatedObjects);
            setSelectedObject(updatedObject);
          }}
        />
      )}
      
      {currentScreen === 'installation' && selectedObject && (
        <InstallationObjectScreen 
          object={selectedObject}
          userName={userName}
          onBack={handleBackToObjects}
          onUpdateObject={async (updatedObject) => {
            const updatedObjects = objects.map(obj => 
              obj.id === updatedObject.id ? updatedObject : obj
            );
            await updateObjects(updatedObjects);
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