"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(prevState: { error: string } | null, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  console.log("[Login Action] Attempting login for:", email);

  const cookieStore = await cookies();

  // Extract project ref from URL for cookie naming
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] || "supabase";

  const supabase = createServerClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          console.log("[Login Action] Setting cookies:", cookiesToSet.length);
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            console.log("[Login Action] Cookie set error:", error);
          }
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  console.log("[Login Action] Result:", error ? error.message : "success");

  if (error) {
    return { error: error.message };
  }

  // Manually set auth cookies using Supabase's expected format
  if (data.session) {
    console.log("[Login Action] Manually setting session cookies");
    const cookieName = `sb-${projectRef}-auth-token`;
    const cookieValue = JSON.stringify({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + data.session.expires_in,
      expires_in: data.session.expires_in,
      token_type: "bearer",
      user: data.session.user,
    });

    // Split into chunks if needed (cookies have 4KB limit)
    const chunkSize = 3500;
    const chunks = [];
    for (let i = 0; i < cookieValue.length; i += chunkSize) {
      chunks.push(cookieValue.slice(i, i + chunkSize));
    }

    if (chunks.length === 1) {
      cookieStore.set(cookieName, cookieValue, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });
    } else {
      chunks.forEach((chunk, index) => {
        cookieStore.set(`${cookieName}.${index}`, chunk, {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
        });
      });
    }
  }

  redirect("/quick-transaction");
}
