import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import type { ReactNode } from "react";

export async function AuthGuard({ children }: { children: ReactNode }) {
  await requireAuth();
  return <>{children}</>;
}

