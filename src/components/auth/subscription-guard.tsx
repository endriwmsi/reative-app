"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

interface SubscriptionGuardProps {
  status: string;
}

export function SubscriptionGuard({ status }: SubscriptionGuardProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (
      (status === "expired" || status === "pending") &&
      !pathname.startsWith("/configuracoes/")
    ) {
      router.push("/configuracoes/assinatura");
    }
  }, [status, pathname, router]);

  return null;
}
