import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.match(/https:\/\/([^.]+)/)?.[1] || "supabase";
  const cookieName = `sb-${projectRef}-auth-token`;

  const response = NextResponse.json({ success: true });
  
  // Delete the auth cookie
  response.cookies.set(cookieName, "", {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0, // Delete immediately
  });

  return response;
}
