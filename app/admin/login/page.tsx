"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        setError(true);
        setLoading(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError(true);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-5">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm p-8">
        <span className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-50">
          <Lock className="h-5 w-5 text-brand-700" />
        </span>
        <h1 className="mt-4 text-lg font-semibold text-ink-900">Admin sign in</h1>
        <p className="mt-1 text-sm text-ink-500">View all quotes and bookings.</p>

        <label className="field-label mt-6" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          className="field-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          autoComplete="current-password"
        />
        {error && <p className="mt-2 text-xs text-red-600">Incorrect password.</p>}

        <button type="submit" disabled={loading || !password} className="btn-primary mt-5 w-full">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
