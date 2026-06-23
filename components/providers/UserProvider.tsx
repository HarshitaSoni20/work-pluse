"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  teamId: number | null;
  leaveBalance: number;
}

interface UserContextType {
  currentUser: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  async function fetchUser() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error("Failed to fetch user from /api/auth/me", err);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider
      value={{
        currentUser,
        loading,
        refreshUser: fetchUser,
        sidebarCollapsed,
        setSidebarCollapsed,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
