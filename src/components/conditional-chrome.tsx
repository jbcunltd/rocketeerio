"use client";

import { usePathname } from "next/navigation";

const HIDDEN_PREFIXES = ["/dashboard", "/login", "/signup"];

export function ConditionalChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "/";
  const hide = HIDDEN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (hide) return null;
  return <>{children}</>;
}
