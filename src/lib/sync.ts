/**
 * Универсальная библиотека синхронизации для всех ролей
 */

const SYNC_URL = 'https://functions.poehali.dev/b79c8b0e-36c3-4ab2-bb2b-123cec40662a';

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
    console.log('Download: Starting fetch from', SYNC_URL);
    
    const response = await fetch(SYNC_URL, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('Download: Response status', response.status);

    if (!response.ok) {
      console.error('Download: Response not OK', response.status, response.statusText);
      return {
        success: false,
        message: `Сервер вернул ошибку: ${response.status}`,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const text = await response.text();
    console.log('Download: Response text length', text.length, 'first 200 chars:', text.substring(0, 200));
    
    const result = JSON.parse(text);
    console.log('Download: Parsed result status:', result.status);
    console.log('Download: Objects count:', result.data?.objects?.length);
    console.log('Download: Users count:', result.data?.users?.length);
    
    if (result.status === 'success' && result.data) {
      const objects = result.data.objects || [];
      const users = result.data.users || [];
      
      console.log('Download: Saving to localStorage', objects.length, 'objects', users.length, 'users');
      
      try {
        const objectsStr = JSON.stringify(objects);
        const usersStr = JSON.stringify(users);
        console.log('Download: Serialized sizes:', objectsStr.length, 'bytes objects,', usersStr.length, 'bytes users');
        
        localStorage.setItem('mchs_objects', objectsStr);
        console.log('Download: Saved objects to localStorage');
        
        localStorage.setItem('mchs_users', usersStr);
        console.log('Download: Saved users to localStorage');
        
        localStorage.setItem('mchs_last_sync', new Date().toISOString());
        console.log('Download: Saved sync timestamp');
      } catch (storageError: any) {
        console.error('Download: LocalStorage error', storageError);
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
    
    console.error('Download: Invalid response format', result);
    return {
      success: false,
      message: 'Неверный формат ответа сервера',
      error: 'Invalid response format'
    };
  } catch (error: any) {
    console.error('Download: Exception', error);
    console.error('Download: Error name:', error.name);
    console.error('Download: Error message:', error.message);
    console.error('Download: Error stack:', error.stack);
    
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
    console.log('Upload: Starting upload of', objects.length, 'objects');
    const totalObjects = objects.length;
    let uploadedPhotos = 0;
    
    for (let i = 0; i < totalObjects; i++) {
      const obj = objects[i];
      const progress = Math.round(((i + 1) / totalObjects) * 100);
      
      console.log(`Upload: Object ${i + 1}/${totalObjects} (${progress}%):`, obj.name);
      
      if (onProgress) {
        onProgress(i + 1, totalObjects, `Отправка ${i + 1} из ${totalObjects} (${progress}%)`);
      }
      
      const payload = JSON.stringify({
        action: 'sync',
        objects: [obj],
        users: []
      });
      
      console.log(`Upload: Payload size for "${obj.name}":`, payload.length, 'bytes');
      
      const response = await fetch(SYNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });

      console.log(`Upload: Response status for "${obj.name}":`, response.status);

      if (!response.ok) {
        console.error(`Upload: Failed for "${obj.name}":`, response.status, response.statusText);
        throw new Error(`Ошибка на объекте "${obj.name || 'без имени'}": HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log(`Upload: Result for "${obj.name}":`, result.status, 'photos:', result.uploaded_photos);
      
      if (result.status !== 'success') {
        throw new Error(`Объект "${obj.name || 'без имени'}": ${result.error || 'Ошибка'}`);
      }
      
      uploadedPhotos += result.uploaded_photos || 0;
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    localStorage.setItem('mchs_last_sync', new Date().toISOString());
    console.log('Upload: Complete. Total photos:', uploadedPhotos);
    
    return {
      success: true,
      message: `Отправлено ${totalObjects} объектов, ${uploadedPhotos} фото/видео`,
      objectsCount: totalObjects
    };
  } catch (error: any) {
    console.error('Upload: Exception', error);
    console.error('Upload: Error name:', error.name);
    console.error('Upload: Error message:', error.message);
    
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
 * ПОЛНАЯ СИНХРОНИЗАЦИЯ: отправка + загрузка
 */
export async function fullSync(
  objects: any[],
  onProgress?: (message: string) => void
): Promise<SyncResult> {
  // Сначала отправляем данные на сервер
  if (onProgress) onProgress('Отправка данных на сервер...');
  
  const uploadResult = await uploadToServer(objects, (current, total, message) => {
    if (onProgress) onProgress(message);
  });
  
  if (!uploadResult.success) {
    return uploadResult;
  }
  
  // Потом скачиваем обновлённые данные
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