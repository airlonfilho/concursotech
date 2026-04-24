"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/edital", icon: "description", label: "Edital" },
  { href: "/questoes", icon: "quiz", label: "Questões" },

  { href: "/flashcards", icon: "style", label: "Flashcards" },
  { href: "/aulas", icon: "play_circle", label: "Aulas" },
  { href: "/plano", icon: "calendar_today", label: "Plano" },
  { href: "/nivelamento", icon: "radar", label: "Nivelamento" },
  { href: "/historico", icon: "history", label: "Histórico" },
  { href: "/analises", icon: "analytics", label: "Análises" },
];



interface SidebarProps {
  onClose?: () => void;
  onToggle?: () => void;
  collapsed?: boolean;
}

export default function Sidebar({ onClose, onToggle, collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);
  const [diasRestantes, setDiasRestantes] = useState<number | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/user/profile");
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
          if (data.profile.concurso?.data_prova) {
            const diff = new Date(data.profile.concurso.data_prova).getTime() - new Date().getTime();
            const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
            setDiasRestantes(days);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchProfile();
  }, []);

  return (
    <aside
      className={`relative h-full flex flex-col transition-all duration-300 ${collapsed ? "w-20" : "w-56"}`}
      style={{
        background: "var(--surface)",
        borderRight: "1px solid var(--border-subtle)",
      }}
    >
      {/* Logo */}
      <div className={`flex items-center border-b ${collapsed ? "px-3 py-4 justify-center" : "gap-3 px-5 py-5"}`} style={{ borderColor: "var(--border-subtle)" }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
          style={{ background: "linear-gradient(135deg, #5c5cf0, #a855f7)" }}
        >
          CT
        </div>
        {!collapsed && (
          <span className="font-bold text-base" style={{ color: "var(--foreground)" }}>
            ConcursoTech
          </span>
        )}
      </div>

      <button
        onClick={onToggle}
        className="hidden md:flex absolute top-5 -right-3.5 z-20 h-7 w-7 items-center justify-center rounded-full border transition-all duration-300 hover:scale-110"
        style={{
          borderColor: "rgba(92, 92, 240, 0.55)",
          color: "#e6e6ff",
          background: "linear-gradient(180deg, rgba(24,24,42,0.98), rgba(14,14,26,0.98))",
          boxShadow: "0 6px 16px rgba(7, 7, 16, 0.45), 0 0 0 1px rgba(92, 92, 240, 0.2)",
        }}
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
      >
        <span className="material-icons-round text-base">{collapsed ? "chevron_right" : "chevron_left"}</span>
      </button>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              title={collapsed ? item.label : undefined}
              className={`flex items-center px-3 py-2.5 rounded-lg mb-1 transition-all duration-200 text-sm font-medium group ${collapsed ? "justify-center" : "gap-3"} ${
                isActive
                  ? "nav-item-active"
                  : "hover:bg-white/5"
              }`}
              style={{
                color: isActive ? "var(--primary)" : "var(--text-secondary)",
              }}
            >
              <span className="material-icons-round text-xl">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User / Bottom */}
      <div className={`py-4 border-t ${collapsed ? "px-2" : "px-4"}`} style={{ borderColor: "var(--border-subtle)" }}>


        <Link
          href="/configuracoes"
          onClick={onClose}
          title={collapsed ? "Configurações" : undefined}
          className={`flex items-center px-3 py-2.5 rounded-xl transition-all hover:bg-white/5 mb-1 group ${collapsed ? "justify-center" : "gap-3"}`}
          style={{ 
            color: pathname === "/configuracoes" ? "var(--primary)" : "var(--text-secondary)",
            background: pathname === "/configuracoes" ? "rgba(92,92,240,0.05)" : "transparent"
          }}
        >
          <span className="material-icons-round text-xl group-hover:rotate-12 transition-transform">settings</span>
          {!collapsed && <span className="text-sm font-medium">Configurações</span>}
        </Link>

        {/* Status indicator (Removed bulky card, using real stats instead) */}
        {!collapsed && (
          <div className="px-3 py-2 text-[9px] font-bold text-gray-600 uppercase tracking-[0.2em] mt-2 mb-2">
              Nível {profile?.nivel || 1} • {profile?.xp || 0} XP{diasRestantes !== null ? ` • ${diasRestantes}d` : ""}
          </div>
        )}

        <button
          onClick={async () => {
            try {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/login";
            } catch (err) {
              window.location.href = "/login";
            }
          }}
          title={collapsed ? "Sair" : undefined}
          className={`flex items-center w-full text-left px-3 py-2.5 rounded-xl transition-all hover:bg-white/5 text-danger/70 hover:text-danger ${collapsed ? "justify-center" : "gap-3"}`}
        >
          <span className="material-icons-round text-xl">logout</span>
          {!collapsed && <span className="text-sm font-medium">Sair</span>}
        </button>
      </div>
    </aside>
  );
}
