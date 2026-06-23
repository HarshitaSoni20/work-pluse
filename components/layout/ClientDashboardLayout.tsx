"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { useUser } from "@/components/providers/UserProvider";
import clsx from "clsx";

export function ClientDashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useUser();

  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <Sidebar />
      <div className={clsx("main-content", sidebarCollapsed && "collapsed")}>
        {children}
      </div>
    </div>
  );
}
