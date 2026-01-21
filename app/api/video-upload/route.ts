/**
 * Video Upload API Route
 * 
 * This API endpoint handles saving video metadata to the database after
 * the video has been successfully uploaded to Cloudinary from the client.
 * 
 * Flow:
 * 1. Receives JSON payload with video metadata from frontend
 * 2. Validates required fields (title, publicId, videoUrl)
 * 3. Saves video record to database via Prisma
 * 4. Returns success response with video details
 * 
 * Note: This endpoint does NOT handle file uploads - files are uploaded
 * directly to Cloudinary from the browser to avoid server file size limits.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// ===== ROUTE CONFIGURATION =====
export const maxDuration = 60; // 60 seconds timeout for database operations
export const dynamic = 'force-dynamic'; // Ensure dynamic rendering for API routes

// ===== TYPE DEFINITIONS =====

/**
 * Expected request payload structure
 */
interface VideoUploadRequest {
  title: string;
  description: string;
  publicId: string;        // Cloudinary public ID
  videoUrl: string;        // Cloudinary secure URL
  originalSize: string;    // Original file size in bytes
  compressedSize: string;  // Cloudinary processed size in bytes
  duration: number;        // Video duration in seconds
  format?: string;         // Video format (mp4, mov, etc.)
  width?: number;          // Video width in pixels
  height?: number;         // Video height in pixels
}

/**
 * API response structure
 */
interface VideoUploadResponse {
  success: boolean;
  video: {
    id: string;
    title: string;
    publicId: string;
    videoUrl: string;
    createdAt: Date;
  };
}

/**
 * Error response structure
 */
interface ErrorResponse {
  error: string;
  details?: string;
}

// ===== MAIN API HANDLER =====

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('📥 === VIDEO METADATA SAVE REQUEST ===');
    
    // ===== REQUEST PARSING PHASE =====
    let videoData: VideoUploadRequest;
    
    try {
      videoData = await request.json();
      console.log('✅ JSON payload parsed successfully');
      console.log('📊 Received data:', {
        title: videoData.title,
        publicId: videoData.publicId,
        originalSize: videoData.originalSize,
        duration: videoData.duration
      });
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError);
      return NextResponse.json<ErrorResponse>({
        error: "Invalid JSON payload", 
        details: parseError instanceof Error ? parseError.message : "Unknown parsing error"
      }, { status: 400 });
    }

    // ===== VALIDATION PHASE =====
    const { 
      title, 
      description, 
      publicId, 
      videoUrl, 
      originalSize, 
      compressedSize, 
      duration,
      format,
      width,
      height
    } = videoData;
    
    // Validate required fields
    const missingFields: string[] = [];
    if (!title?.trim()) missingFields.push('title');
    if (!publicId?.trim()) missingFields.push('publicId');
    if (!videoUrl?.trim()) missingFields.push('videoUrl');
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      return NextResponse.json<ErrorResponse>({
        error: `Missing required fields: ${missingFields.join(', ')}`
      }, { status: 400 });
    }

    // ===== LOGGING PHASE =====
    console.log('📝 Video metadata to save:');
    console.log('  📹 Title:', title);
    console.log('  🆔 Public ID:', publicId);
    console.log('  🔗 Video URL:', videoUrl);
    console.log('  📏 Original Size:', originalSize, 'bytes');
    console.log('  🗜️  Compressed Size:', compressedSize, 'bytes');
    console.log('  ⏱️  Duration:', duration, 'seconds');
    console.log('  🎬 Format:', format || 'unknown');
    console.log('  📐 Dimensions:', width && height ? `${width}x${height}` : 'unknown');

    // ===== DATABASE SAVE PHASE =====
    console.log('💾 Saving to database...');
    
    const video = await prisma.video.create({
      data: {
        title: title.trim(),
        description: description?.trim() || '',
        publicId: publicId.trim(),
        originalSize,
        compressedSize,
        duration: Number(duration) || 0,
      }
    });
    
    console.log('✅ Video saved successfully with ID:', video.id);

    // ===== SUCCESS RESPONSE =====
    const response: VideoUploadResponse = {
      success: true,
      video: {
        id: video.id,
        title: video.title,
        publicId: video.publicId,
        videoUrl: videoUrl, // Return the Cloudinary URL for frontend use
        createdAt: video.createdAt
      }
    };

    console.log('🎉 === VIDEO METADATA SAVE COMPLETED ===');
    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    // ===== ERROR HANDLING PHASE =====
    console.error('💥 === DATABASE SAVE ERROR ===');
    console.error('🔍 Error type:', error?.constructor?.name);
    console.error('📝 Error message:', (error as Error)?.message);
    console.error('🔧 Full error:', error);
    
    // Determine error type and appropriate response
    let statusCode = 500;
    let errorMessage = 'Failed to save video metadata';
    
    if (error instanceof Error) {
      // Handle specific Prisma errors
      if (error.message.includes('Unique constraint')) {
        statusCode = 409;
        errorMessage = 'Video with this public ID already exists';
      } else if (error.message.includes('Foreign key constraint')) {
        statusCode = 400;
        errorMessage = 'Invalid reference data provided';
      }
    }
    
    return NextResponse.json<ErrorResponse>({
      error: errorMessage,
      details: (error as Error)?.message || "Unknown database error"
    }, { status: statusCode });
  }
}