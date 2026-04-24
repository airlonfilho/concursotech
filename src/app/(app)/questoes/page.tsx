"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function QuestoesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-white text-center">Carregando questões...</div>}>
      <QuestoesContent />
    </Suspense>
  )
}

function QuestoesContent() {
  const searchParams = useSearchParams();
  const materiaQuery = searchParams.get("materia");

  const [questoes, setQuestoes] = useState<any[]>([]);
  const [materias, setMaterias] = useState<string[]>(["Todas"]);
  const [materia, setMateria] = useState(materiaQuery || "Todas");
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sessaoId, setSessaoId] = useState<string | null>(null);
  const [sessaoStats, setSessaoStats] = useState({ total: 0, acertos: 0, tempo: "00:00" });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [resultData, setResultData] = useState<any>(null);

  async function initSessao() {
    try {
      const resSessao = await fetch('/api/sessao', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'QUESTOES' })
      });
      const dataSessao = await resSessao.json();
      if (dataSessao.sessao) setSessaoId(dataSessao.sessao.id);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchQuestoes() {
    try {
      const resQuest = await fetch(`/api/questoes?materia=${materia}`);
      const dataQuest = await resQuest.json();
      setQuestoes(dataQuest.questoes || []);
      if (dataQuest.materias) {
        setMaterias(dataQuest.materias);
      }
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowAI(false);
    } catch (err) {
      console.error(err);
    }
  }

  // Inicializa Sessão
  useEffect(() => {
    initSessao();
  }, []);

  // Busca Questoes quando mudar a materia
  useEffect(() => {
    fetchQuestoes();
  }, [materia]);

  // Sincroniza estado com query params
  useEffect(() => {
    if (materiaQuery && materiaQuery !== materia) {
      setMateria(materiaQuery);
    }
  }, [materiaQuery]);


  const questao = questoes[currentIndex];

  function extractSqlSnippet(text: string) {
    const sqlStartRegex = /\b(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE|WITH)\b/i;
    const match = text.match(sqlStartRegex);

    if (!match || match.index === undefined) {
      return null;
    }

    const codeStart = match.index;
    const before = text.slice(0, codeStart).trimEnd();
    const code = text.slice(codeStart).trim();

    return {
      before,
      code,
    };
  }

  function extractCodeSnippet(text: string) {
    const sqlSnippet = extractSqlSnippet(text);
    if (sqlSnippet) {
      return sqlSnippet;
    }

    const trimmed = text.trim();
    const hasSqlClausePattern = /\b[a-z_][a-z0-9_]*\s*(=|<>|!=|<=|>=|<|>)\s*([a-z_][a-z0-9_]*|\d+|'.*?'|".*?")\s*;?$/i.test(trimmed);
    const hasSqlOperators = /\b(LIKE|IN|IS\s+NULL|IS\s+NOT\s+NULL)\b/i.test(trimmed);

    if (hasSqlClausePattern || hasSqlOperators) {
      return {
        before: "",
        code: trimmed,
      };
    }

    return null;
  }

  async function handleAnswer(id: string) {
    if (showResult || !sessaoId || !questao) return;
    setSelectedAnswer(id);
    
    try {
      const res = await fetch(`/api/questoes/${questao.id}/responder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessao_id: sessaoId,
          alternativa_marcada: id,
          tempo_segundos: 25 // Simulado 25s
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Erro remoto.");
      }

      setResultData(data.resultado);
      setShowResult(true);
      setShowAI(true);
      
      setSessaoStats((prev: any) => ({
        ...prev,
        total: prev.total + 1,
        acertos: data.resultado.acertou ? prev.acertos + 1 : prev.acertos
      }));
    } catch (err) {
      console.error(err);
    }
  }

  async function finalizarSessao() {
    if (!sessaoId) return;
    try {
      const res = await fetch(`/api/sessao/${sessaoId}/finalizar`, { method: "POST" });
      if (res.ok) {
        alert("Sessão finalizada com sucesso! Verifique seu histórico.");
        setSessaoId(null);
        setSessaoStats({ total: 0, acertos: 0, tempo: "00:00" });
      }
    } catch (err) {
      console.error(err);
    }
  }

  function handleNext() {
    setSelectedAnswer(null);
    setShowResult(false);
    setShowAI(false);
    setResultData(null);
    setCurrentIndex((prev: number) => (prev + 1) % questoes.length);
  }

  // Limpando o import não utilizado de dados falsos e bloqueio antes do Load:
  if (questoes.length === 0) return <div className="p-6 text-white">Carregando questões...</div>;

  const enunciadoComSql = extractCodeSnippet(questao.enunciado);

  return (
    <div className="p-6 min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
        <div className="flex items-center gap-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Resolução de Questões</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {questao.materia} • {questao.banca} {questao.ano}
            </p>
          </div>

          {/* Filto de Matéria - Search Select */}
          <div className="relative min-w-[240px]">
            <button
              onClick={() => setIsSelectOpen(!isSelectOpen)}
              className="w-full flex items-center justify-between px-4 py-2 rounded-xl text-sm transition-all duration-200"
              style={{ 
                background: "rgba(255,255,255,0.03)", 
                border: `1px solid ${isSelectOpen ? "var(--primary)" : "var(--border-subtle)"}`,
                color: materia === "Todas" ? "var(--text-secondary)" : "white",
                boxShadow: isSelectOpen ? "0 0 20px rgba(92, 92, 240, 0.2)" : "none"
              }}
            >
              <div className="flex items-center gap-2">
                <span className="material-icons-round text-base" style={{ color: "var(--primary)" }}>menu_book</span>
                <span className="font-medium">{materia}</span>
              </div>
              <span className={`material-icons-round transition-transform duration-200 text-sm ${isSelectOpen ? 'rotate-180' : ''}`} style={{ color: "var(--text-muted)" }}>
                expand_more
              </span>
            </button>

            {isSelectOpen && (
              <div 
                className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl overflow-hidden shadow-2xl transition-all duration-200 bg-[#1a1a2e] border border-white/10"
                style={{ 
                  maxHeight: "350px",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                  minWidth: "280px"
                }}
              >
                {/* Search Input */}
                <div className="p-3 border-b border-white/5 bg-white/5">
                  <div className="relative">
                    <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-muted)" }}>
                      search
                    </span>
                    <input
                      autoFocus
                      type="text"
                      placeholder="Pesquisar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/50 transition-all"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>

                {/* List */}
                <div className="overflow-y-auto py-1 custom-scrollbar">
                  {materias
                    .filter(m => m.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setMateria(m);
                        setIsSelectOpen(false);
                        setSearchTerm("");
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors flex items-center justify-between"
                      style={{ 
                        color: materia === m ? "var(--primary)" : "var(--text-secondary)",
                        background: materia === m ? "rgba(92,92,240,0.05)" : "transparent"
                      }}
                    >
                      <span>{m}</span>
                      {materia === m && (
                        <span className="material-icons-round text-sm">check</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-4 px-4 py-2 rounded-lg text-sm"
            style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
          >
            <span className="flex items-center gap-1.5">
              <span className="material-icons-round text-base" style={{ color: "var(--success)" }}>
                check_circle
              </span>
              <span className="font-semibold" style={{ color: "var(--success)" }}>
                {sessaoStats.acertos}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-icons-round text-base" style={{ color: "var(--danger)" }}>
                cancel
              </span>
              <span className="font-semibold" style={{ color: "var(--danger)" }}>
                {sessaoStats.total - sessaoStats.acertos}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-icons-round text-base" style={{ color: "var(--text-muted)" }}>
                schedule
              </span>
              <span style={{ color: "var(--text-secondary)" }}>{sessaoStats.tempo}</span>
            </span>
          </div>
          <button
            className="flex items-center gap-1.5 p-2 rounded-lg text-sm transition-all hover:opacity-80"
            title="Reportar Erro"
            style={{
              background: "rgba(239,68,68,0.1)",
              color: "#ef4444",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <span className="material-icons-round text-base">flag</span>
          </button>
        </div>
      </div>



      <div className="grid grid-cols-12 gap-4">

        {/* Question */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            <span
              className="badge"
              style={{
                background: "rgba(92,92,240,0.15)",
                color: "var(--primary-light)",
                border: "1px solid rgba(92,92,240,0.25)",
              }}
            >
              {questao.banca}
            </span>
            <span
              className="badge"
              style={{
                background: "rgba(255,255,255,0.05)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {questao.ano}
            </span>
            <span
              className="badge"
              style={{
                background: "rgba(255,255,255,0.05)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {questao.cargo}
            </span>
            <span
              className="badge"
              style={{
                background:
                  questao.dificuldade === "Difícil"
                    ? "rgba(239,68,68,0.1)"
                    : "rgba(245,158,11,0.1)",
                color: questao.dificuldade === "Difícil" ? "#ef4444" : "#f59e0b",
                border: `1px solid ${questao.dificuldade === "Difícil" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
              }}
            >
              {questao.dificuldade}
            </span>
          </div>

          {/* Question text */}
          <div
            className="rounded-xl p-6"
            style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
          >
            {enunciadoComSql ? (
              <div className="space-y-4">
                {enunciadoComSql.before && (
                  <p className="leading-relaxed whitespace-pre-line" style={{ color: "var(--foreground)", lineHeight: 1.7 }}>
                    {enunciadoComSql.before}
                  </p>
                )}

                <div
                  className="rounded-lg p-4 overflow-x-auto"
                  style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)" }}
                >
                  <code className="text-sm text-white font-mono whitespace-pre-wrap break-words">
                    {enunciadoComSql.code}
                  </code>
                </div>
              </div>
            ) : (
              <p className="leading-relaxed whitespace-pre-line" style={{ color: "var(--foreground)", lineHeight: 1.7 }}>
                {questao.enunciado}
              </p>
            )}
          </div>

          {/* Alternatives */}
          <div className="space-y-2">
            {questao.alternativas.map((alt: any) => {
              const alternativaComCodigo = extractCodeSnippet(alt.texto);
              const isSelected = selectedAnswer === alt.id;
              const isCorrect = alt.id === resultData?.gabarito;
              let borderColor = "var(--border-subtle)";
              let bg = "var(--surface)";
              let textColor = "var(--foreground)";
              let labelColor = "var(--text-muted)";

              if (showResult) {
                if (isCorrect) {
                  borderColor = "var(--success)";
                  bg = "rgba(34,197,94,0.08)";
                  textColor = "var(--success)";
                  labelColor = "var(--success)";
                } else if (isSelected && !isCorrect) {
                  borderColor = "var(--danger)";
                  bg = "rgba(239,68,68,0.08)";
                  textColor = "var(--danger)";
                  labelColor = "var(--danger)";
                }
              } else if (isSelected) {
                borderColor = "var(--primary)";
                bg = "rgba(92,92,240,0.08)";
              }

              return (
                <button
                  key={alt.id}
                  id={`alt-${alt.id}`}
                  onClick={() => handleAnswer(alt.id)}
                  className="w-full flex items-start gap-4 p-4 rounded-xl text-left transition-all duration-200 hover:opacity-90"
                  style={{ background: bg, border: `1px solid ${borderColor}` }}
                >
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                    style={{
                      background: showResult && isCorrect
                        ? "var(--success)"
                        : showResult && isSelected && !isCorrect
                        ? "var(--danger)"
                        : "rgba(255,255,255,0.08)",
                      color: showResult ? "white" : labelColor,
                    }}
                  >
                    {alt.id}
                  </span>
                  <div className="flex-1 min-w-0">
                    {alternativaComCodigo ? (
                      <div className="space-y-2">
                        {alternativaComCodigo.before && (
                          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: textColor }}>
                            {alternativaComCodigo.before}
                          </p>
                        )}

                        <div
                          className="rounded-md px-3 py-2 overflow-x-auto"
                          style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-subtle)" }}
                        >
                          <code className="text-sm font-mono whitespace-pre-wrap break-words" style={{ color: textColor }}>
                            {alternativaComCodigo.code}
                          </code>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm leading-relaxed" style={{ color: textColor }}>
                        {alt.texto}
                      </span>
                    )}
                  </div>
                  {showResult && isCorrect && (
                    <span className="material-icons-round ml-auto" style={{ color: "var(--success)" }}>
                      check_circle
                    </span>
                  )}
                  {showResult && isSelected && !isCorrect && (
                    <span className="material-icons-round ml-auto" style={{ color: "var(--danger)" }}>
                      cancel
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* AI Analysis */}
          {showAI && (
            <div
              className="rounded-xl p-5"
              style={{
                background: "rgba(92,92,240,0.05)",
                border: "1px solid rgba(92,92,240,0.2)",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="material-icons-round text-lg" style={{ color: "var(--primary)" }}>
                  auto_awesome
                </span>
                <span className="font-semibold text-sm" style={{ color: "var(--primary)" }}>
                  Análise da IA ConcursoTech
                </span>
              </div>
              <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--foreground)" }}>
                {questao.explicacao}
              </p>
              <div
                className="text-xs px-3 py-2 rounded-lg flex items-center gap-2"
                style={{ background: "rgba(255,255,255,0.04)", color: "var(--text-muted)" }}
              >
                <span className="material-icons-round text-sm">menu_book</span>
                <span>
                  Fonte sugerida: Tanenbaum, A. S. (Redes de Computadores, 6ª ed). Capítulo 5.
                </span>
              </div>
            </div>
          )}

          {showResult && (
            <button
              id="btn-proxima-questao"
              onClick={handleNext}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all"
              style={{
                background: "linear-gradient(135deg, #5c5cf0, #7c7cf8)",
                boxShadow: "0 4px 20px rgba(92,92,240,0.3)",
              }}
            >
              Próxima Questão →
            </button>
          )}
        </div>

        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div
            className="rounded-xl p-5"
            style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
          >
            <h3 className="font-semibold text-white mb-3 text-sm">Estatísticas da Sessão</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--text-secondary)" }}>
                  Total
                </span>
                <span className="font-bold text-white text-sm">{sessaoStats.total}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-success/5 border border-success/10 p-2 rounded-lg">
                    <div className="text-[10px] uppercase font-bold text-success opacity-70">Acertos</div>
                    <div className="text-sm font-black text-success">{sessaoStats.acertos}</div>
                </div>
                <div className="bg-danger/5 border border-danger/10 p-2 rounded-lg">
                    <div className="text-[10px] uppercase font-bold text-danger opacity-70">Erros</div>
                    <div className="text-sm font-black text-danger">{sessaoStats.total - sessaoStats.acertos}</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                    <span className="text-[10px] uppercase font-bold text-primary">Precisão</span>
                    <span className="text-xs font-black text-white">{sessaoStats.total > 0 ? Math.round((sessaoStats.acertos / sessaoStats.total) * 100) : 0}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-primary transition-all duration-500" 
                        style={{ width: `${sessaoStats.total > 0 ? (sessaoStats.acertos / sessaoStats.total) * 100 : 0}%` }} 
                    />
                </div>
              </div>

              <button 
                onClick={finalizarSessao}
                disabled={!sessaoId || sessaoStats.total === 0}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:bg-success hover:scale-[1.02] disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-success/10"
                style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}
              >
                Finalizar & Ganhar XP 🏆
              </button>
            </div>
          </div>

          <div
            className="rounded-xl p-5"
            style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
          >
            <h3 className="font-semibold text-white mb-3 text-sm">Apoio Estudo</h3>
            <div className="space-y-2">
              <Link
                href={`/aulas?materia=${encodeURIComponent(questao.materia)}`}
                className="block rounded-lg p-3 cursor-pointer hover:opacity-80 transition-opacity"
                style={{ background: "rgba(92,92,240,0.08)", border: "1px solid rgba(92,92,240,0.15)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-icons-round text-sm" style={{ color: "var(--primary)" }}>
                    play_circle
                  </span>
                  <span className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
                    Ver Aulas de {questao.materia}
                  </span>
                </div>
                <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  Reforce a base teórica com videoaulas focadas.
                </div>
              </Link>
              
              <Link
                href={`/flashcards?materia=${encodeURIComponent(questao.materia)}`}
                className="block rounded-lg p-3 cursor-pointer hover:opacity-80 transition-opacity"
                style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.15)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-icons-round text-sm" style={{ color: "#a855f7" }}>
                    style
                  </span>
                  <span className="text-xs font-semibold" style={{ color: "#a855f7" }}>
                    Flashcards de {questao.materia}
                  </span>
                </div>
                <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  Revise conceitos-chave via repetição espaçada.
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
