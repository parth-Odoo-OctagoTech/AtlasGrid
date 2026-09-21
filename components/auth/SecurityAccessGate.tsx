"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Shield, ShieldAlert, Lock, Unlock, KeyRound, Terminal, AlertTriangle, Eye, EyeOff, Loader2 } from "lucide-react";

export interface AuthUser {
  username: string;
  role: string;
  clearanceLevel: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  logout: () => Promise<void>;
  lockTerminal: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  logout: async () => {},
  lockTerminal: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function SecurityAccessGate({ children }: { children: React.ReactNode }) {
  const [checkingSession, setCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  // Form state
  const [operatorId, setOperatorId] = useState("admin");
  const [passkey, setPasskey] = useState("Qwerty123");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lockoutSecs, setLockoutSecs] = useState<number>(0);

  // Check existing session on mount
  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const savedToken = typeof window !== "undefined" ? localStorage.getItem("atlasgrid_token") : null;
        const res = await fetch("/api/auth/session", {
          headers: savedToken ? { Authorization: `Bearer ${savedToken}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && isMounted) {
            setIsAuthenticated(true);
            setUser(data.user);
          }
        }
      } catch (e) {
        console.warn("[SecurityGate] Session check offline", e);
      } finally {
        if (isMounted) setCheckingSession(false);
      }
    }

    checkSession();
    return () => {
      isMounted = false;
    };
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSecs <= 0) return;
    const interval = setInterval(() => {
      setLockoutSecs((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setErrorMessage(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSecs]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading || lockoutSecs > 0) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: operatorId, password: passkey }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.token) {
          try {
            localStorage.setItem("atlasgrid_token", data.token);
          } catch {}
        }
        setIsAuthenticated(true);
        setUser(data.user);
      } else {
        setErrorMessage(data.error || "Access Denied: Verification failed.");
        if (data.locked && data.retryAfterSeconds) {
          setLockoutSecs(data.retryAfterSeconds);
        }
      }
    } catch (err: any) {
      setErrorMessage("Network error: Security authentication service unreachable.");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem("atlasgrid_token");
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.warn("Logout error:", e);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const lockTerminal = () => {
    logout();
  };

  if (checkingSession) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101418] text-[#8a9ba8]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-[#2b95d6]" />
          <span className="font-mono text-xs uppercase tracking-widest text-[#a7b6c2]">
            Verifying Cryptographic Credentials...
          </span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <AuthContext.Provider value={{ isAuthenticated, user, logout, lockTerminal }}>
        {children}
      </AuthContext.Provider>
    );
  }

  // Security Barrier Presentation
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0e1317] p-4 font-sans select-none overflow-y-auto">
      {/* Background scanline & ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(19,124,189,0.12),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative w-full max-w-md rounded-lg border border-[#293742] bg-[#182026] p-6 shadow-2xl">
        {/* Top classified strip */}
        <div className="mb-5 flex items-center justify-between border-b border-[#293742] pb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#db3737] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#db3737]" />
            </span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#db3737]">
              RESTRICTED ACCESS // LEVEL-5 CLEARANCE
            </span>
          </div>
          <span className="font-mono text-[9px] uppercase text-[#8a9ba8] border border-[#293742] px-1.5 py-0.5 rounded bg-[#101418]">
            PALANTIR GOTHAM DEFENSE
          </span>
        </div>

        {/* Identity & Header */}
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded border border-[#293742] bg-[#101418] text-[#2b95d6]">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-mono text-base font-bold tracking-wider text-[#f5f8fa]">
              ATLASGRID DEFENSE GATEWAY
            </h1>
            <p className="mt-0.5 text-xs text-[#8a9ba8]">
              Critical Infrastructure & Global Data Center Observability
            </p>
          </div>
        </div>

        {/* Error / Lockout Banner */}
        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 rounded border border-[#db3737]/50 bg-[#db3737]/15 p-2.5 text-xs text-[#f55656]">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <div className="flex-1 font-mono text-[11px] leading-tight">
              {errorMessage}
            </div>
          </div>
        )}

        {/* Lockout Countdown */}
        {lockoutSecs > 0 && (
          <div className="mb-4 flex items-center justify-between rounded border border-[#d9822b]/50 bg-[#d9822b]/10 p-2.5 text-xs text-[#f29d49]">
            <span className="font-mono text-[11px]">RATE LIMIT LOCKOUT ACTIVE</span>
            <span className="font-mono font-bold">{lockoutSecs}s</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block mb-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#a7b6c2]">
              Operator Identifier
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                placeholder="Enter operator username..."
                className="w-full rounded border border-[#293742] bg-[#101418] px-3 py-2 font-mono text-xs text-[#f5f8fa] placeholder-[#5c7080] focus:border-[#2b95d6] focus:outline-none"
                disabled={loading || lockoutSecs > 0}
              />
              <div className="absolute right-3 top-2.5 text-[#5c7080]">
                <Terminal className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div>
            <label className="block mb-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#a7b6c2]">
              Security Passkey
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="Enter passkey..."
                className="w-full rounded border border-[#293742] bg-[#101418] px-3 py-2 font-mono text-xs text-[#f5f8fa] placeholder-[#5c7080] focus:border-[#2b95d6] focus:outline-none"
                disabled={loading || lockoutSecs > 0}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-2.5 text-[#5c7080] hover:text-[#a7b6c2]"
                tabIndex={-1}
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Quick Credential Badge */}
          <div className="flex items-center justify-between rounded bg-[#101418] border border-[#293742] p-2 text-[10px] font-mono text-[#8a9ba8]">
            <div className="flex items-center gap-1.5">
              <KeyRound className="h-3 w-3 text-[#2b95d6]" />
              <span>DEFAULT CLEARANCE:</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setOperatorId("admin");
                setPasskey("Qwerty123");
              }}
              className="text-[#2b95d6] hover:underline font-bold"
            >
              admin / Qwerty123 (Auto-fill)
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || lockoutSecs > 0}
            className="flex w-full items-center justify-center gap-2 rounded bg-[#137cbd] px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#2b95d6] disabled:cursor-not-allowed disabled:opacity-50 shadow-md"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Verifying Clearance...</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                <span>Authenticate Clearance</span>
              </>
            )}
          </button>
        </form>

        {/* Security Compliance Footer */}
        <div className="mt-5 border-t border-[#293742] pt-3 text-center">
          <p className="font-mono text-[9px] text-[#5c7080] leading-relaxed">
            SECURE PERIMETER ENGAGED • CRYPTOGRAPHIC HMAC-SHA256 SESSION TOKENS • RFC 2104 / FIPS 140-2 CONSTANT-TIME VERIFICATION
          </p>
        </div>
      </div>
    </div>
  );
}
