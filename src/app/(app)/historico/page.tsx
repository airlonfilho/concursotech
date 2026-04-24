"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function HistoricoPage() {
  const [sessoes, setSessoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/sessoes");
        const json = await res.json();
        if (json.sessoes) setSessoes(json.sessoes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getTipoLabel = (tipo: string) => {
    const config: Record<string, { label: string; icon: string; color: string }> = {
      "QUESTOES": { label: "Questões", icon: "quiz", color: "#5c5cf0" },
      "FLASHCARDS": { label: "Flashcards", icon: "style", color: "#a855f7" },
      "AULA": { label: "Aula / Vídeo", icon: "play_circle", color: "#ef4444" },
    };
    return config[tipo] || { label: tipo, icon: "history", color: "var(--text-muted)" };
  };

  if (loading) return <div className="p-6 text-white">Carregando histórico...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Log de Estudos 🗓️</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Histórico detalhado de todas as suas sessões e progresso.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">search</span>
          <input 
            type="text"
            placeholder="Filtrar por matéria ou tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>
      </div>

      <div className="space-y-4">
        {sessoes
          .filter(s => 
            (s.materia?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
            getTipoLabel(s.tipo).label.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .length === 0 ? (
          <div className="text-center py-20 text-muted" style={{ color: "var(--text-muted)" }}>Nenhum registro encontrado.</div>
        ) : (
          sessoes
            .filter(s => 
              (s.materia?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
              getTipoLabel(s.tipo).label.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((sessao) => {
              const config = getTipoLabel(sessao.tipo);
              const durationArr = sessao.fim ? 
                Math.floor((new Date(sessao.fim).getTime() - new Date(sessao.inicio).getTime()) / 60000) : 0;

              return (
                <div 
                  key={sessao.id} 
                  className="rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-white/[0.04] glass group"
                  style={{ border: "1px solid var(--border-subtle)" }}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white relative overflow-hidden" 
                      style={{ background: `${config.color}15`, border: `1px solid ${config.color}30` }}
                    >
                      <span className="material-icons-round text-2xl relative z-10" style={{ color: config.color }}>{config.icon}</span>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-lg text-white">{config.label}</h3>
                        {sessao.materia && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-white/5 text-primary border border-primary/20">
                            {sessao.materia}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs" style={{ color: "var(--text-muted)" }}>
                        <div className="flex items-center gap-1.5">
                          <span className="material-icons-round text-sm">schedule</span>
                          <span>{formatDistanceToNow(new Date(sessao.inicio), { addSuffix: true, locale: ptBR })}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="material-icons-round text-sm">timer</span>
                          <span>{durationArr > 0 ? `${durationArr} min` : (sessao.fim ? 'Menos de 1 min' : 'Em andamento...')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-8 text-right bg-white/5 md:bg-transparent p-3 md:p-0 rounded-xl">
                    {(sessao.tipo === "QUESTOES" || sessao.tipo === "FLASHCARDS") && (
                      <div className="flex flex-col items-start md:items-end">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-black text-success">{sessao.acertos}</span>
                            <span className="text-[10px] uppercase font-bold opacity-40 text-success">Acertou</span>
                          </div>
                          <div className="w-px h-6 bg-white/10" />
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-black text-danger">{sessao.erros}</span>
                            <span className="text-[10px] uppercase font-bold opacity-40 text-danger">Errou</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col items-end min-w-[70px]">
                      <span className="text-2xl font-black text-primary" style={{ textShadow: "0 0 15px rgba(92,92,240,0.3)" }}>+{sessao.xp_ganho}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">Pontos XP</span>
                    </div>
                    <span className="material-icons-round text-white/10 group-hover:text-white/30 transition-colors cursor-pointer hidden md:block">chevron_right</span>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
