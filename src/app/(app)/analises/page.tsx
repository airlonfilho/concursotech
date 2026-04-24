"use client";

import { useState, useEffect } from "react";

const nivelConfig = {
  Crítico: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)" },
  Moderado: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
  Leve: { color: "#22c55e", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.25)" },
};

export default function AnalisesPage() {
  const [data, setData] = useState<any>(null);
  const [materias, setMaterias] = useState<string[]>(["Todas"]);
  const [selectedMateria, setSelectedMateria] = useState("Todas");
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mentoria, setMentoria] = useState<any[]>([]);
  const [isMentoriaLoading, setIsMentoriaLoading] = useState(false);

  // Fetch subjects from edital
  useEffect(() => {
    fetch("/api/edital")
      .then(r => r.json())
      .then(json => {
        if (json.edital?.materias_json) {
          setMaterias(["Todas", ...Object.keys(json.edital.materias_json)]);
        }
      });
  }, []);

  // Fetch analytics data
  async function fetchAnalytics(m: string) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics?materia=${encodeURIComponent(m)}`);
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.message || "Erro ao buscar dados");
      }

      setData(json);
      
      // Fetch Mentoria if we have data
      if (json.mapaErros?.length > 0) {
        fetchMentoria(json.mapaErros);
      } else {
        setMentoria([
            { icon: "bolt", title: "Inicie seus estudos", desc: "Comece a responder questões para gerar análises.", color: "#f59e0b" },
            { icon: "history_edu", title: "Consistência", desc: "A cada questão respondida, sua análise fica mais precisa.", color: "#5c5cf0" }
        ]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchMentoria(nivelamentos: any[]) {
    setIsMentoriaLoading(true);
    try {
      const simplified = nivelamentos.map(n => ({ m: n.materia, acertos: n.taxaAcerto, total: n.total }));
      const res = await fetch("/api/analytics/mentoria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nivelamentos: simplified })
      });
      const json = await res.json();
      if (json.mentoria) setMentoria(json.mentoria);
    } catch (err) {
      console.error(err);
    } finally {
      setIsMentoriaLoading(false);
    }
  }

  useEffect(() => {
    fetchAnalytics(selectedMateria);
  }, [selectedMateria]);

  if (error) return (
    <div className="p-6 text-white text-center flex flex-col items-center justify-center min-h-[60vh]">
      <span className="material-icons-round text-5xl text-danger mb-4">error_outline</span>
      <h2 className="text-xl font-bold mb-2">Ops! Algo deu errado</h2>
      <p className="text-sm text-gray-400 mb-6">{error}</p>
      <button 
        onClick={() => fetchAnalytics(selectedMateria)}
        className="px-6 py-2 rounded-xl bg-primary text-white text-sm font-bold"
      >
        Tentar Novamente
      </button>
    </div>
  );

  if (isLoading || !data || !data.stats) return (
    <div className="p-6 text-white text-center flex flex-col items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mb-4"></div>
      <p className="text-sm text-gray-400">Processando suas métricas de alto rendimento...</p>
    </div>
  );

  return (
    <div className="p-6 min-h-screen" style={{ background: "var(--background)" }}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-white">Análise de Desempenho</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Mapeamento técnico de lacunas de conhecimento e evolução.
          </p>
        </div>

        {/* Search Select Filter */}
        <div className="relative w-full md:w-64">
          <button
            onClick={() => setIsSelectOpen(!isSelectOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all glass border border-white/10 hover:border-primary/50"
            style={{ color: selectedMateria !== "Todas" ? "var(--primary)" : "white" }}
          >
            <div className="flex items-center gap-2">
              <span className="material-icons-round text-base opacity-70">filter_list</span>
              <span className="truncate max-w-[140px]">{selectedMateria}</span>
            </div>
            <span className={`material-icons-round transition-transform ${isSelectOpen ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </button>

          {isSelectOpen && (
            <div className="absolute top-full mt-2 left-0 right-0 z-50 rounded-xl overflow-hidden bg-[#1a1a2e] border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                 style={{ maxHeight: "300px", display: "flex", flexDirection: "column" }}>
              <div className="p-2 bg-white/5 border-b border-white/5">
                <input
                  type="text"
                  placeholder="Filtrar matéria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-primary"
                  autoFocus
                />
              </div>
              <div className="overflow-y-auto py-1">
                {materias
                  .filter(m => m.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setSelectedMateria(m);
                        setIsSelectOpen(false);
                        setSearchTerm("");
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs hover:bg-white/5 transition-colors flex items-center justify-between group"
                      style={{ color: selectedMateria === m ? "var(--primary)" : "var(--text-secondary)" }}
                    >
                      <span className="truncate">{m}</span>
                      {selectedMateria === m && <span className="material-icons-round text-[14px]">check</span>}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Questões Respondidas", value: data.stats.totalRespostas.toLocaleString("pt-BR"), icon: "quiz", color: "#5c5cf0", trend: `+${data.stats.totalRespostas}` },
          { label: "Taxa de Acerto", value: `${data.stats.taxaAcertoGeral}%`, icon: "gps_fixed", color: "#22c55e", trend: "Foco" },
          { label: "Acertos Hoje", value: data.stats.acertosHoje.toString(), icon: "check_circle", color: "#a855f7", trend: "🔥" },
          { label: "Total de Acertos", value: data.stats.totalAcertos.toLocaleString("pt-BR"), icon: "emoji_events", color: "#f59e0b", trend: "Meta" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl p-4 glass border border-white/5 relative overflow-hidden group">
            <div className="absolute -right-2 -top-2 opacity-5 scale-150 transition-transform group-hover:scale-[1.7] duration-500" style={{ color: stat.color }}>
                <span className="material-icons-round text-6xl">{stat.icon}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15`, color: stat.color }}>
                <span className="material-icons-round text-lg">{stat.icon}</span>
              </div>
              <span className="text-[10px] font-bold uppercase opacity-40 text-white tracking-widest">{stat.trend}</span>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider mt-1" style={{ color: "var(--text-muted)" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Evolução de Acertos */}
          <div className="rounded-2xl p-6 glass border border-white/5">
            <h3 className="font-bold text-white mb-8 flex items-center gap-2">
              <span className="material-icons-round text-primary text-xl">show_chart</span>
              Progresso Semanal (%)
            </h3>
            <div className="flex items-end justify-between h-40 gap-3">
              {data.progressoSemanal.map((item: any, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-3 group relative">
                  <div className="w-full bg-white/5 rounded-t-xl relative flex items-end justify-center transition-all group-hover:bg-primary/20 overflow-hidden" style={{ height: "100%" }}>
                    <div className="w-full bg-primary/40 rounded-t-lg transition-all duration-700 ease-out" style={{ height: `${item.taxa}%` }} />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-black text-white/20 group-hover:text-primary transition-colors">{item.taxa}%</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-tighter" style={{ color: "var(--text-muted)" }}>{item.dia}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mapa de Erros */}
            <div className="rounded-2xl p-6 glass border border-white/5">
                <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                    <span className="material-icons-round text-danger text-xl">report_problem</span>
                    Matérias Críticas
                </h3>
                <div className="space-y-4">
                    {data.mapaErros.length === 0 ? (
                        <div className="text-xs text-center py-10" style={{ color: "var(--text-muted)" }}>Nenhum dado registrado.</div>
                    ) : (
                        data.mapaErros.slice(0, 4).map((item: any, i: number) => {
                            const cfg = nivelConfig[item.nivel as keyof typeof nivelConfig] || nivelConfig.Leve;
                            return (
                                <div key={i} className="group cursor-default">
                                    <div className="flex justify-between text-[11px] mb-2">
                                        <span className="text-white font-medium group-hover:text-primary transition-colors truncate max-w-[150px]">{item.materia}</span>
                                        <span style={{ color: cfg.color }} className="font-bold">{item.taxaAcerto}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${item.taxaAcerto}%`, background: cfg.color }} />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Tempo Estudo */}
            <div className="rounded-2xl p-6 glass border border-white/5">
                <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                    <span className="material-icons-round text-warning text-xl">timer</span>
                    Tempo de Estudo
                </h3>
                <div className="space-y-4">
                    {data.tempoPorMateria.length === 0 ? (
                        <div className="text-xs text-center py-10" style={{ color: "var(--text-muted)" }}>Nenhum dado registrado.</div>
                    ) : (
                        data.tempoPorMateria.slice(0, 4).map((item: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 transition-all hover:bg-white/10">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[11px] font-bold text-white truncate max-w-[120px]">{item.materia}</span>
                                    <span className="text-[9px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Auditado</span>
                                </div>
                                <span className="font-black text-xs text-primary">{item.horasStr}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Mentoria IA */}
          <div className="rounded-2xl p-6 glass border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse">
                 <span className="material-icons-round text-white text-xl">auto_awesome</span>
              </div>
              <div>
                 <span className="font-bold text-white block">Planos de Ação</span>
                 <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "var(--primary)" }}>Gerado por IA</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {isMentoriaLoading ? (
                  <div className="space-y-3 py-4">
                      <div className="h-24 w-full bg-white/5 animate-pulse rounded-2xl" />
                      <div className="h-24 w-full bg-white/5 animate-pulse rounded-2xl" />
                  </div>
              ) : mentoria.map((action: any, i: number) => (
                <div key={i} className="rounded-2xl p-4 bg-black/30 border border-white/5 border-l-4 transition-all hover:-translate-y-1" style={{ borderLeftColor: action.color }}>
                  <div className="flex items-start gap-3">
                    <span className="material-icons-round text-lg mt-0.5" style={{ color: action.color }}>{action.icon}</span>
                    <div>
                      <div className="font-bold text-sm text-white mb-1">{action.title}</div>
                      <div className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{action.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-6 glass border border-white/5 relative overflow-hidden group">
             <div className="absolute right-0 bottom-0 opacity-10 group-hover:scale-110 transition-transform">
                <span className="material-icons-round text-7xl">psychology</span>
             </div>
             <h4 className="text-white font-bold text-sm mb-3">Auditoria de Foco</h4>
             <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Sua precisão nas questões de **AVANÇADO** está em **92%**. O algoritmo recomenda que você aumente a dificuldade das sessões de {selectedMateria === "Todas" ? "Informática" : selectedMateria}.
             </p>
          </div>

          <button 
            onClick={() => fetchAnalytics(selectedMateria)}
            className="w-full py-3 rounded-2xl text-xs font-bold text-white transition-all hover:bg-white/10 border border-white/10"
          >
            Sincronizar Métricas
          </button>
        </div>
      </div>
    </div>
  );
}
