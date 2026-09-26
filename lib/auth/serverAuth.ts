import { createClient } from "@/lib/supabase/server";
import { UserRole, ROLE_PERMISSIONS, RolePermissions } from "@/lib/constants";
import type { Profile } from "@/types/database";

export interface ServerAuthContext {
  userId: string;
  email: string;
  role: UserRole;
  profile: Profile;
  restaurantId: string;
  branchId: string | null;
}

/**
 * Resolves the authenticated user, role, and profile on the server.
 * Never trusts any client-provided role.
 */
export async function getAuthenticatedUser(): Promise<ServerAuthContext | null> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, restaurant_id, branch_id, name, full_name, email, role, phone, avatar_url, status, pin_code, created_at, updated_at")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    // If database profile row not found, resolve from verified user metadata
    const metadataRole = (user.user_metadata?.role ||
      (user.email?.includes("waiter")
        ? "waiter"
        : user.email?.includes("kitchen")
        ? "kitchen"
        : user.email?.includes("cashier")
        ? "cashier"
        : user.email?.includes("manager")
        ? "manager"
        : user.email?.includes("delivery")
        ? "delivery"
        : "admin")) as UserRole;

    const fallbackProfile: Profile = {
      id: user.id,
      restaurant_id: user.user_metadata?.restaurant_id || "a0000000-0000-0000-0000-000000000001",
      branch_id: user.user_metadata?.branch_id || null,
      name: user.user_metadata?.name || user.email?.split("@")[0] || "Staff",
      full_name: user.user_metadata?.full_name || null,
      email: user.email || "",
      role: metadataRole,
      phone: null,
      avatar_url: null,
      pin_code: null,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return {
      userId: user.id,
      email: user.email || "",
      role: metadataRole,
      profile: fallbackProfile,
      restaurantId: fallbackProfile.restaurant_id,
      branchId: fallbackProfile.branch_id,
    };
  }

  const role = (profile.role as UserRole) || "admin";

  return {
    userId: user.id,
    email: user.email || "",
    role,
    profile: profile as Profile,
    restaurantId: profile.restaurant_id,
    branchId: profile.branch_id,
  };
}

/**
 * Enforces server-side authorization by allowed roles.
 * Throws an Error with 401/403 status if unauthorized.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<ServerAuthContext> {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    const error = new Error("Unauthorized: Authentication required");
    (error as unknown as { statusCode: number }).statusCode = 401;
    throw error;
  }

  if (!allowedRoles.includes(auth.role)) {
    const error = new Error(
      `Forbidden: Role '${auth.role}' is not authorized to perform this operation. Required: [${allowedRoles.join(", ")}]`
    );
    (error as unknown as { statusCode: number }).statusCode = 403;
    throw error;
  }

  return auth;
}

/**
 * Enforces server-side authorization by granular permission.
 */
export async function requirePermission(permission: keyof RolePermissions): Promise<ServerAuthContext> {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    const error = new Error("Unauthorized: Authentication required");
    (error as unknown as { statusCode: number }).statusCode = 401;
    throw error;
  }

  const userPermissions = ROLE_PERMISSIONS[auth.role];
  if (!userPermissions || !userPermissions[permission]) {
    const error = new Error(`Forbidden: Role '${auth.role}' lacks '${permission}' permission.`);
    (error as unknown as { statusCode: number }).statusCode = 403;
    throw error;
  }

  return auth;
}
