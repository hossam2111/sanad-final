"use client";

import React, { createContext, useContext, useState, useRef, useCallback } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

export type UserRole =
  | "emergency" | "doctor" | "citizen" | "admin" | "lab"
  | "pharmacy" | "hospital" | "insurance" | "ai-control"
  | "research" | "family" | "supply-chain";

export interface AuthUser {
  role: UserRole;
  name: string;
  jobTitle: string;
  organization: string;
  initial: string;
  nationalId?: string;
}

// Supplementary defaults for display fields not returned by the API.
const ROLE_DEFAULTS: Partial<Record<UserRole, Partial<AuthUser>>> = {
  citizen: { nationalId: "1000000001" },
};

interface AuthContextValue {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: async () => { throw new Error("AuthProvider not mounted"); },
  logout: () => {},
  isAuthenticated: false,
});

const SESSION_KEY = "sanad_session";
const TOKEN_KEY = "sanad_jwt";

type LoginResponse = {
  token: string;
  expiresIn: number;
  user: {
    role: UserRole;
    userId: string;
    name: string;
    jobTitle: string;
    organization: string;
  };
};

function isLoginResponse(value: unknown): value is LoginResponse {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  const user = data["user"];
  if (!user || typeof user !== "object") return false;
  const u = user as Record<string, unknown>;
  return (
    typeof data["token"] === "string" &&
    typeof data["expiresIn"] === "number" &&
    typeof u["role"] === "string" &&
    typeof u["name"] === "string"
  );
}

const REFRESH_BUFFER_MS = 60 * 1000; // refresh 60s before expiry

function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]!)) as { exp?: number };
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]!)) as { exp?: number };
        if (!payload.exp || payload.exp * 1000 <= Date.now()) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(SESSION_KEY);
          return null;
        }
        setAuthTokenGetter(() => localStorage.getItem(TOKEN_KEY));
      }
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current !== null) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const scheduleRefresh = useCallback((token: string) => {
    clearRefreshTimer();
    const expiry = getTokenExpiry(token);
    if (!expiry) return;
    const delay = expiry - Date.now() - REFRESH_BUFFER_MS;
    if (delay <= 0) return;
    refreshTimerRef.current = setTimeout(async () => {
      try {
        const currentToken = localStorage.getItem(TOKEN_KEY);
        if (!currentToken) return;
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { Authorization: `Bearer ${currentToken}` },
        });
        if (!res.ok) {
          // Token expired on server side — log out silently
          logout();
          return;
        }
        const data = await res.json() as { token: string; expiresIn: number };
        localStorage.setItem(TOKEN_KEY, data.token);
        setAuthTokenGetter(() => localStorage.getItem(TOKEN_KEY));
        scheduleRefresh(data.token);
      } catch {
        // Network error — don't log out, let next API call handle it
      }
    }, delay);
  }, [clearRefreshTimer]); // eslint-disable-line react-hooks/exhaustive-deps

  // Schedule refresh on mount if session is active
  React.useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) scheduleRefresh(token);
    return clearRefreshTimer;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (username: string, password: string): Promise<AuthUser> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        let message = `Login failed (${response.status})`;
        try {
          const err = await response.json() as { message?: string };
          if (err.message) message = err.message;
        } catch { /* ignore parse error */ }
        throw new Error(message);
      }

      const data: unknown = await response.json();
      if (!isLoginResponse(data)) throw new Error("Login response was invalid");

      const roleDefaults = ROLE_DEFAULTS[data.user.role] ?? {};
      const authenticatedUser: AuthUser = {
        role: data.user.role,
        name: data.user.name,
        jobTitle: data.user.jobTitle,
        organization: data.user.organization,
        initial: data.user.name?.[0]?.toUpperCase() ?? "?",
        ...roleDefaults,
      };

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(SESSION_KEY, JSON.stringify(authenticatedUser));
      setAuthTokenGetter(() => localStorage.getItem(TOKEN_KEY));
      setUser(authenticatedUser);
      scheduleRefresh(data.token);
      return authenticatedUser;
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
      setAuthTokenGetter(null);
      throw error instanceof Error ? error : new Error("Login failed");
    }
  };

  const logout = useCallback(() => {
    clearRefreshTimer();
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setAuthTokenGetter(null);
  }, [clearRefreshTimer]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401) {
        logout();
        window.location.href = "/";
      }
      return response;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// Exported for portal display (icons, labels) — not used for authentication.
export const ROLE_USERS: Record<UserRole, AuthUser> = {
  emergency: { role: "emergency", name: "Unit 7 — Riyadh Central", jobTitle: "First Responder", organization: "SRCA Emergency Services", initial: "U" },
  doctor: { role: "doctor", name: "Dr. Ahmed Al-Rashidi", jobTitle: "Consultant Physician", organization: "King Fahd Medical City", initial: "A" },
  citizen: { role: "citizen", name: "Mohammed Al-Ghamdi", jobTitle: "Citizen", organization: "National Health Record", initial: "M", nationalId: "1000000001" },
  admin: { role: "admin", name: "Eng. Saad Al-Otaibi", jobTitle: "National Health Operations Director", organization: "Ministry of Health — KSA", initial: "S" },
  lab: { role: "lab", name: "Sara Al-Otaibi", jobTitle: "Senior Lab Technician", organization: "SANAD Lab Network", initial: "S" },
  pharmacy: { role: "pharmacy", name: "Hassan Al-Ghamdi", jobTitle: "Clinical Pharmacist", organization: "Central Pharmacy — Riyadh", initial: "H" },
  hospital: { role: "hospital", name: "Operations Manager", jobTitle: "Hospital Operations Director", organization: "King Fahd Medical City", initial: "O" },
  insurance: { role: "insurance", name: "Nora Al-Qahtani", jobTitle: "Insurance Operations Lead", organization: "Tawuniya Insurance", initial: "N" },
  "ai-control": { role: "ai-control", name: "Dr. Khalid Al-Mansouri", jobTitle: "AI Systems Lead", organization: "SANAD AI Division", initial: "K" },
  research: { role: "research", name: "Dr. Reem Al-Zahrani", jobTitle: "Clinical Research Director", organization: "King Abdulaziz University", initial: "R" },
  family: { role: "family", name: "Fatima Al-Harbi", jobTitle: "Family Health Coordinator", organization: "SANAD Family Health", initial: "F" },
  "supply-chain": { role: "supply-chain", name: "Ibrahim Al-Dosari", jobTitle: "Supply Chain Manager", organization: "National Pharma Supply", initial: "I" },
};
