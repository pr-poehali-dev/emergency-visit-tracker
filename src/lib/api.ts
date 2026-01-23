export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

export const api = {
  async uploadPhoto(photoBase64: string, type: 'jpg' | 'png' = 'jpg'): Promise<ApiResponse<{ photo_url: string; message: string }>> {
    try {
      return { 
        data: { 
          photo_url: photoBase64,
          message: 'Photo stored locally' 
        } 
      };
    } catch (error) {
      console.error('Upload Error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};