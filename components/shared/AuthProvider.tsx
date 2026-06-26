"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "TOKEN_REFRESHED") {
        // El browser client ya escribió los tokens nuevos en document.cookie
        // vía documentCookieSetAll. router.refresh() fuerza al layout del
        // servidor a leer esas cookies en la próxima request, manteniendo
        // server state y client state sincronizados.
        router.refresh();
      }

      if (event === "SIGNED_OUT") {
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return <>{children}</>;
}
