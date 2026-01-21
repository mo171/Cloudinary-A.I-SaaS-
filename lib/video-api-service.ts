/**
 * Video API Service
 * Handles communication with the video upload API endpoint
 * Sends video metadata to the server for database storage
 */

export interface VideoMetadata {
  title: string;
  description: string;
  publicId: string;
  videoUrl: string;
  originalSize: string;
  compressedSize: string;
  duration: number;
  format?: string;
  width?: number;
  height?: number;
}

export interface VideoApiResponse {
  success: boolean;
  video: {
    id: string;
    title: string;
    publicId: string;
    videoUrl: string;
    createdAt: string;
  };
}

/**
 * Saves video metadata to the database via API
 * @param metadata - Video metadata from Cloudinary upload
 * @returns Promise<VideoApiResponse> - API response with saved video data
 */
export async function saveVideoMetadata(metadata: VideoMetadata): Promise<VideoApiResponse> {
  console.log('💾 Saving video metadata to database...');
  
  // Make API call to save video metadata
  const response = await fetch('/api/video-upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  // Handle API errors
  if (!response.ok) {
    const errorData = await response.json();
    console.error('❌ Database save failed:', errorData);
    throw new Error(`Database save failed: ${errorData.error || 'Unknown error'}`);
  }

  // Parse successful response
  const result = await response.json();
  console.log('✅ Video metadata saved successfully:', result.video.id);
  
  return result as VideoApiResponse;
}

/**
 * Validates video metadata before sending to API
 * @param metadata - Video metadata to validate
 * @throws Error if required fields are missing
 */
export function validateVideoMetadata(metadata: Partial<VideoMetadata>): void {
  const requiredFields = ['title', 'publicId', 'videoUrl'];
  
  for (const field of requiredFields) {
    if (!metadata[field as keyof VideoMetadata]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
}