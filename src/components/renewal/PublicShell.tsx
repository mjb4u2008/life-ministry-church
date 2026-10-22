"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function PublicShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <div className={pathname.startsWith("/admin") ? "ministry-admin" : "renewal-site"}>{children}</div>;
}
