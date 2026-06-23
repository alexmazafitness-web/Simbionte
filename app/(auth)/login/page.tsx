"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "sending" | "sent" | "error";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("sent");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#141414] px-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-3xl font-semibold text-[#C9A96E]">Simbionte</h1>
        <p className="mb-8 text-sm text-neutral-400">Accede con tu enlace mágico.</p>

        {status === "sent" ? (
          <p className="rounded border border-[#C9A96E]/30 bg-[#1A1A1A] px-4 py-3 text-sm text-neutral-200">
            Revisa tu correo: te hemos enviado un enlace de acceso.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@correo.com"
              className="rounded border border-neutral-700 bg-[#1A1A1A] px-4 py-2 text-sm text-neutral-100 outline-none focus:border-[#C9A96E]"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded bg-[#C9A96E] px-4 py-2 text-sm font-medium text-[#141414] transition disabled:opacity-50"
            >
              {status === "sending" ? "Enviando..." : "Enviar enlace"}
            </button>
            {status === "error" && (
              <p className="text-sm text-red-400">{errorMessage}</p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
