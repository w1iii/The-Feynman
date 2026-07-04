"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { createClient } from "../supabase/client";
import { authFetch } from "../api/client";

type User = {
  id: string;
  email: string;
  user_metadata?: { full_name?: string };
};

type Profile = { plan: string };
type Session = {
  id: string; concept: string; created_at: string;
  status: string; final_score?: number; score_label?: string; score_description?: string;
};

type Stats = {
  total_sessions: number; completed_sessions: number;
  avg_score: number; best_score: number; completion_rate: number;
  unique_concepts: number; recent_concepts: string[];
};

type UserContextValue = {
  user: User | null;
  profile: Profile | null;
  sessions: Session[];
  stats: Stats | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, sessionsRes, statsRes] = await Promise.all([
        authFetch("/api/profile"),
        authFetch("/api/getsession"),
        authFetch("/api/stats"),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile({ plan: data.plan || "free" });
      }

      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        if (data.sessions) setSessions(data.sessions);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (err) {
      console.log("Error fetching user data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUser(user as User);
    });

    fetchData();
  }, [fetchData]);

  return (
    <UserContext.Provider value={{ user, profile, sessions, stats, loading, refresh: fetchData }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
