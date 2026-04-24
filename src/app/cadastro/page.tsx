"use client";

import { useState } from "react";
import Link from "next/link";

export default function CadastroPage() {
  const [step, setStep] = useState(1);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  
  const [concurso, setConcurso] = useState("");
  const [dataProva, setDataProva] = useState("");
  const [horasDia, setHorasDia] = useState("2h"); // Padrão
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setStep(2);
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    if (!concurso || !dataProva) {
      setError("Por favor, preencha todos os campos do concurso.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Criar Usuário
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Erro ao realizar cadastro.");
        setLoading(false);
        return;
      }

      // 2. Logar Usuário para ter o Cookie HttpOnly de Sessão
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      if (!loginRes.ok) throw new Error("Erro ao fazer login após registro.");

      // 3. Salvar as informações do Concurso passando o cookie ativo
      const concRes = await fetch("/api/concurso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cargo: concurso, // Vamos simplificar salvando tudo em cargo
          banca: "A Definir",
          modalidade: "Nível Superior",
          data_prova: new Date(dataProva).toISOString(),
          horas_dia: parseInt(horasDia.replace("h", "").replace("+", "")) || 2,
          dias_semana: ["SEG", "TER", "QUA", "QUI", "SEX", "SAB"],
        }),
      });

      if (!concRes.ok) {
        const concData = await concRes.json();
        console.error("Erro salvando concurso:", concData);
        // Mesmo falhando, o usuário foi criado. Direciona ao dashboard
      }

      window.location.href = "/dashboard";
    } catch (err) {
      setError("Erro de conexão com o servidor.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: "linear-gradient(135deg, #5c5cf0, #a855f7)" }}>CT</div>
          <span className="text-xl font-bold text-white">ConcursoTech</span>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  background: s === step ? "var(--primary)" : s < step ? "var(--success)" : "rgba(255,255,255,0.1)",
                  color: s <= step ? "white" : "var(--text-muted)",
                }}
              >
                {s < step ? "✓" : s}
              </div>
              {s < 2 && <div className="w-16 h-0.5" style={{ background: step > s ? "var(--primary)" : "rgba(255,255,255,0.1)" }} />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-8" style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}>
          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg text-sm bg-red-500/10 border border-red-500/50 text-red-400">
              {error}
            </div>
          )}

          {step === 1 ? (
            <>
              <h2 className="text-xl font-bold text-white mb-1">Criar sua conta</h2>
              <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Comece sua jornada rumo à aprovação</p>
              <form onSubmit={handleStep1} className="space-y-4">
                {[
                  { id: "nome", label: "Nome completo", type: "text", val: nome, set: setNome, icon: "person" },
                  { id: "email-cad", label: "E-mail", type: "email", val: email, set: setEmail, icon: "mail" },
                  { id: "senha-cad", label: "Senha", type: "password", val: senha, set: setSenha, icon: "lock" },
                ].map((f) => (
                  <div key={f.id}>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>{f.label}</label>
                    <div className="relative">
                      <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-lg" style={{ color: "var(--text-muted)" }}>{f.icon}</span>
                      <input
                        id={f.id}
                        type={f.type}
                        value={f.val}
                        onChange={(e) => f.set(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-lg text-sm"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border-subtle)", color: "var(--foreground)" }}
                        required
                      />
                    </div>
                  </div>
                ))}
                <button type="submit" id="btn-continuar" className="w-full py-3 rounded-lg font-semibold text-sm text-white mt-2" style={{ background: "linear-gradient(135deg, #5c5cf0, #7c7cf8)", boxShadow: "0 4px 20px rgba(92,92,240,0.4)" }}>
                  Continuar →
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-1">Qual é seu concurso?</h2>
              <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Vamos personalizar seu plano de estudos</p>
              <form onSubmit={handleStep2} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Concurso alvo</label>
                  <select id="sel-concurso" value={concurso} onChange={(e) => setConcurso(e.target.value)} className="w-full px-3 py-3 rounded-lg text-sm" style={{ background: "var(--surface-2)", border: "1px solid var(--border-subtle)", color: "var(--foreground)" }} required>
                    <option value="">Selecione...</option>
                    {["Serpro — Analista de TI", "Banco Central — Analista TI", "TCU — Analista de TI", "STJ — Analista Judiciário TI", "Outro"].map((c) => (<option key={c}>{c}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Data prevista da prova</label>
                  <input
                    type="date"
                    value={dataProva}
                    onChange={(e) => setDataProva(e.target.value)}
                    className="w-full px-3 py-3 rounded-lg text-sm"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border-subtle)", color: "var(--foreground)" }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Disponibilidade diária</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["1h", "2h", "3h", "4h+"].map((h) => (
                      <button
                        type="button"
                        key={h}
                        onClick={() => setHorasDia(h)}
                        className="py-2 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background: horasDia === h ? "var(--primary)" : "var(--surface-2)",
                          color: horasDia === h ? "white" : "var(--text-secondary)",
                          border: horasDia === h ? "1px solid var(--primary)" : "1px solid var(--border-subtle)"
                        }}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="submit" id="btn-iniciar" disabled={loading} className="w-full py-3 rounded-lg font-semibold text-sm text-white mt-2" style={{ background: loading ? "rgba(92,92,240,0.5)" : "linear-gradient(135deg, #5c5cf0, #7c7cf8)", boxShadow: "0 4px 20px rgba(92,92,240,0.4)" }}>
                  {loading ? "Criando seu plano..." : "🚀 Iniciar minha preparação"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--primary)" }}>Entrar</Link>
        </p>
      </div>
    </div>
  );
}
