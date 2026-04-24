"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const materiasBaseDefault = [
  "Português",
  "Dir. Administrativo",
  "Dir. Constitucional",
  "Raciocínio Lógico",
  "Informática",
];

const niveis = [
  { val: "INICIANTE", label: "Iniciante", icon: "🥉", desc: "Nunca vi ou vi pouco do conteúdo." },
  { val: "INTERMEDIARIO", label: "Intermediário", icon: "🥈", desc: "Já estudei, mas erro muito na prática." },
  { val: "AVANCADO", label: "Avançado", icon: "🥇", desc: "Domínio total, foco em revisões." },
];

export default function NivelamentoPage() {
  const router = useRouter();
  const [data, setData] = useState<Record<string, string>>({});
  const [materias, setMaterias] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        // 1. Tenta pegar disciplinas do edital
        const resEdital = await fetch("/api/edital");
        const jsonEdital = await resEdital.json();
        let listaMaterias = materiasBaseDefault;

        if (jsonEdital.edital?.materias_json) {
          listaMaterias = Object.keys(jsonEdital.edital.materias_json);
        }
        setMaterias(listaMaterias);

        // 2. Tenta pegar nivelamentos salvos
        const res = await fetch("/api/nivelamento");
        const json = await res.json();
        
        if (json.nivelamentos?.length) {
          const mapped = json.nivelamentos.reduce((acc: any, curr: any) => {
            acc[curr.materia] = curr.nivel;
            return acc;
          }, {});
          setData(mapped);
        } else {
          // Default all to INICIANTE para as matérias identificadas
          setData(listaMaterias.reduce((acc: any, m) => { acc[m] = "INICIANTE"; return acc; }, {}));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const payload = Object.entries(data).map(([materia, nivel]) => ({ materia, nivel }));
      const res = await fetch("/api/nivelamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nivelamentos: payload })
      });
      if (res.ok) {
        router.push("/dashboard");
      }
    } catch (err) {
      alert("Erro ao salvar nivelamento");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 text-white">Carregando formulário...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto min-h-screen">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Seu Radar de Conhecimento 🛰️</h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Defina seu nível em cada matéria para que a **IA ConcursoTech** monte o plano de estudos perfeito para você.
        </p>
      </div>

      <div className="space-y-6">
        {materias.map((materia) => (
          <div 
            key={materia} 
            className="rounded-2xl p-6 transition-all" 
            style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="material-icons-round text-primary text-base">library_books</span>
                  {materia}
                </h3>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Selecione seu nível atual de domínio.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-shrink-0">
                {niveis.map((n) => {
                  const isActive = data[materia] === n.val;
                  return (
                    <button
                      key={n.val}
                      onClick={() => setData({ ...data, [materia]: n.val })}
                      className="px-4 py-2.5 rounded-xl text-left transition-all border relative overflow-hidden group"
                      style={{
                        background: isActive ? "rgba(92,92,240,0.1)" : "rgba(255,255,255,0.02)",
                        borderColor: isActive ? "var(--primary)" : "var(--border-subtle)",
                        color: isActive ? "white" : "var(--text-secondary)"
                      }}
                    >
                      <div className="flex gap-2 items-center">
                        <span className="text-sm">{n.icon}</span>
                        <div className="flex flex-col">
                           <span className="text-xs font-bold leading-tight">{n.label}</span>
                        </div>
                      </div>
                      {isActive && (
                        <div 
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full" 
                          style={{ background: "var(--primary)" }} 
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 mb-20 flex justify-center">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-12 py-4 rounded-2xl font-bold text-white transition-all transform hover:scale-[1.05] active:scale-95 disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #5c5cf0, #a855f7)",
            boxShadow: "0 8px 32px rgba(92,92,240,0.3)"
          }}
        >
          {saving ? "Salvando Trilhas..." : "Confirmar e Montar Meu Plano 🚀"}
        </button>
      </div>
    </div>
  );
}
