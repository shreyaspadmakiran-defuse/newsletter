"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";

export default function SignIn() {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(new URLSearchParams(window.location.search).has("error"));
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">NEAR Intents · Product updates</h1>
        <p className="mt-2 text-sm text-zinc-600">Sign in with your defuse.org account to continue.</p>
        <button
          onClick={() => signIn("google", { callbackUrl: "/compose" })}
          className="mt-6 w-full rounded-lg px-4 py-3 font-semibold text-white"
          style={{ backgroundColor: "#fb4d01" }}
        >
          Sign in with Google
        </button>
        {error && (
          <p className="mt-4 text-sm text-red-600">
            Access denied. Use your <strong>@defuse.org</strong> Google account.
          </p>
        )}
      </div>
    </main>
  );
}
