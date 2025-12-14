import { createClient } from "./supabase-server";
import { redirect } from "next/navigation";

export async function getSession() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

