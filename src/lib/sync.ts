/**
 * Универсальная библиотека синхронизации для всех ролей
 */

// Определяем URL API в зависимости от окружения
const SYNC_URL = import.meta.env.VITE_API_URL || '/api/sync';

// Тест доступности функции
async function testConnection(): Promise<boolean> {
  try {
    console.log('🔍 Testing connection to:', SYNC_URL);
    const response = await fetch(SYNC_URL, {
      method: 'OPTIONS',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Origin': window.location.origin
      }
    });
    console.log('✅ OPTIONS response:', response.status);
    return response.ok || response.status === 200;
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
}

export interface SyncResult {
  success: boolean;
  message: string;
  objectsCount?: number;
  error?: string;
}

/**
 * ЗАГРУЗКА данных С СЕРВЕРА (для всех ролей)
 */
export async function downloadFromServer(): Promise<SyncResult> {
  try {
    console.log('📥 Downloading from server...');
    const response = await fetch(SYNC_URL, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('📥 Download response:', response.status);

    if (!response.ok) {
      return {
        success: false,
        message: `Сервер вернул ошибку: ${response.status}`,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const text = await response.text();
    const result = JSON.parse(text);
    
    if (result.status === 'success' && result.data) {
      const objects = result.data.objects || [];
      const users = result.data.users || [];
      
      try {
        const objectsStr = JSON.stringify(objects);
        const usersStr = JSON.stringify(users);
        
        localStorage.setItem('mchs_objects', objectsStr);
        localStorage.setItem('mchs_users', usersStr);
        localStorage.setItem('mchs_last_sync', new Date().toISOString());
      } catch (storageError: any) {
        return {
          success: false,
          message: 'Не хватает памяти. Попробуйте удалить старые данные или фото.',
          error: `LocalStorage quota: ${storageError.message}`
        };
      }
      
      return {
        success: true,
        message: `Загружено ${objects.length} объектов`,
        objectsCount: objects.length
      };
    }
    
    return {
      success: false,
      message: 'Неверный формат ответа сервера',
      error: 'Invalid response format'
    };
  } catch (error: any) {
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') || error.message?.includes('Load failed')) {
      return {
        success: false,
        message: 'Ошибка сети. Проверьте интернет и попробуйте снова.',
        error: `Network: ${error.message}`
      };
    }
    
    return {
      success: false,
      message: `Ошибка: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * ОТПРАВКА данных НА СЕРВЕР (для всех ролей)
 */
export async function uploadToServer(
  objects: any[],
  onProgress?: (current: number, total: number, message: string) => void
): Promise<SyncResult> {
  try {
    console.log('🚀 uploadToServer started with', objects.length, 'objects');
    
    // ТЕСТ ПОДКЛЮЧЕНИЯ
    const isConnected = await testConnection();
    if (!isConnected) {
      return {
        success: false,
        message: 'Не удалось подключиться к серверу. Проверьте интернет.',
        error: 'Connection test failed'
      };
    }
    
    const totalObjects = objects.length;
    let uploadedPhotos = 0;
    
    for (let i = 0; i < totalObjects; i++) {
      const obj = objects[i];
      const progress = Math.round(((i + 1) / totalObjects) * 100);
      
      console.log(`📤 Sending object ${i + 1}/${totalObjects}:`, obj.name);
      
      if (onProgress) {
        onProgress(i + 1, totalObjects, `Отправка ${i + 1} из ${totalObjects} (${progress}%)`);
      }
      
      const requestBody = JSON.stringify({
        action: 'sync',
        objects: [obj],
        users: []
      });
      
      console.log('📦 Request body size:', (requestBody.length / 1024).toFixed(2), 'KB');
      
      const response = await fetch(SYNC_URL, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: requestBody
      });
      
      console.log('📨 Response status:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Ошибка на объекте "${obj.name || 'без имени'}": HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status !== 'success') {
        throw new Error(`Объект "${obj.name || 'без имени'}": ${result.error || 'Ошибка'}`);
      }
      
      uploadedPhotos += result.uploaded_photos || 0;
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    localStorage.setItem('mchs_last_sync', new Date().toISOString());
    
    return {
      success: true,
      message: `Отправлено ${totalObjects} объектов, ${uploadedPhotos} фото/видео`,
      objectsCount: totalObjects
    };
  } catch (error: any) {
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') || error.message?.includes('Load failed')) {
      return {
        success: false,
        message: 'Ошибка сети при отправке. Проверьте интернет.',
        error: `Network: ${error.message}`
      };
    }
    
    return {
      success: false,
      message: error.message || 'Ошибка синхронизации',
      error: error.message
    };
  }
}

/**
 * ПОЛНАЯ СИНХРОНИЗАЦИЯ: отправка + сброс кэша + загрузка
 */
export async function fullSync(
  objects: any[],
  onProgress?: (message: string) => void
): Promise<SyncResult> {
  // Шаг 1: Отправляем данные на сервер
  if (onProgress) onProgress('Отправка данных на сервер...');
  
  const uploadResult = await uploadToServer(objects, (current, total, message) => {
    if (onProgress) onProgress(message);
  });
  
  if (!uploadResult.success) {
    return uploadResult;
  }
  
  // Шаг 2: Сбрасываем кэш (очищаем localStorage)
  if (onProgress) onProgress('Очистка кэша...');
  
  try {
    localStorage.removeItem('mchs_objects');
    localStorage.removeItem('mchs_users');
    console.log('✅ Кэш очищен');
  } catch (error) {
    console.warn('⚠️ Ошибка очистки кэша:', error);
  }
  
  // Небольшая задержка для гарантии сброса
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Шаг 3: Загружаем обновлённые данные с сервера
  if (onProgress) onProgress('Загрузка обновлённых данных...');
  
  const downloadResult = await downloadFromServer();
  
  if (!downloadResult.success) {
    return {
      success: false,
      message: `Отправлено, но ошибка загрузки: ${downloadResult.message}`,
      error: downloadResult.error
    };
  }
  
  return {
    success: true,
    message: `Синхронизация завершена: ${downloadResult.objectsCount} объектов`,
    objectsCount: downloadResult.objectsCount
  };
}