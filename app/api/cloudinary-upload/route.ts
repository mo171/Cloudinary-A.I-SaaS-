import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure route handler
export const maxDuration = 300; // 5 minutes for large uploads
export const dynamic = 'force-dynamic';

// Configuration
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

interface CloudinaryUploadResult {
    public_id: string;
    bytes: number;
    duration?: number;
    secure_url: string;
    [key: string]: any;
}

export async function POST(request: NextRequest) {
    try {
        console.log("=== CLOUDINARY UPLOAD API ===");
        
        // Check credentials
        if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 
            !process.env.CLOUDINARY_API_KEY || 
            !process.env.CLOUDINARY_API_SECRET) {
            return NextResponse.json({
                error: "Cloudinary credentials not configured"
            }, {status: 500});
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({
                error: "No file provided"
            }, {status: 400});
        }

        console.log(`Uploading file: ${file.name}, size: ${file.size} bytes`);

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
            const upload = cloudinary.uploader.upload_stream(
                {
                    resource_type: "video",
                    folder: "video-uploads",
                    transformation: [
                        { quality: "auto", fetch_format: "mp4" },
                    ],
                },
                (error, result) => {
                    if (error) {
                        console.error("Cloudinary upload error:", error);
                        return reject(error);
                    }
                    console.log("Cloudinary upload successful:", result?.public_id);
                    resolve(result as CloudinaryUploadResult);
                }
            );

            upload.end(buffer);
        });

        return NextResponse.json({
            success: true,
            result: {
                public_id: result.public_id,
                bytes: result.bytes,
                duration: result.duration || 0,
                secure_url: result.secure_url
            }
        });

    } catch (error) {
        console.error("Cloudinary upload failed:", error);
        return NextResponse.json({
            error: "Upload failed",
            details: (error as Error)?.message || "Unknown error"
        }, {status: 500});
    }
}