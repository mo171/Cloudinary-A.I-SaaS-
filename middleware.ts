import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/*
 * This function defines which routes are "public"
 * (accessible without logging in)
 */
const isPublicRoute = createRouteMatcher(["/signin", "/signup", "/", "/home"]);
const isPublicApiRoute = createRouteMatcher(["/api/videos"]);

/*
 * This is the main Clerk middleware that runs on every request.
 * It checks the user's authentication status and directs them accordingly.
 *
 * @param {auth} - Function to retrieve user authentication details (like userId)
 * @param {req} - The incoming request object (URL, headers, query params)
 * @returns {NextResponse} - Redirects, JSON errors, or allows the request to proceed
 */
export default clerkMiddleware((auth, req) => {
  // auth() returns an object containing the user's ID if they are logged in
  const { userId } = auth();

  // Get the current URL from the request can be accessed by req.url this gives url but sometimes gives error isleye new URL(req.url) use krte hai
  const currentUrl = new URL(req.url);

  // Check if the user is currently on the /home page
  const isHomePage = currentUrl.pathname === "/home";
  // Check if the current request is for an API route
  const isApiRequest = currentUrl.pathname.startsWith("/api");

  /*
   * LOGIC FOR LOGGED-IN USERS:
   * If the user is logged in (userId exists) AND they are trying to access a public page (like /signin)
   * AND that page is NOT the home page, send them to /home.
   * This prevents logged-in users from seeing the sign-in/sign-up pages again.
   */
  if (userId && isPublicRoute(currentUrl.pathname) && !isHomePage) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  // LOGIC FOR USERS NOT LOGGED IN:
  if (!userId) {
    /*
     * 1. Protection for regular Pages:
     * If they are NOT logged in and trying to access a page that is NOT public...
     */
    if (!isPublicApiRoute(req) && !isPublicRoute(req)) {
      // ...send them to the sign-in page.
      return NextResponse.redirect(new URL("/signin", req.url));
    }

    /*
     * 2. Protection for API routes:
     * If they are NOT logged in and trying to access an API route that is NOT public...
     */
    if (isApiRequest && !isPublicApiRoute(req)) {
      // ...return an error message instead of a redirect.
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // If none of the above rules applied, let the request proceed as normal
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
