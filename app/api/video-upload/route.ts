import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// Configure route handler
export const maxDuration = 60; // 60 seconds timeout
export const dynamic = 'force-dynamic';

interface VideoUploadData {
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

export async function POST(request: NextRequest) {
    try {
        console.log("=== VIDEO METADATA SAVE ===")
        
        // Parse JSON body
        let videoData: VideoUploadData;
        try {
            videoData = await request.json();
            console.log("JSON parsed successfully:", videoData);
        } catch (parseError) {
            console.error("JSON parsing failed:", parseError);
            return NextResponse.json({
                error: "Failed to parse JSON data", 
                details: parseError instanceof Error ? parseError.message : "Unknown parsing error"
            }, {status: 400});
        }

        // Validate required fields
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
        
        if (!title || !publicId || !videoUrl) {
            return NextResponse.json({
                error: "Missing required fields: title, publicId, and videoUrl are required"
            }, {status: 400});
        }

        console.log("Saving video metadata to database...");
        console.log("Public ID:", publicId);
        console.log("Video URL:", videoUrl);
        console.log("Title:", title);
        console.log("Original Size:", originalSize);
        console.log("Compressed Size:", compressedSize);
        console.log("Duration:", duration);
        console.log("Format:", format);
        console.log("Dimensions:", width, "x", height);

        // Save to database
        const video = await prisma.video.create({
            data: {
                title,
                description: description || '',
                publicId,
                originalSize,
                compressedSize,
                duration: Number(duration) || 0,
            }
        });
        
        console.log("Video saved successfully:", video.id);
        return NextResponse.json({
            success: true,
            video: {
                id: video.id,
                title: video.title,
                publicId: video.publicId,
                videoUrl: videoUrl, // Return the Cloudinary URL
                createdAt: video.createdAt
            }
        });

    } catch (error) {
        console.error("=== DATABASE SAVE ERROR ===");
        console.error("Error type:", error?.constructor?.name);
        console.error("Error message:", (error as Error)?.message);
        console.error("Full error:", error);
        
        return NextResponse.json({
            error: "Failed to save video metadata", 
            details: (error as Error)?.message || "Unknown database error"
        }, {status: 500});
    }
}