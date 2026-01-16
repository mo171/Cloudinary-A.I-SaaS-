/*
 * API Route: Fetch All Videos
 * This route handles GET requests to retrieve a list of all videos from the database.
 *
 * @used_in: Client-side components or pages that need to display a video list.
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/*
 * GET handler for the /api/videos endpoint.
 *
 * @param {NextRequest} request - The incoming HTTP request.
 * @returns {NextResponse} - A JSON response with the list of videos OR an error message.
 * @logic:
 * 1. Attempts to query the 'Video' table in the database.
 * 2. Orders the results by 'createdAt' (newest first).
 * 3. Returns the array of videos as JSON if successful.
 * 4. Catches errors and returns a 500 status code if something goes wrong.
 * 5. Ensures the database connection is closed after the operation is finished.
 */
export async function GET(request: NextRequest) {
  try {
    const videos = await prisma.video.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(videos);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    // Clean up the connection
    await prisma.$disconnect();
  }
}
