"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError("Invalid password");
        return;
      }

      router.push("/admin/payments");
    } catch {
      setError("Connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9f7] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-[24px] text-on-background text-center mb-8">
          Admin
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="w-full px-4 py-3 border border-outline-variant/50 rounded-lg font-body text-[14px] text-on-background bg-transparent focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {error && (
            <p className="font-body text-[12px] text-error">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-primary hover:bg-[#0d3323] text-on-primary font-body text-[11px] tracking-[0.3em] uppercase px-10 py-3 rounded-full transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Checking..." : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
