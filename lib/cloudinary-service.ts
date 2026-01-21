/**
 * Cloudinary Service
 * Handles direct video uploads to Cloudinary from the client-side
 * Uses unsigned upload presets for secure browser-based uploads
 */

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  bytes: number;
  duration?: number;
  format?: string;
  width?: number;
  height?: number;
  [key: string]: any;
}

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  folder: string;
}

/**
 * Uploads a video file directly to Cloudinary
 * @param file - The video file to upload
 * @param config - Cloudinary configuration (cloud name, preset, folder)
 * @returns Promise<CloudinaryUploadResult> - Upload result with metadata
 */
export async function uploadVideoToCloudinary(
  file: File, 
  config: CloudinaryConfig
): Promise<CloudinaryUploadResult> {
  
  // Validate configuration
  if (!config.cloudName) {
    throw new Error('Cloudinary cloud name is required');
  }
  
  if (!config.uploadPreset) {
    throw new Error('Cloudinary upload preset is required');
  }

  // Prepare form data for Cloudinary API
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', config.uploadPreset);
  formData.append('resource_type', 'video');
  formData.append('folder', config.folder);

  console.log(`📤 Uploading ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB) to Cloudinary...`);

  // Make direct API call to Cloudinary
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/video/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  // Handle upload errors
  if (!response.ok) {
    const errorData = await response.json();
    console.error('❌ Cloudinary upload failed:', errorData);
    throw new Error(`Cloudinary upload failed: ${errorData.error?.message || 'Unknown error'}`);
  }

  // Parse successful response
  const result = await response.json();
  console.log('✅ Cloudinary upload successful:', result.public_id);
  
  return result as CloudinaryUploadResult;
}

/**
 * Gets Cloudinary configuration from environment variables
 * @returns CloudinaryConfig - Configuration object
 */
export function getCloudinaryConfig(): CloudinaryConfig {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  if (!cloudName) {
    throw new Error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME environment variable is not set');
  }

  return {
    cloudName,
    uploadPreset: 'cloudnary-saas', // Your upload preset name
    folder: 'video' // Your folder name
  };
}