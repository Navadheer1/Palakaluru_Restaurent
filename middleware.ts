import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { UserRole, ROLE_HOMES } from "@/lib/constants";

const VALID_ROLES: UserRole[] = ["admin", "manager", "cashier", "waiter", "kitchen", "delivery"];
const AUTH_CACHE_DURATION_MS = 5 * 60 * 1000; // 5-minute fast cache for peak restaurant speed

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Fast path: Skip static assets, internal APIs, and public digital menu routes
  const isStaticRoute =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".");
  const isApiRoute = pathname.startsWith("/api");
  const isPublicMenuRoute = pathname.startsWith("/menu") || pathname.startsWith("/m/");

  if (isStaticRoute || isApiRoute || isPublicMenuRoute) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  // Check if we have cached credentials in cookies
  const cachedRole = request.cookies.get("rms_user_role")?.value as UserRole | undefined;
  const cachedAuthTime = Number(request.cookies.get("rms_auth_timestamp")?.value || "0");
  const hasAuthToken = request.cookies.getAll().some(
    (c) => c.name.startsWith("sb-") && c.name.includes("-auth-token")
  );
  const isPrefetch =
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("next-router-prefetch") === "1" ||
    request.headers.get("x-middleware-prefetch") === "1";

  const isCacheValid =
    Boolean(cachedRole) &&
    VALID_ROLES.includes(cachedRole!) &&
    hasAuthToken &&
    (isPrefetch || Date.now() - cachedAuthTime < AUTH_CACHE_DURATION_MS);

  let userRole: UserRole | null = null;

  if (isCacheValid) {
    // Fast path: Reuse verified role directly, zero remote network calls!
    userRole = cachedRole!;
  } else {
    // Remote verification path
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Unauthenticated users
    if (!user) {
      response.cookies.delete("rms_user_role");
      response.cookies.delete("rms_auth_timestamp");

      if (!isAuthRoute) {
        const redirectUrl = new URL("/login", request.url);
        return NextResponse.redirect(redirectUrl);
      }
      return response;
    }

    // 2. Authenticated user: determine authoritative role
    if (cachedRole && VALID_ROLES.includes(cachedRole)) {
      userRole = cachedRole;
    } else {
      // Check user_metadata first for fast lookup
      const metaRole = user.user_metadata?.role as UserRole | undefined;
      if (metaRole && VALID_ROLES.includes(metaRole)) {
        userRole = metaRole;
      } else {
        // Query profile
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
          if (profile?.role && VALID_ROLES.includes(profile.role as UserRole)) {
            userRole = profile.role as UserRole;
          }
        } catch {
          // Fallback email parsing if DB query fails
        }

        if (!userRole) {
          const email = user.email || "";
          if (email.includes("waiter")) userRole = "waiter";
          else if (email.includes("kitchen")) userRole = "kitchen";
          else if (email.includes("cashier")) userRole = "cashier";
          else if (email.includes("manager")) userRole = "manager";
          else if (email.includes("delivery")) userRole = "delivery";
          else userRole = "admin";
        }
      }

      // Persist verified role cookie for subsequent requests
      response.cookies.set("rms_user_role", userRole, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
      });
    }

    // Update verified auth timestamp
    response.cookies.set("rms_auth_timestamp", Date.now().toString(), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 300,
    });
  }

  const roleHome = ROLE_HOMES[userRole!] || "/admin/dashboard";

  // 3. Authenticated user accessing auth routes or root '/'
  if (isAuthRoute || pathname === "/") {
    const redirectUrl = new URL(roleHome, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // 4. Role Namespace Guards (strict isolation)
  // Admin routes: ONLY admin
  if (pathname.startsWith("/admin") && userRole !== "admin") {
    return NextResponse.redirect(new URL(roleHome, request.url));
  }

  // Manager routes: manager or admin
  if (pathname.startsWith("/manager") && userRole !== "manager" && userRole !== "admin") {
    return NextResponse.redirect(new URL(roleHome, request.url));
  }

  // Cashier routes: cashier or admin
  if (pathname.startsWith("/cashier") && userRole !== "cashier" && userRole !== "admin") {
    return NextResponse.redirect(new URL(roleHome, request.url));
  }

  // Waiter routes: waiter or admin
  if (pathname.startsWith("/waiter") && userRole !== "waiter" && userRole !== "admin") {
    return NextResponse.redirect(new URL(roleHome, request.url));
  }

  // Kitchen routes: kitchen or admin
  if (pathname.startsWith("/kitchen") && userRole !== "kitchen" && userRole !== "admin") {
    return NextResponse.redirect(new URL(roleHome, request.url));
  }

  // Delivery routes: delivery or admin
  if (pathname.startsWith("/delivery") && userRole !== "delivery" && userRole !== "admin") {
    return NextResponse.redirect(new URL(roleHome, request.url));
  }

  // 5. Legacy Route Interception (e.g. /tables, /pos, /kot, /orders, /menu, etc.)
  const legacyRouteMap: Record<string, string> = {
    "/tables": userRole === "waiter" ? "/waiter/tables" : userRole === "manager" ? "/manager/tables" : "/admin/tables",
    "/orders": userRole === "waiter" ? "/waiter/orders" : userRole === "cashier" ? "/cashier/orders" : userRole === "manager" ? "/manager/orders" : "/admin/orders",
    "/pos": userRole === "cashier" ? "/cashier/pos" : "/admin/pos",
    "/kot": userRole === "waiter" ? "/waiter/kot" : userRole === "kitchen" ? "/kitchen/kot" : userRole === "cashier" ? "/cashier/kot" : "/admin/orders",
    "/bill-requests": userRole === "waiter" ? "/waiter/bill-requests" : userRole === "cashier" ? "/cashier/bills" : "/admin/tables",
    "/notifications": userRole === "waiter" ? "/waiter/notifications" : "/admin/dashboard",
    "/profile": `/${userRole}/profile`,
    "/menu": "/admin/menu",
    "/inventory": userRole === "manager" ? "/manager/inventory" : "/admin/inventory",
    "/purchases": userRole === "manager" ? "/manager/purchases" : "/admin/purchases",
    "/suppliers": userRole === "manager" ? "/manager/suppliers" : "/admin/suppliers",
    "/customers": "/admin/customers",
    "/staff": "/admin/staff",
    "/expenses": "/admin/expenses",
    "/reports": userRole === "manager" ? "/manager/reports" : "/admin/reports",
    "/digital-menu": "/admin/digital-menu",
    "/delivery": userRole === "delivery" ? "/delivery/dashboard" : "/admin/delivery",
    "/settings": "/admin/settings",
  };

  for (const [legacyPath, targetPath] of Object.entries(legacyRouteMap)) {
    if (pathname === legacyPath || pathname === `${legacyPath}/`) {
      return NextResponse.redirect(new URL(targetPath, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
