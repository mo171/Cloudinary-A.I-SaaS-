/**
 * Upload Utilities
 * Helper functions for file validation and upload progress management
 */

/**
 * File size constants
 */
export const FILE_SIZE_LIMITS = {
  MAX_VIDEO_SIZE: 70 * 1024 * 1024, // 70MB in bytes
} as const;

/**
 * Upload progress states
 */
export const UPLOAD_STATES = {
  IDLE: '',
  UPLOADING_TO_CLOUDINARY: 'Uploading to Cloudinary...',
  SAVING_TO_DATABASE: 'Saving to database...',
  COMPLETE: 'Upload complete!',
  ERROR: 'Upload failed. Please try again.',
} as const;

/**
 * Validates a video file before upload
 * @param file - The file to validate
 * @throws Error if file is invalid
 */
export function validateVideoFile(file: File | null): void {
  // Check if file exists
  if (!file) {
    throw new Error('Please select a video file');
  }

  // Check file size
  if (file.size > FILE_SIZE_LIMITS.MAX_VIDEO_SIZE) {
    const maxSizeMB = FILE_SIZE_LIMITS.MAX_VIDEO_SIZE / 1024 / 1024;
    throw new Error(`File size should be less than ${maxSizeMB}MB`);
  }

  // Check if it's a video file
  if (!file.type.startsWith('video/')) {
    throw new Error('Please select a valid video file');
  }

  console.log(`📹 File validated: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
}

/**
 * Formats file size for display
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Formats duration for display
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (MM:SS)
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}