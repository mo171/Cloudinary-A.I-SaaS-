import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// Configure route handler for larger payloads
export const maxDuration = 60; // 60 seconds timeout
export const dynamic = 'force-dynamic';

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

export async function POST(request: NextRequest) {
    try {
        console.log("=== VIDEO UPLOAD DEBUG ===")
        console.log("Content-Type:", request.headers.get('content-type'))
        console.log("Content-Length:", request.headers.get('content-length'))
        
        // Check if body is readable
        const bodyUsed = request.bodyUsed;
        console.log("Body used:", bodyUsed)
        
        if (bodyUsed) {
            console.error("Request body already consumed!")
            return NextResponse.json({error: "Request body already consumed"}, {status: 400})
        }

        // Try to get body size first
        try {
            const contentLength = request.headers.get('content-length');
            if (contentLength) {
                const size = parseInt(contentLength);
                console.log("Request size:", size, "bytes", (size / 1024 / 1024).toFixed(2), "MB");
                
                // Check if size is too large (Next.js default is 1MB for API routes)
                if (size > 50 * 1024 * 1024) { // 50MB limit
                    return NextResponse.json({error: "File too large"}, {status: 413})
                }
            }
        } catch (sizeError) {
            console.log("Could not determine request size:", sizeError)
        }

        // Try FormData parsing with timeout
        console.log("Attempting FormData parsing...")
        let formData: FormData;
        try {
            formData = await request.formData();
            console.log("FormData parsed successfully!")
        } catch (parseError) {
            console.error("FormData parsing failed:", parseError);
            return NextResponse.json({
                error: "Failed to parse form data", 
                details: parseError instanceof Error ? parseError.message : "Unknown parsing error"
            }, {status: 400});
        }
        
        // Log all form fields
        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                console.log(`Field ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`)
            } else {
                console.log(`Field ${key}: ${value}`)
            }
        }

        const file = formData.get("file") as File | null;
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const originalSize = formData.get("originalSize") as string;

        if(!file){
            console.error("No file provided in request")
            return NextResponse.json({error: "File not found"}, {status: 400})
        }

        // Check Cloudinary credentials
        if(
            !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET
        ){
            console.error("Missing Cloudinary credentials")
            return NextResponse.json({error: "Cloudinary credentials not found"}, {status: 500})
        }

        console.log(`Processing file: ${file.name}, size: ${file.size} bytes`)

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        console.log("Uploading to Cloudinary...")
        // const result = await new Promise<CloudinaryUploadResult>(
        //     (resolve, reject) => {
        //         const uploadStream = cloudinary.uploader.upload_stream(
        //             {
        //                 resource_type: "video",
        //                 folder: "video-uploads",
        //                 transformation: [
        //                     {quality: "auto", fetch_format: "mp4"},
        //                 ]
        //             },
        //             (error, result) => {
        //                 if(error) {
        //                     console.error("Cloudinary upload error:", error)
        //                     reject(error);
        //                 } else {
        //                     console.log("Cloudinary upload successful:", result?.public_id)
        //                     resolve(result as CloudinaryUploadResult);
        //                 }
        //             }
        //         )
        //         uploadStream.end(buffer)
        //     }
        // )

        console.log("Saving to database...")
        const video = await prisma.video.create({
            data: {
                title,
                description,
                publicId: result.public_id,
                originalSize: originalSize,
                compressedSize: String(result.bytes),
                duration: Number(result.duration) || 0,
            }
        })
        
        console.log("Video saved successfully:", video.id)
        return NextResponse.json(video)

    } catch (error) {
        console.error("=== UPLOAD ERROR ===")
        console.error("Error type:", error?.constructor?.name)
        console.error("Error message:", (error as Error)?.message)
        console.error("Full error:", error)
        return NextResponse.json({
            error: "Upload video failed", 
            details: (error as Error)?.message || "Unknown error"
        }, {status: 500})
    }
}