"use client";

import { useEffect, useState } from "react";

const tipoConfig: Record<string, { color: string; bg: string; icon: string }> = {
  "Questões": { color: "#5c5cf0", bg: "rgba(92,92,240,0.1)", icon: "quiz" },
  "Vídeo/Aula": { color: "#a855f7", bg: "rgba(168,85,247,0.1)", icon: "play_circle" },
  "Revisão": { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", icon: "refresh" },
  "Completo": { color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: "assignment" },
  "Flashcards": { color: "#22c55e", bg: "rgba(34,197,94,0.1)", icon: "style" },
};

const diasLabels: Record<string, string> = {
  segunda: "Segunda-feira",
  terca: "Terça-feira",
  quarta: "Quarta-feira",
  quinta: "Quinta-feira",
  sexta: "Sexta-feira",
  sabado: "Sábado",
  domingo: "Domingo"
};

export default function PlanoPage() {
  const [plano, setPlano] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  async function fetchPlano() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/plano-estudo");
      const data = await res.json();
      if (data.plano) {
        setPlano(data.plano.atividades_json);
      }
    } catch (err) {
      console.error("Erro ao buscar plano:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchPlano();
  }, []);

  async function handleGerarPlano() {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/plano-estudo/gerar", { method: "POST" });
      const data = await res.json();
      if (data.plano) {
        setPlano(data.plano.atividades_json);
      }
    } catch (err) {
      alert("Erro ao gerar plano via IA");
    } finally {
      setIsGenerating(false);
    }
  }

  if (isGenerating) return (
    <div className="p-6 text-white text-center flex flex-col items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mb-4"></div>
      <h2 className="text-xl font-bold">O Mentor IA está analisando seu edital...</h2>
      <p className="text-sm text-gray-400 mt-2 text-balance max-w-md">
        Estamos equilibrando suas horas disponíveis com as matérias mais cobradas do seu cargo.
      </p>
    </div>
  );

  if (isLoading) return (
    <div className="p-6 text-white text-center flex flex-col items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mb-4"></div>
      <p className="text-sm text-gray-400">Carregando seu plano de estudos...</p>
    </div>
  );

  const diasOrdenados = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"];

  return (
    <div className="p-6 min-h-screen" style={{ background: "var(--background)" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Plano de Estudos Inteligente</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Cronograma personalizado gerado pelo Gemini 2.5 Flash Lite.
          </p>
        </div>
        <button 
          onClick={handleGerarPlano}
          className="px-6 py-2.5 rounded-xl font-bold text-white transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg, #5c5cf0, #a855f7)", boxShadow: "0 4px 15px rgba(92,92,240,0.3)" }}
        >
          {plano ? 'Recalibrar com IA' : 'Gerar Meu Plano com IA'}
        </button>
      </div>

      {!plano ? (
        <div className="rounded-2xl p-12 text-center border-2 border-dashed border-gray-800" style={{ background: "var(--surface)" }}>
           <span className="material-icons-round text-6xl mb-4" style={{ color: "var(--text-muted)" }}>calendar_today</span>
           <h3 className="text-xl font-bold text-white">Você ainda não tem um plano ativo</h3>
           <p className="text-sm text-gray-400 mt-2 mb-6">Clique no botão acima para que nossa IA organize sua semana de estudos hoje.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7 gap-4 items-start">
          {diasOrdenados.map((diaKey) => {
            const atividades = plano[diaKey] || [];
            return (
              <div key={diaKey} className="rounded-xl overflow-hidden min-w-0" style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}>
                <div className="flex items-center justify-between px-3 py-3" style={{ borderBottom: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.02)" }}>
                  <span className="font-bold text-[11px] text-white uppercase tracking-widest">{diasLabels[diaKey] || diaKey}</span>
                </div>
                <div className="p-2 space-y-2">
                  {atividades.length > 0 ? atividades.map((bloco: any, i: number) => {
                    const isRevisao = bloco.materia.toLowerCase().includes("revisão") || bloco.foco?.toLowerCase().includes("revisão");
                    const cfg = isRevisao ? tipoConfig["Revisão"] : tipoConfig["Questões"];
                    
                    return (
                      <div
                        key={i}
                        className="rounded-lg p-2.5 relative group transition-all hover:bg-white/[0.02]"
                        style={{
                          background: cfg.bg,
                          border: `1px solid ${cfg.color + "30"}`,
                        }}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="material-icons-round text-[12px]" style={{ color: cfg.color }}>
                            {cfg.icon}
                          </span>
                          <span className="text-[9px] font-black uppercase text-white/50">
                            {bloco.tempo}
                          </span>
                        </div>
                        <div className="font-bold text-xs text-white mb-0.5 line-clamp-2 leading-snug">{bloco.materia}</div>
                        {bloco.foco && (
                          <div className="text-[10px] leading-relaxed opacity-70 italic" style={{ color: "var(--text-secondary)" }}>
                            {bloco.foco}
                          </div>
                        )}
                      </div>
                    );
                  }) : (
                    <div className="py-4 text-center">
                       <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Descanso ou Revisão</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
