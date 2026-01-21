import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { Buffer } from "node:buffer";


// Configuration
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View Credentials' below to copy your API secret
});

interface CloudinaryUploadResult {
    public_id: string;
    bytes: number;
    duration?: number
    [key: string]: any
}

export async function uploadVideoToCloudinary(videoFile: File) {
  const bytes = await videoFile.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return await new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",
        folder: "video-uploads",
        transformation: [
          { quality: "auto", fetch_format: "mp4" },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result as CloudinaryUploadResult);
      }
    );

    upload.end(buffer);
  });
}
