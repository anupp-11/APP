"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================
// Types
// ============================================

export interface PlatformFull {
  id: string;
  name: string;
  depositUrl: string | null;
  withdrawUrl: string | null;
  balance: number;
  status: "active" | "inactive";
  createdAt: string;
}

// ============================================
// Load All Payment Platforms
// ============================================

export async function loadPaymentPlatforms(): Promise<{
  data: PlatformFull[] | null;
  error: string | null;
}> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("payment_platforms") as any)
    .select("*")
    .order("name");

  if (error) {
    console.error("Error loading payment platforms:", error);
    return { data: null, error: error.message };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const platforms: PlatformFull[] = data.map((row: any) => ({
    id: row.id,
    name: row.name,
    depositUrl: row.deposit_url,
    withdrawUrl: row.withdraw_url,
    balance: Number(row.balance) || 0,
    status: row.status as "active" | "inactive",
    createdAt: row.created_at,
  }));

  return { data: platforms, error: null };
}

// ============================================
// Create Payment Platform
// ============================================

export async function createPaymentPlatform(params: {
  name: string;
  depositUrl?: string;
  withdrawUrl?: string;
  balance?: number;
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("payment_platforms") as any)
    .insert({
      name: params.name,
      deposit_url: params.depositUrl || null,
      withdraw_url: params.withdrawUrl || null,
      balance: params.balance ?? 0,
      status: "active",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating payment platform:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/platforms");
  revalidatePath("/quick-transaction");

  return { success: true, id: data.id };
}

// ============================================
// Update Payment Platform
// ============================================

export async function updatePaymentPlatform(params: {
  id: string;
  name?: string;
  depositUrl?: string;
  withdrawUrl?: string;
  balance?: number;
  status?: "active" | "inactive";
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const updates: Record<string, unknown> = {};
  if (params.name !== undefined) updates.name = params.name;
  if (params.depositUrl !== undefined) updates.deposit_url = params.depositUrl;
  if (params.withdrawUrl !== undefined) updates.withdraw_url = params.withdrawUrl;
  if (params.balance !== undefined) updates.balance = params.balance;
  if (params.status !== undefined) updates.status = params.status;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("payment_platforms") as any)
    .update(updates)
    .eq("id", params.id);

  if (error) {
    console.error("Error updating payment platform:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/platforms");
  revalidatePath("/quick-transaction");

  return { success: true };
}

// ============================================
// Delete Payment Platform (soft delete)
// ============================================

export async function deletePaymentPlatform(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("payment_platforms") as any)
    .update({ status: "inactive" })
    .eq("id", id);

  if (error) {
    console.error("Error deleting payment platform:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/platforms");
  revalidatePath("/quick-transaction");

  return { success: true };
}

// ============================================
// Reactivate Payment Platform
// ============================================

export async function reactivatePaymentPlatform(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("payment_platforms") as any)
    .update({ status: "active" })
    .eq("id", id);

  if (error) {
    console.error("Error reactivating payment platform:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/platforms");
  revalidatePath("/quick-transaction");

  return { success: true };
}
