"use client";

import Sidebar from "@/components/Sidebar";
import { useState } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden" style={{ background: "var(--background)" }}>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      {/* Sidebar Wrapper */}
      <div className={`fixed inset-y-0 left-0 z-40 transform transition-all duration-300 ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 ${isDesktopCollapsed ? "md:w-20" : "md:w-56"}`}>
        <Sidebar
          onClose={() => setIsMobileOpen(false)}
          onToggle={() => setIsDesktopCollapsed((prev) => !prev)}
          collapsed={isDesktopCollapsed}
        />
      </div>

      <main className={`flex-1 min-h-screen min-w-0 w-full flex flex-col transition-[margin] duration-300 ${isDesktopCollapsed ? "md:ml-20" : "md:ml-56"}`}>
        {/* Mobile Header with Toggle */}
        <div className="md:hidden flex items-center p-4 border-b" style={{ background: "var(--surface)", borderColor: "var(--border-subtle)" }}>
          <button onClick={() => setIsMobileOpen((prev) => !prev)} className="text-white mr-4 flex items-center justify-center p-1 rounded hover:bg-white/10 transition-colors">
            <span className="material-icons-round">{isMobileOpen ? "close" : "menu"}</span>
          </button>
          <div className="font-bold text-base flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <div className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-bold" style={{ background: "linear-gradient(135deg, #5c5cf0, #a855f7)" }}>CT</div>
            ConcursoTech
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
