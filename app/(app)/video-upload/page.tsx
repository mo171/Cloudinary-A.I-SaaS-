"use client";
/*
 * Video Upload Page Component
 * This page provides an interface for users to upload new videos to Cloudinary.
 *
 * @returns {JSX.Element} - The rendered Video Upload page UI.
 * @used_in: Automatically rendered by Next.js at the '/video-upload' route.
 */
import React, { useState } from 'react'
import { useRouter } from 'next/navigation';

function page() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const router = useRouter();

  // max file size of 70mb
  const MAX_FILE_SIZE = 70 * 1024 * 1024;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert("File size should be less than 70mb");
      return;
    }

    setIsUploading(true);
    setUploadProgress('Uploading to Cloudinary...');

    try {
      // Step 1: Upload directly to Cloudinary using their API
      console.log('Starting direct Cloudinary upload...');

      const formData = new FormData();
      formData.append('file', file);
      // formData.append('upload_preset', 'cloudnary-saas'); // Updated to your actual preset name
      formData.append('resource_type', 'video');
      // formData.append('folder', 'video'); // Updated to your actual folder name
      formData.append('upload_preset', 'cloudnary-saas'); // ✅ Your actual preset
      formData.append('folder', 'video'); // ✅ Your actual folder
      
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

      if (!cloudName) {
        throw new Error('Cloudinary cloud name not configured');
      }

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      console.log('Cloudinary response status:', cloudinaryResponse.status); // Debug log

      if (!cloudinaryResponse.ok) {
        const errorData = await cloudinaryResponse.json();
        console.error('Cloudinary error details:', errorData); // Debug log
        throw new Error(`Cloudinary upload failed: ${errorData.error?.message || 'Unknown error'}`);
      }

      const cloudinaryResult = await cloudinaryResponse.json();
      console.log('Cloudinary upload successful:', cloudinaryResult);

      setUploadProgress('Saving to database...');

      // Step 2: Send video metadata including URL to your API route
      const response = await fetch('/api/video-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          publicId: cloudinaryResult.public_id,
          videoUrl: cloudinaryResult.secure_url,
          originalSize: file.size.toString(),
          compressedSize: cloudinaryResult.bytes.toString(),
          duration: cloudinaryResult.duration || 0,
          format: cloudinaryResult.format,
          width: cloudinaryResult.width,
          height: cloudinaryResult.height,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Database save successful:', result);

      setUploadProgress('Upload complete!');
      router.push("/");
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
      setUploadProgress('');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className= "mx-auto p-4" >
    <h1 className="text-2xl font-bold mb-4" > Upload Video </h1>
      < form onSubmit = { handleSubmit } className = "space-y-4" >
        <div>
        <label className="label" >
          <span className="label-text" > Title </span>
            </label>
            < input
  type = "text"
  value = { title }
  onChange = {(e) => setTitle(e.target.value)
}
className = "input input-bordered w-full"
required
  />
  </div>
  < div >
  <label className="label" >
    <span className="label-text" > Description </span>
      </label>
      < textarea
value = { description }
onChange = {(e) => setDescription(e.target.value)}
className = "textarea textarea-bordered w-full"
  />
  </div>
  < div >
  <label className="label" >
    <span className="label-text" > Video File </span>
      </label>
      < input
type = "file"
accept = "video/*"
onChange = {(e) => setFile(e.target.files?.[0] || null)}
className = "file-input file-input-bordered w-full"
required
  />
  </div>

{
  isUploading && (
    <div className="mt-4" >
      <div className="text-sm text-gray-600 mb-2" > { uploadProgress } </div>
        < progress className = "progress progress-primary w-full" > </progress>
          </div>
        )
}

<button
          type="submit"
className = "btn btn-primary"
disabled = { isUploading }
  >
  { isUploading? "Uploading...": "Upload Video" }
  </button>
  </form>
  </div>
  );
}

export default page;