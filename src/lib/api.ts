const API_URL = 'https://functions.poehali.dev/89a43a62-4e01-4dc6-8bd6-e1352b43f588';
const UPLOAD_URL = 'https://functions.poehali.dev/9ab1b65a-a9d8-4b19-860d-fceeb4ccaca0';

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

async function apiCall<T>(action: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const url = `${API_URL}?action=${action}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Request failed' };
    }

    return { data };
  } catch (error) {
    console.error('API Error:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export const api = {
  async getObjects() {
    return apiCall<Array<{
      id: number;
      name: string;
      address: string;
      visits_count: number;
    }>>('objects');
  },

  async getObjectVisits(objectId: number) {
    return apiCall<Array<{
      id: number;
      date: string;
      type: 'planned' | 'unplanned';
      comment: string;
      photos: string[];
      created_by: string;
      created_at: string;
    }>>(`object_visits&object_id=${objectId}`);
  },

  async getStats() {
    return apiCall<{
      total_objects: number;
      total_visits: number;
      planned_visits: number;
      unplanned_visits: number;
      total_photos: number;
    }>('stats');
  },

  async login(username: string, password: string) {
    return apiCall<{
      user: {
        id: number;
        username: string;
        full_name: string;
        role: 'technician' | 'director';
      };
      token: string;
    }>('login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  async createVisit(data: {
    object_id: number;
    user_id: number;
    date: string;
    type: 'planned' | 'unplanned';
    comment: string;
    photos: string[];
    created_by: string;
  }) {
    return apiCall<{ visit_id: number; message: string }>('create_visit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async createObject(data: { name: string; address: string }) {
    return apiCall<{ object_id: number; message: string }>('create_object', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateObject(data: { id: number; name: string; address: string }) {
    return apiCall<{ message: string }>('update_object', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async uploadPhoto(photoBase64: string, type: 'jpg' | 'png' = 'jpg'): Promise<ApiResponse<{ photo_url: string; message: string }>> {
    try {
      const response = await fetch(UPLOAD_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photo: photoBase64,
          type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Upload failed' };
      }

      return { data };
    } catch (error) {
      console.error('Upload Error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};