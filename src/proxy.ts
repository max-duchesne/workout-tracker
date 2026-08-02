import { auth } from "@/auth";

// Optimistic auth gate (Next.js 16 renamed Middleware → Proxy). This only
// redirects unauthenticated users to /login; the real enforcement is the DAL
// (`requireUserId`) and per-action checks, close to the data.
export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === "/login";

  if (!isLoggedIn && !isLoginPage) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
  if (isLoggedIn && isLoginPage) {
    return Response.redirect(new URL("/", req.nextUrl));
  }
});

export const config = {
  // Run on everything except API routes, Next internals, and static/PWA assets.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icon-.*\\.png|apple-icon.*|.*\\.png$).*)",
  ],
};
