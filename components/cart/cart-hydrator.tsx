"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/lib/stores/cart-store";

/** Hydrates cart store from server cookie (GET /api/cart/summary). Single source of truth. */
export function CartHydrator() {
  const syncFromServer = useCartStore((s) => s.syncFromServer);
  const pathname = usePathname();
  useEffect(() => {
    // Category URLs immediately redirect to /shop. Avoid starting a request
    // that WebKit will cancel (and report as a CORS error) mid-navigation.
    if (pathname.startsWith("/category/") || pathname.startsWith("/account"))
      return;
    syncFromServer();
  }, [pathname, syncFromServer]);
  return null;
}
