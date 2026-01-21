"use client";

/**
 * Video Upload Page Component
 * 
 * This component provides a complete video upload interface that:
 * 1. Validates video files on the client-side
 * 2. Uploads videos directly to Cloudinary (bypassing server file limits)
 * 3. Saves video metadata to the database via API
 * 4. Provides real-time upload progress feedback
 * 
 * Flow:
 * User selects file → Validation → Cloudinary upload → Database save → Redirect
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

// Import modular services
import { 
  uploadVideoToCloudinary, 
  getCloudinaryConfig,
  type CloudinaryUploadResult 
} from '@/lib/cloudinary-service';
import { 
  saveVideoMetadata, 
  validateVideoMetadata,
  type VideoMetadata 
} from '@/lib/video-api-service';
import { 
  validateVideoFile, 
  UPLOAD_STATES, 
  formatFileSize 
} from '@/lib/upload-utils';

/**
 * Component state interface
 */
interface UploadState {
  file: File | null;
  title: string;
  description: string;
  isUploading: boolean;
  uploadProgress: string;
}

export default function VideoUploadPage() {
  // ===== STATE MANAGEMENT =====
  const [state, setState] = useState<UploadState>({
    file: null,
    title: '',
    description: '',
    isUploading: false,
    uploadProgress: UPLOAD_STATES.IDLE,
  });

  const router = useRouter();

  // ===== FORM HANDLERS =====
  
  /**
   * Handles file selection and basic validation
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    
    if (selectedFile) {
      try {
        validateVideoFile(selectedFile);
        setState(prev => ({ ...prev, file: selectedFile }));
        console.log(`📁 File selected: ${selectedFile.name} (${formatFileSize(selectedFile.size)})`);
      } catch (error) {
        alert((error as Error).message);
        e.target.value = ''; // Clear the input
      }
    } else {
      setState(prev => ({ ...prev, file: null }));
    }
  };

  /**
   * Handles form input changes
   */
  const handleInputChange = (field: 'title' | 'description') => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setState(prev => ({ ...prev, [field]: e.target.value }));
  };

  // ===== UPLOAD LOGIC =====

  /**
   * Main upload handler - orchestrates the entire upload process
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // === VALIDATION PHASE ===
      validateVideoFile(state.file);
      
      if (!state.title.trim()) {
        throw new Error('Please enter a video title');
      }

      // === UPLOAD INITIALIZATION ===
      setState(prev => ({ 
        ...prev, 
        isUploading: true, 
        uploadProgress: UPLOAD_STATES.UPLOADING_TO_CLOUDINARY 
      }));

      console.log('🚀 Starting video upload process...');

      // === CLOUDINARY UPLOAD PHASE ===
      const cloudinaryConfig = getCloudinaryConfig();
      const cloudinaryResult: CloudinaryUploadResult = await uploadVideoToCloudinary(
        state.file!,
        cloudinaryConfig
      );

      // === DATABASE SAVE PHASE ===
      setState(prev => ({ 
        ...prev, 
        uploadProgress: UPLOAD_STATES.SAVING_TO_DATABASE 
      }));

      // Prepare metadata for database
      const videoMetadata: VideoMetadata = {
        title: state.title.trim(),
        description: state.description.trim(),
        publicId: cloudinaryResult.public_id,
        videoUrl: cloudinaryResult.secure_url,
        originalSize: state.file!.size.toString(),
        compressedSize: cloudinaryResult.bytes.toString(),
        duration: cloudinaryResult.duration || 0,
        format: cloudinaryResult.format,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
      };

      // Validate and save metadata
      validateVideoMetadata(videoMetadata);
      const apiResponse = await saveVideoMetadata(videoMetadata);

      // === SUCCESS PHASE ===
      setState(prev => ({ 
        ...prev, 
        uploadProgress: UPLOAD_STATES.COMPLETE 
      }));

      console.log('🎉 Upload process completed successfully!');
      console.log('📊 Final result:', {
        videoId: apiResponse.video.id,
        cloudinaryUrl: apiResponse.video.videoUrl,
        title: apiResponse.video.title
      });

      // Redirect to home page after successful upload
      setTimeout(() => {
        router.push('/');
      }, 1000);

    } catch (error) {
      // === ERROR HANDLING ===
      console.error('💥 Upload failed:', error);
      
      setState(prev => ({ 
        ...prev, 
        uploadProgress: UPLOAD_STATES.ERROR 
      }));

      // Show user-friendly error message
      const errorMessage = (error as Error).message || 'An unexpected error occurred';
      alert(`Upload failed: ${errorMessage}`);

      // Reset progress after showing error
      setTimeout(() => {
        setState(prev => ({ 
          ...prev, 
          uploadProgress: UPLOAD_STATES.IDLE 
        }));
      }, 3000);

    } finally {
      // === CLEANUP PHASE ===
      setState(prev => ({ ...prev, isUploading: false }));
    }
  };

  // ===== RENDER COMPONENT =====
  return (
    <div className="mx-auto p-4 max-w-2xl">
      {/* === PAGE HEADER === */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Upload Video</h1>
        <p className="text-gray-600">
          Upload your video to Cloudinary and save it to your library
        </p>
      </div>

      {/* === UPLOAD FORM === */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* === VIDEO TITLE INPUT === */}
        <div>
          <label className="label">
            <span className="label-text font-medium">Video Title *</span>
          </label>
          <input
            type="text"
            value={state.title}
            onChange={handleInputChange('title')}
            className="input input-bordered w-full"
            placeholder="Enter a descriptive title for your video"
            required
            disabled={state.isUploading}
          />
        </div>

        {/* === VIDEO DESCRIPTION INPUT === */}
        <div>
          <label className="label">
            <span className="label-text font-medium">Description</span>
          </label>
          <textarea
            value={state.description}
            onChange={handleInputChange('description')}
            className="textarea textarea-bordered w-full h-24"
            placeholder="Optional description for your video"
            disabled={state.isUploading}
          />
        </div>

        {/* === FILE UPLOAD INPUT === */}
        <div>
          <label className="label">
            <span className="label-text font-medium">Video File *</span>
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="file-input file-input-bordered w-full"
            required
            disabled={state.isUploading}
          />
          <div className="label">
            <span className="label-text-alt text-gray-500">
              Maximum file size: 70MB. Supported formats: MP4, MOV, AVI, MKV, WebM
            </span>
          </div>
          
          {/* === FILE INFO DISPLAY === */}
          {state.file && (
            <div className="mt-2 p-3 bg-base-200 rounded-lg">
              <div className="text-sm">
                <div><strong>File:</strong> {state.file.name}</div>
                <div><strong>Size:</strong> {formatFileSize(state.file.size)}</div>
                <div><strong>Type:</strong> {state.file.type}</div>
              </div>
            </div>
          )}
        </div>

        {/* === UPLOAD PROGRESS INDICATOR === */}
        {state.isUploading && (
          <div className="bg-base-200 p-4 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <div className="loading loading-spinner loading-sm"></div>
              <span className="text-sm font-medium">{state.uploadProgress}</span>
            </div>
            <progress className="progress progress-primary w-full"></progress>
          </div>
        )}

        {/* === SUBMIT BUTTON === */}
        <button
          type="submit"
          className={`btn btn-primary w-full ${state.isUploading ? 'loading' : ''}`}
          disabled={state.isUploading || !state.file || !state.title.trim()}
        >
          {state.isUploading ? 'Uploading...' : 'Upload Video'}
        </button>
      </form>

      {/* === UPLOAD INSTRUCTIONS === */}
      <div className="mt-8 p-4 bg-info/10 rounded-lg">
        <h3 className="font-semibold mb-2">How it works:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
          <li>Select a video file (up to 70MB)</li>
          <li>Enter a title and optional description</li>
          <li>Click upload - your video goes directly to Cloudinary</li>
          <li>Video metadata is saved to your database</li>
          <li>You'll be redirected to view your uploaded videos</li>
        </ol>
      </div>
    </div>
  );
}