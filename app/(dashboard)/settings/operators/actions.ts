"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================
// Types
// ============================================

export interface OperatorFull {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: "admin" | "operator";
  createdAt: string;
}

// ============================================
// Load All Operators
// ============================================

export async function loadOperators(): Promise<{
  data: OperatorFull[] | null;
  error: string | null;
}> {
  const supabase = createAdminClient();

  // Get profiles with user emails
  const { data, error } = await supabase
    .from("profiles")
    .select("id, user_id, name, role, created_at")
    .order("name");

  if (error) {
    console.error("Error loading operators:", error);
    return { data: null, error: error.message };
  }

  // Get user emails from auth.users via admin API
  const userIds = data.map((p) => p.user_id);
  
  // Fetch emails separately using admin client
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error("Error loading users:", usersError);
    // Continue without emails if we can't get them
  }

  const emailMap = new Map<string, string>();
  if (users?.users) {
    for (const user of users.users) {
      emailMap.set(user.id, user.email || "");
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const operators: OperatorFull[] = data.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: emailMap.get(row.user_id) || "",
    role: row.role as "admin" | "operator",
    createdAt: row.created_at,
  }));

  return { data: operators, error: null };
}

// ============================================
// Create Operator (creates auth user and profile)
// ============================================

export async function createOperator(params: {
  email: string;
  password: string;
  name: string;
  role: "admin" | "operator";
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = createAdminClient();

  // Create auth user - this triggers the database trigger that auto-creates a profile
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: true,
    user_metadata: { name: params.name },
  });

  if (authError) {
    if (authError.message.includes("already been registered") || 
        authError.message.includes("already exists")) {
      return { success: false, error: "A user with this email already exists" };
    }
    console.error("Error creating auth user:", authError);
    return { success: false, error: authError.message };
  }

  // Update the auto-created profile with the correct name and role
  // (The database trigger creates profiles with default values)
  const { data, error } = await supabase
    .from("profiles")
    .update({
      name: params.name,
      role: params.role,
    })
    .eq("user_id", authData.user.id)
    .select("id")
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    // Clean up auth user if profile update fails
    await supabase.auth.admin.deleteUser(authData.user.id);
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  return { success: true, id: data.id };
}

// ============================================
// Update Operator
// ============================================

export async function updateOperator(params: {
  id: string;
  userId: string;
  name?: string;
  role?: "admin" | "operator";
  newPassword?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // Update profile fields
  if (params.name !== undefined || params.role !== undefined) {
    const updates: Record<string, unknown> = {};
    if (params.name !== undefined) updates.name = params.name;
    if (params.role !== undefined) updates.role = params.role;

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", params.id);

    if (error) {
      console.error("Error updating profile:", error);
      return { success: false, error: error.message };
    }
  }

  // Update password if provided
  if (params.newPassword) {
    const { error: authError } = await supabase.auth.admin.updateUserById(
      params.userId,
      { password: params.newPassword }
    );

    if (authError) {
      console.error("Error updating password:", authError);
      return { success: false, error: authError.message };
    }
  }

  revalidatePath("/settings");

  return { success: true };
}

// ============================================
// Delete Operator (soft delete - just deactivates)
// ============================================

export async function deleteOperator(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // Ban the auth user instead of deleting
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: "876600h", // ~100 years (effectively permanent)
  });

  if (error) {
    console.error("Error banning user:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");

  return { success: true };
}

// ============================================
// Reactivate Operator
// ============================================

export async function reactivateOperator(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: "none",
  });

  if (error) {
    console.error("Error unbanning user:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");

  return { success: true };
}
