"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { adminTokenExpiresAt } from "@/lib/admin-token-client";

export interface AdminSessionValue {
  token: string;
  logout: () => void;
}

export function AdminSession({
  children,
}: {
  children: (session: AdminSessionValue) => ReactNode;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const savedToken = localStorage.getItem("admin_token");
      if (!savedToken) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch("/api/auth", {
          headers: { Authorization: `Bearer ${savedToken}` },
        });
        if (response.ok) setToken(savedToken);
        else localStorage.removeItem("admin_token");
      } catch {
        localStorage.removeItem("admin_token");
      } finally {
        setLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const payload = await response.json();
      if (!response.ok || typeof payload.token !== "string") {
        setError(payload.error || "Unable to sign in.");
        return;
      }
      localStorage.setItem("admin_token", payload.token);
      setToken(payload.token);
      setPassword("");
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem("admin_token");
    setToken(null);
  }, []);

  useEffect(() => {
    if (!token) return;
    const expiresAt = adminTokenExpiresAt(token);
    if (!expiresAt || expiresAt <= Date.now()) {
      const timer = window.setTimeout(logout, 0);
      return () => window.clearTimeout(timer);
    }
    const expiryTimer = window.setTimeout(logout, expiresAt - Date.now());
    const checkVisibility = () => {
      if (document.visibilityState === "visible" && Date.now() >= expiresAt) logout();
    };
    document.addEventListener("visibilitychange", checkVisibility);
    window.addEventListener("focus", checkVisibility);
    return () => {
      window.clearTimeout(expiryTimer);
      document.removeEventListener("visibilitychange", checkVisibility);
      window.removeEventListener("focus", checkVisibility);
    };
  }, [logout, token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f8] pt-20">
        <LoaderCircle className="size-8 animate-spin text-[#1a6fb5]" aria-label="Loading admin" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f8] px-4 py-24">
        <Card className="w-full max-w-sm border-0 shadow-md">
          <CardContent className="p-7 text-center sm:p-8">
            <Image
              alt="L.I.F.E. Ministry"
              className="mx-auto rounded-xl"
              height={56}
              src="/logo-water-cross.png"
              width={56}
            />
            <h1 className="mt-4 font-display text-3xl font-bold text-[#0a1a2f]">Ministry Admin</h1>
            <p className="mt-2 font-body text-sm text-[#4a6580]">Prepare this week’s gatherings.</p>
            <form className="mt-6 space-y-4" onSubmit={login}>
              <Input
                aria-label="Admin password"
                autoComplete="current-password"
                className="h-12 px-4 text-base"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                type="password"
                value={password}
              />
              {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <Button
                className="min-h-12 w-full bg-[#1a6fb5] font-body font-bold text-white hover:bg-[#155d99]"
                disabled={!password || submitting}
                type="submit"
              >
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return children({ token, logout });
}
