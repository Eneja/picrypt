import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PREFIXES = ["/i/", "/api/cover/"];
const PUBLIC_API_PATHS = new Set(["/api/auth/signup"]);
const AUTH_ONLY_PATHS = new Set(["/pending", "/rejected"]);
const AUTH_ONLY_PREFIXES = ["/api/auth/"];

interface UserProfile {
  role: string;
  status: string;
}

function isPublicPath(pathname: string) {
  if (pathname.startsWith("/auth/")) {
    return true;
  }

  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isAuthOnlyPath(pathname: string) {
  if (AUTH_ONLY_PATHS.has(pathname)) {
    return true;
  }

  return AUTH_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function homePathForProfile(profile: UserProfile) {
  if (profile.status === "pending") {
    return "/pending";
  }

  if (profile.status === "rejected") {
    return "/rejected";
  }

  return "/";
}

function redirectForProfile(pathname: string, profile: UserProfile, request: NextRequest) {
  if (profile.status === "pending") {
    if (!isAuthOnlyPath(pathname) && pathname !== "/auth/signout") {
      return NextResponse.redirect(new URL("/pending", request.url));
    }
    return null;
  }

  if (profile.status === "rejected") {
    if (pathname !== "/rejected" && pathname !== "/auth/signout") {
      return NextResponse.redirect(new URL("/rejected", request.url));
    }
    return null;
  }

  if (profile.status === "approved") {
    if (pathname === "/pending" || pathname === "/rejected") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (profile.role !== "admin" || profile.status !== "approved") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (pathname.startsWith("/api/drops") && profile.status !== "approved") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return supabaseResponse;
  }

  if (pathname === "/login") {
    if (!user) {
      return supabaseResponse;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();

    const destination = profile ? homePathForProfile(profile) : "/pending";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (!user) {
    if (PUBLIC_API_PATHS.has(pathname)) {
      return supabaseResponse;
    }

    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (!profile) {
    if (pathname === "/pending" || pathname.startsWith("/api/auth/")) {
      return supabaseResponse;
    }

    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    return NextResponse.redirect(new URL("/pending", request.url));
  }

  const profileRedirect = redirectForProfile(pathname, profile, request);
  if (profileRedirect) {
    return profileRedirect;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
