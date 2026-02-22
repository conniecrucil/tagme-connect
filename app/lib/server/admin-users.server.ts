import { getSupabaseClient } from "~/lib/server/api-legacy/utils/supabase";

export interface AdminUserRecord {
  id: string;
  email: string;
  created_at: string;
}

export async function listAdminUsers(): Promise<AdminUserRecord[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("admin_users_auth0")
    .select("id, email, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to fetch admin users");
  }

  return (data ?? []) as AdminUserRecord[];
}

export async function createAdminUser(email: string): Promise<AdminUserRecord> {
  if (!email) {
    throw new Error("Email is required");
  }

  const normalizedEmail = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    throw new Error("Invalid email format");
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("admin_users_auth0")
    .insert([{ email: normalizedEmail }])
    .select("id, email, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      const duplicateError = new Error("This email is already registered as an admin user");
      (duplicateError as Error & { status?: number }).status = 409;
      throw duplicateError;
    }
    throw new Error(error.message || "Failed to create admin user");
  }

  return data as AdminUserRecord;
}

export async function deleteAdminUser(id: string): Promise<void> {
  if (!id) {
    throw new Error("User ID is required");
  }

  const supabase = getSupabaseClient();

  const { count, error: countError } = await supabase
    .from("admin_users_auth0")
    .select("*", { count: "exact", head: true });

  if (countError) {
    throw new Error(countError.message || "Failed to check admin users");
  }

  if (count && count <= 1) {
    const lastAdminError = new Error("Cannot delete the last admin user");
    (lastAdminError as Error & { status?: number }).status = 400;
    throw lastAdminError;
  }

  const { error: deleteError } = await supabase
    .from("admin_users_auth0")
    .delete()
    .eq("id", id);

  if (deleteError) {
    throw new Error(deleteError.message || "Failed to delete admin user");
  }
}

export async function isAdminEmailAuthorized(email: string): Promise<boolean> {
  if (!email) return false;

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("admin_users_auth0")
    .select("id, email")
    .eq("email", email)
    .single();

  return !error;
}
