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
    console.log('Download: Response text length', text.length);
    
    const result = JSON.parse(text);
    console.log('Download: Parsed result', result.status, result.data);
    
    if (result.status === 'success' && result.data) {
      const objects = result.data.objects || [];
      const users = result.data.users || [];
      
      console.log('Download: Saving to localStorage', objects.length, 'objects', users.length, 'users');
      localStorage.setItem('mchs_objects', JSON.stringify(objects));
      localStorage.setItem('mchs_users', JSON.stringify(users));
      localStorage.setItem('mchs_last_sync', new Date().toISOString());
      
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
    const totalObjects = objects.length;
    let uploadedPhotos = 0;
    
    for (let i = 0; i < totalObjects; i++) {
      const obj = objects[i];
      const progress = Math.round(((i + 1) / totalObjects) * 100);
      
      if (onProgress) {
        onProgress(i + 1, totalObjects, `Отправка ${i + 1} из ${totalObjects} (${progress}%)`);
      }
      
      const response = await fetch(SYNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync',
          objects: [obj],
          users: []
        })
      });

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