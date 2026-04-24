"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha: password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Erro ao fazer login");
        setLoading(false);
        return;
      }

      // Sucesso! O cookie HttpOnly já foi definido pelo backend.
      window.location.href = "/dashboard";
    } catch (err) {
      setError("Erro de conexão com o servidor.");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--background)" }}
    >
      {/* Left: Hero */}
      <div
        className="hidden lg:flex flex-col justify-center items-start flex-1 px-16 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #0d0d14 0%, #13131f 40%, #1a1040 100%)",
        }}
      >
        {/* Background decoration */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(circle at 30% 40%, rgba(92,92,240,0.4) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(168,85,247,0.3) 0%, transparent 50%)",
          }}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(92,92,240,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(92,92,240,0.5) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />

        <div className="relative z-10 max-w-lg">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{
                background: "linear-gradient(135deg, #5c5cf0, #a855f7)",
              }}
            >
              CT
            </div>
            <span className="text-xl font-bold text-white">ConcursoTech</span>
          </div>

          <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
            Arquitetando
            <br />
            <span className="gradient-text">seu Futuro</span>
          </h1>
          <p className="text-lg mb-12" style={{ color: "var(--text-secondary)" }}>
            Ambiente de Alta Performance para Concursos de TI. Inteligência
            artificial a serviço da sua aprovação.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: "15k+", label: "Questões" },
              { value: "92%", label: "Aprovação" },
              { value: "500+", label: "Alunos" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="glass rounded-xl p-4 text-center"
              >
                <div
                  className="text-2xl font-bold gradient-text"
                  style={{ marginBottom: 2 }}
                >
                  {stat.value}
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div
        className="flex flex-col justify-center items-center w-full lg:w-auto lg:min-w-[480px] px-8 py-12"
        style={{ background: "var(--surface)" }}
      >
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
              style={{
                background: "linear-gradient(135deg, #5c5cf0, #a855f7)",
              }}
            >
              CT
            </div>
            <span className="text-lg font-bold text-white">ConcursoTech</span>
          </div>

          <h2 className="text-2xl font-bold mb-2 text-white">Bem-vindo de volta</h2>
          <p className="mb-4 text-sm" style={{ color: "var(--text-secondary)" }}>
            Entre na sua conta para continuar estudando
          </p>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg text-sm bg-red-500/10 border border-red-500/50 text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                E-mail
              </label>
              <div className="relative">
                <span
                  className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-lg"
                  style={{ color: "var(--text-muted)" }}
                >
                  mail
                </span>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-lg text-sm transition-all duration-200"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--foreground)",
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "var(--primary)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = "var(--border-subtle)")
                  }
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label
                  className="text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Senha
                </label>
                <a
                  href="#"
                  className="text-xs transition-colors hover:underline"
                  style={{ color: "var(--primary)" }}
                >
                  Esqueci minha senha
                </a>
              </div>
              <div className="relative">
                <span
                  className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-lg"
                  style={{ color: "var(--text-muted)" }}
                >
                  lock
                </span>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-lg text-sm transition-all duration-200"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--foreground)",
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "var(--primary)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = "var(--border-subtle)")
                  }
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="btn-login"
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-sm text-white transition-all duration-200 mt-2"
              style={{
                background: loading
                  ? "rgba(92,92,240,0.5)"
                  : "linear-gradient(135deg, #5c5cf0, #7c7cf8)",
                boxShadow: loading ? "none" : "0 4px 20px rgba(92,92,240,0.4)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  />
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Não tem uma conta?{" "}
            <Link
              href="/cadastro"
              className="font-semibold transition-colors hover:underline"
              style={{ color: "var(--primary)" }}
            >
              Criar conta grátis
            </Link>
          </p>

          {/* Footer links */}
          <div className="flex justify-center gap-4 mt-10">
            {["Suporte", "Privacidade", "Termos"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-xs transition-colors hover:underline"
                style={{ color: "var(--text-muted)" }}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
