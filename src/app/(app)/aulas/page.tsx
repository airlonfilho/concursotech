"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type AiVideoNotes = {
  resumo: string;
  notas: Array<{
    timestamp: string;
    titulo: string;
    explicacao: string;
  }>;
  revisao_rapida: string[];
};

export default function AulasPage() {
  return (
    <Suspense fallback={<div className="p-6 text-white text-center">Carregando...</div>}>
      <AulasContent />
    </Suspense>
  )
}

function AulasContent() {
  const searchParams = useSearchParams();
  const materiaQuery = searchParams.get("materia");

  const [aulas, setAulas] = useState<any[]>([]);
  const [materias, setMaterias] = useState<string[]>([]);
  const [topicos, setTopicos] = useState<string[]>([]);
  const [materiaAtiva, setMateriaAtiva] = useState<string>(materiaQuery || "");
  const [topicoAtivo, setTopicoAtivo] = useState<string>("");
  const [planoHoje, setPlanoHoje] = useState<string[]>([]);
  const [showMateriaSelect, setShowMateriaSelect] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [playing, setPlaying] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSessaoId, setCurrentSessaoId] = useState<string | null>(null);
  const [concluidos, setConcluidos] = useState<Set<string>>(new Set());
  const [concluding, setConcluding] = useState<string | null>(null);
  const [aiNotesByVideo, setAiNotesByVideo] = useState<Record<string, AiVideoNotes>>({});
  const [loadingAiNotes, setLoadingAiNotes] = useState(false);
  const [aiNotesError, setAiNotesError] = useState<string | null>(null);

  const [duration, setDuration] = useState<string>("medium");

  // Carregar progresso do edital
  async function fetchProgresso() {
    try {
      const res = await fetch('/api/edital/concluir');
      if (res.ok) {
        const data = await res.json();
        const keys = new Set<string>();
        data.progressos.forEach((p: any) => {
          keys.add(`${p.materia}|${p.topico}`);
        });
        setConcluidos(keys);
      }
    } catch (err) {
      console.error('Erro ao buscar progresso:', err);
    }
  }

  useEffect(() => {
    fetchProgresso();
  }, []);

  // Marcar/desmarcar tópico como concluído
  async function toggleConclusao(materia: string, topico: string) {
    setConcluding(`${materia}|${topico}`);
    try {
      const res = await fetch('/api/edital/concluir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materia, topico }),
      });
      const data = await res.json();
      if (data.success) {
        const key = `${materia}|${topico}`;
        setConcluidos(prev => {
          const newSet = new Set(prev);
          if (data.concluso) {
            newSet.add(key);
          } else {
            newSet.delete(key);
          }
          return newSet;
        });
      }
    } catch (err) {
      console.error('Erro ao marcar conclusão:', err);
    } finally {
      setConcluding(null);
    }
  }

  async function fetchAulas(materia?: string, customDuration?: string, topico?: string) {
    setIsLoading(true);
    const d = customDuration || duration;
    const m = materia || materiaAtiva;
    const t = topico !== undefined ? topico : topicoAtivo;

    try {
      const params = new URLSearchParams();
      if (m) params.append("materia", m);
      if (d) params.append("duration", d);
      if (t) params.append("topico", t);

      const url = `/api/aulas?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.videos) setAulas(data.videos);
      if (data.materias) setMaterias(data.materias);
      if (data.topicos_materia) setTopicos(data.topicos_materia);
      if (data.materia_ativa) setMateriaAtiva(data.materia_ativa);
      if (data.topico_atual) setTopicoAtivo(data.topico_atual);
      if (data.plano_hoje) setPlanoHoje(data.plano_hoje);

    } catch (err) {
      console.error("Erro ao buscar aulas:", err);
    } finally {
      setIsLoading(false);
    }
  }

  function handleDurationSwitch(newD: string) {
    setDuration(newD);
    fetchAulas(materiaAtiva, newD, topicoAtivo);
  }

  useEffect(() => {
    fetchAulas(materiaQuery || undefined);
  }, [materiaQuery]);

  async function handlePlay(videoId: string) {
    setPlaying(videoId);
    setAiNotesError(null);
    const aulaAtual = aulas.find(v => v.id === videoId);

    try {
      const res = await fetch("/api/sessao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "AULA",
          materia: aulaAtual?.materia || materiaAtiva
        })
      });
      const data = await res.json();
      if (data.sessao) setCurrentSessaoId(data.sessao.id);
    } catch (err) {
      console.error(err);
    }

    if (!aiNotesByVideo[videoId]) {
      fetchCachedAiNotes(videoId);
    }
  }

  async function fetchCachedAiNotes(videoId: string) {
    try {
      const res = await fetch(`/api/aulas/notes?videoId=${encodeURIComponent(videoId)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.notes) {
        setAiNotesByVideo(prev => ({ ...prev, [videoId]: data.notes }));
      }
    } catch (err) {
      console.error("Erro ao buscar AI Notes em cache:", err);
    }
  }

  async function handleGenerateAiNotes() {
    if (!playing) return;

    const aulaAtual = aulas.find(v => v.id === playing);
    if (!aulaAtual) return;

    setLoadingAiNotes(true);
    setAiNotesError(null);

    try {
      const res = await fetch("/api/aulas/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: aulaAtual.id,
          titulo: aulaAtual.titulo,
          materia: aulaAtual.materia,
          topico: aulaAtual.topico,
          canal: aulaAtual.canal,
          descricao: aulaAtual.descricao,
          thumb: aulaAtual.thumb,
          duracao: aulaAtual.duracao,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.notes) {
        setAiNotesError(data.message || "Não foi possível gerar o resumo por IA.");
        return;
      }

      setAiNotesByVideo(prev => ({ ...prev, [aulaAtual.id]: data.notes }));
    } catch (err) {
      setAiNotesError("Erro de conexão ao gerar resumo por IA.");
    } finally {
      setLoadingAiNotes(false);
    }
  }

  async function handleStop() {
    if (currentSessaoId) {
      try {
        await fetch(`/api/sessao/${currentSessaoId}/finalizar`, { method: "POST" });
        setCurrentSessaoId(null);
      } catch (err) {
        console.error(err);
      }
    }
    setPlaying(null);
  }

  function handleSwitchMateria(m: string) {
    setMateriaAtiva(m);
    setTopicoAtivo("");
    setPlaying(null);
    fetchAulas(m, duration, "");
  }

  function handleSwitchTopico(t: string) {
    setTopicoAtivo(t);
    setPlaying(null);
    fetchAulas(materiaAtiva, duration, t);
  }

  if (isLoading) return <div className="p-6 text-white text-center">Carregando aulas personalizadas...</div>;

  if (aulas.length === 0) {
    return (
      <div className="p-6 text-center text-white">
        <h2 className="text-xl font-bold">Nenhuma aula encontrada para seu concurso</h2>
        <p className="text-sm text-gray-400">Verifique se o seu cargo e as matérias estão configurados.</p>
      </div>
    );
  }

  const featured = aulas[0];
  const currentVideo = playing ? aulas.find(v => v.id === playing) : null;
  const currentAiNotes = currentVideo ? aiNotesByVideo[currentVideo.id] : null;
  const isMateriaNoPlano = (m: string) => planoHoje.includes(m);

  return (
    <div className="p-6 min-h-screen" style={{ background: "var(--background)" }}>
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Aulas
            {isMateriaNoPlano(materiaAtiva) && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary-light border border-primary/30 font-bold uppercase tracking-wider">
                Foco de Hoje
              </span>
            )}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {topicoAtivo ? (
              <>Focando em: <span className="text-white font-medium">{topicoAtivo}</span> (Edital)</>
            ) : (
              "Foque nos conteúdos específicos do seu edital"
            )}
          </p>
        </div>

        {/* Filtro Searchable Select + Duration */}
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">

          <div className="flex bg-[#1a1a2e] border border-white/10 rounded-xl p-1">
            <button
              onClick={() => handleDurationSwitch("medium")}
              className={`px-3 py-2 text-[10px] font-bold rounded-lg transition-all ${duration === 'medium' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              AULAS MÉDIAS
            </button>
            <button
              onClick={() => handleDurationSwitch("long")}
              className={`px-3 py-2 text-[10px] font-bold rounded-lg transition-all ${duration === 'long' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              APROFUNDADAS
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5 block ml-1 md:hidden">Disciplina</label>
            <div
              className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-3 text-sm text-white flex items-center justify-between cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => setShowMateriaSelect(!showMateriaSelect)}
            >
              <span className="truncate flex items-center gap-2">
                {materiaAtiva || "Todas as Matérias"}
                {isMateriaNoPlano(materiaAtiva) && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
              </span>
              <span className="material-icons-round text-gray-500 transition-transform" style={{ transform: showMateriaSelect ? 'rotate(180deg)' : 'none' }}>expand_more</span>
            </div>

            {showMateriaSelect && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-2 border-b border-white/5">
                  <div className="relative">
                    <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">search</span>
                    <input
                      type="text"
                      placeholder="Buscar matéria..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-primary/30"
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto scrollbar-thin">
                  {materias
                    .filter(m => m.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((m) => {
                      const isRecommended = isMateriaNoPlano(m);
                      return (
                        <div
                          key={m}
                          className={`px-4 py-3 text-sm cursor-pointer transition-colors hover:bg-white/5 flex items-center justify-between ${materiaAtiva === m ? 'bg-primary/10 text-primary' : 'text-gray-300'}`}
                          onClick={() => {
                            handleSwitchMateria(m);
                            setShowMateriaSelect(false);
                            setSearchTerm("");
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {m}
                            {isRecommended && (
                              <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30 font-bold uppercase">PLANO</span>
                            )}
                          </div>
                          {materiaAtiva === m && <span className="material-icons-round text-sm">check</span>}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Topics Selector */}
      {topicos.length > 0 && (
        <div className="mb-6 overflow-x-auto scrollbar-none pb-2 -mx-6 px-6 md:mx-0 md:px-0">
          <div className="flex items-center gap-2 w-max">
            {topicos.map((t) => (
              <button
                key={t}
                onClick={() => handleSwitchTopico(t)}
                className={`px-4 py-2 text-xs font-semibold rounded-full transition-all whitespace-nowrap ${
                  topicoAtivo === t
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-[#1a1a2e] text-gray-400 border border-white/5 hover:border-primary/30 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}


      {/* Featured player / Iframe Area */}
      <div className="rounded-2xl overflow-hidden mb-6" style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}>
        {playing ? (
          <div className="w-full relative" style={{ paddingTop: "56.25%" }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={`https://www.youtube.com/embed/${playing}?autoplay=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          /* Video preview area with play button overlay */
          <div
            className="relative flex items-center justify-center cursor-pointer group"
            style={{
              background: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${featured.thumb})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              height: 360
            }}
            onClick={() => handlePlay(featured.id)}
          >
            <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 50% 50%, rgba(92,92,240,0.5), transparent 70%)" }} />
            <div className="relative z-10 flex flex-col items-center gap-4 text-center px-6">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: "rgba(92,92,240,0.3)", border: "2px solid rgba(92,92,240,0.6)", backdropFilter: "blur(5px)" }}
              >
                <span className="material-icons-round text-4xl" style={{ color: "white", marginLeft: 4 }}>
                  play_arrow
                </span>
              </div>
              <div>
                <div className="font-semibold text-white text-lg line-clamp-2 max-w-2xl">{featured.titulo}</div>
                <div className="text-sm mt-1 flex items-center justify-center gap-2" style={{ color: "var(--text-secondary)" }}>
                  <span>{featured.canal}</span>
                  <span>•</span>
                  <span className="text-primary-light font-medium">{featured.materia}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info panel below video */}
        <div className="flex items-center gap-4 px-6 py-4" style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--surface-2)" }}>
          <div className="flex-1">
            <div className="text-sm font-semibold text-white truncate">{playing ? aulas.find(v => v.id === playing)?.titulo : featured.titulo}</div>
            <div className="text-xs flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
              <span>{playing ? aulas.find(v => v.id === playing)?.canal : featured.canal}</span>
              {isMateriaNoPlano(materiaAtiva) && (
                <span className="text-[10px] text-amber-500 font-bold">• Sugerido pelo seu Plano IA</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {playing && (() => {
              const aulaAtual = aulas.find(v => v.id === playing);
              const key = aulaAtual ? `${aulaAtual.materia}|${aulaAtual.topico}` : null;
              const isConcluido = key ? concluidos.has(key) : false;
              const isLoading = concluding === key;

              return (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (aulaAtual?.topico) {
                      toggleConclusao(aulaAtual.materia, aulaAtual.topico);
                    }
                  }}
                  disabled={isLoading || !aulaAtual?.topico}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${isConcluido
                      ? 'bg-success/20 text-success border border-success/30 hover:bg-success/30'
                      : 'bg-primary/20 text-primary-light border border-primary/30 hover:bg-primary/30'
                    }`}
                >
                  {isLoading ? (
                    <span className="material-icons-round text-sm animate-spin">progress_activity</span>
                  ) : isConcluido ? (
                    <>
                      <span className="material-icons-round text-sm">check_circle</span>
                      Concluído
                    </>
                  ) : (
                    <>
                      <span className="material-icons-round text-sm">check</span>
                      Marcar como Concluído
                    </>
                  )}
                </button>
              );
            })()}
            {playing && (
              <button
                onClick={handleStop}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid var(--border-subtle)", color: "white" }}
              >
                Parar Aula
              </button>
            )}
            {playing && (
              <button
                onClick={handleGenerateAiNotes}
                disabled={loadingAiNotes}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-60"
                style={{
                  background: "rgba(92,92,240,0.2)",
                  border: "1px solid rgba(92,92,240,0.4)",
                  color: "#d8d8ff",
                }}
              >
                {loadingAiNotes ? (
                  <span className="material-icons-round text-sm animate-spin">progress_activity</span>
                ) : (
                  <span className="material-icons-round text-sm">auto_awesome</span>
                )}
                {currentAiNotes ? "Atualizar Resumo IA" : "Gerar Resumo por IA"}
              </button>
            )}
          </div>
        </div>
      </div>

      {playing && (
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="material-icons-round text-primary-light">auto_awesome</span>
            <h3 className="text-white font-semibold">AI Notes da Aula</h3>
          </div>

          {aiNotesError && (
            <div className="mb-3 text-sm px-3 py-2 rounded-lg bg-danger/10 border border-danger/20 text-danger">
              {aiNotesError}
            </div>
          )}

          {loadingAiNotes && !currentAiNotes && (
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Gerando resumo estruturado com timestamps...
            </div>
          )}

          {!loadingAiNotes && !currentAiNotes && (
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Clique em <strong>Gerar Resumo por IA</strong> para criar notas da aula atual.
            </div>
          )}

          {currentAiNotes && (
            <div className="space-y-4">
              <div className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {currentAiNotes.resumo}
              </div>

              <div className="space-y-2">
                {currentAiNotes.notas.map((nota, idx) => (
                  <div
                    key={`${nota.timestamp}-${idx}`}
                    className="rounded-xl p-3"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border-subtle)" }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/20 text-primary-light border border-primary/30 font-bold">
                        {nota.timestamp}
                      </span>
                      <span className="text-sm font-semibold text-white">{nota.titulo}</span>
                    </div>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {nota.explicacao}
                    </p>
                  </div>
                ))}
              </div>

              {currentAiNotes.revisao_rapida?.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                    Revisão Rápida
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentAiNotes.revisao_rapida.map((item, idx) => (
                      <span
                        key={`${item}-${idx}`}
                        className="text-xs px-2.5 py-1 rounded-full"
                        style={{
                          background: "rgba(92,92,240,0.12)",
                          border: "1px solid rgba(92,92,240,0.2)",
                          color: "#c9c9ff",
                        }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Aulas list */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-white flex items-center gap-2">
          Aulas Sugeridas
          <span className="material-icons-round text-sm text-primary">auto_awesome</span>
        </h2>
        <div className="flex items-center gap-1.5 text-[9px] font-bold text-success uppercase tracking-widest bg-success/10 px-2 py-0.5 rounded border border-success/20">
          <span className="material-icons-round text-[10px]">verified</span>
          Priorizando Didática e Teoria
        </div>
      </div>
      <div className="space-y-3">
        {aulas.map((aula) => (
          <div
            key={aula.id}
            onClick={() => handlePlay(aula.id)}
            className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all hover:translate-x-1 ${playing === aula.id ? 'ring-2 ring-primary scale-[1.01]' : 'opacity-80 hover:opacity-100'}`}
            style={{
              background: playing === aula.id ? "rgba(92,92,240,0.15)" : "var(--surface)",
              border: "1px solid var(--border-subtle)"
            }}
          >
            <div
              className="w-20 h-14 rounded-lg flex-shrink-0 relative overflow-hidden"
            >
              <img src={aula.thumb} alt={aula.titulo} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <span className="material-icons-round text-white text-xl">play_circle</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-white truncate">{aula.titulo}</div>
              <div className="text-xs mt-0.5 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                <span>{aula.canal}</span>
                <span>•</span>
                <span className={isMateriaNoPlano(aula.materia) ? "text-amber-500 font-medium" : ""}>{aula.materia}</span>
                {aula.no_plano_hoje && <span className="material-icons-round text-[12px] text-amber-500">stars</span>}
              </div>
            </div>
            <span className="material-icons-round text-sm" style={{ color: "var(--text-muted)" }}>play_lesson</span>
          </div>
        ))}
      </div>
    </div>
  );
}

