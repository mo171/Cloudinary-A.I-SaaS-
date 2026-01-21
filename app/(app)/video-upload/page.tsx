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
import axios from 'axios';

function page() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const router  = useRouter();

  // max file size of 70mb

  const MAX_FILE_SIZE = 70 * 1024 * 1024;

  const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!file) return;

     if(file.size > MAX_FILE_SIZE){
        //TODO: add notification
        alert("File size should be less than 70mb");
        return;
     }
     setIsUploading(true);
     const formData = new FormData();
     formData.append('file', file);
     formData.append('title', title);
     formData.append('description', description);
     formData.append('originalSize', file.size.toString());

     //TODO: upload file to prisma
     try {
        const response = await axios.post('/api/video-upload', formData);
         router.push("/")
     } catch (error) {
      
     }finally{
       setIsUploading(false);
     }

    };

  return (
 <div className=" mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">Upload Video</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">
                <span className="label-text">Title</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input input-bordered w-full"
                required
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text">Description</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="textarea textarea-bordered w-full"
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text">Video File</span>
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="file-input file-input-bordered w-full"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Upload Video"}
            </button>
          </form>
        </div>
      );
}

export default page;
