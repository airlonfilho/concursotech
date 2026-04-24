"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { mockFlashcards } from "@/lib/mock-data";

const dificuldadeConfig = {
  nova: { label: "Nova", color: "#5c5cf0", bg: "rgba(92,92,240,0.15)" },
  "difícil": { label: "Difícil", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  bom: { label: "Bom", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  "fácil": { label: "Fácil", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
};

export default function FlashcardsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-white text-center">Carregando flashcards...</div>}>
      <FlashcardsContent />
    </Suspense>
  )
}

function FlashcardsContent() {
  const searchParams = useSearchParams();
  const materiaQuery = searchParams.get("materia");

  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [stats, setStats] = useState({ errei: 0, bom: 0, facil: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mySubjects, setMySubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState(materiaQuery || "");
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showGenPanel, setShowGenPanel] = useState(false);

  useEffect(() => {
    fetch("/api/nivelamento")
      .then(r => r.json())
      .then(data => setMySubjects(data.nivelamentos || []));
  }, []);

  async function fetchFlashcards() {

    setIsLoading(true);
    try {
      const res = await fetch("/api/flashcards");
      const data = await res.json();
      setFlashcards(data.flashcards || []);
      setCurrentIndex(0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGenerate(materia: string) {
    const sub = mySubjects.find(s => s.materia === materia);
    const nivel = sub?.nivel || "INICIANTE";

    setIsGenerating(true);
    try {
      const res = await fetch("/api/flashcards/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materia, nivel })
      });
      if (res.ok) {
        await fetchFlashcards();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }

  useEffect(() => {
    fetchFlashcards();
  }, []);

  const card = flashcards[currentIndex];
  const total = flashcards.length;
  const progress = total > 0 ? Math.round((currentIndex / total) * 100) : 0;

  const config = dificuldadeConfig[card?.dificuldade as keyof typeof dificuldadeConfig] || dificuldadeConfig.nova;

  async function handleRate(rating: "errei" | "bom" | "facil") {
    if (!card) return;
    
    // Mapeia para os enums usados na API SM-2
    const avaliacaoApi = rating === "errei" ? "nao_sabia" : rating === "bom" ? "dificuldade" : "facil";

    setStats((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));
    setIsFlipped(false);

    try {
      await fetch(`/api/flashcards/${card.id}/avaliar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avaliacao: avaliacaoApi })
      });
    } catch (err) {
      console.error(err);
    }

    setTimeout(() => setCurrentIndex((prev) => prev + 1), 150);
  }

  if (isLoading || isGenerating) return (
    <div className="p-6 text-white text-center flex flex-col items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mb-4"></div>
      <div>{isGenerating ? "Gemini está gerando novos flashcards para você..." : "Carregando..."}</div>
    </div>
  );



  if (total === 0 || currentIndex >= total) {
    return (
      <div className="p-6 min-h-screen flex flex-col items-center justify-center text-center" style={{ background: "var(--background)" }}>
        <h2 className="text-3xl font-bold text-white mb-4">🏆 Tudo limpo!</h2>
        <p style={{ color: "var(--text-secondary)" }} className="mb-8">Você não tem Flashcards pendentes de revisão hoje pelo cronograma.</p>
        
        <div className="flex flex-col gap-4 w-full max-w-sm">
           <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1" style={{ color: "var(--text-muted)" }}>
             Gerar Reforço (IA)
           </p>
           
           <div className="relative text-left">
              <button
                onClick={() => setIsSelectOpen(!isSelectOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all"
                style={{ 
                  background: "rgba(255,255,255,0.03)", 
                  border: `1px solid ${isSelectOpen ? "var(--primary)" : "var(--border-subtle)"}`,
                  color: selectedSubject ? "white" : "var(--text-secondary)"
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="material-icons-round text-base" style={{ color: "var(--primary)" }}>book</span>
                  <span>{selectedSubject || "Escolha a disciplina..."}</span>
                </div>
                <span className={`material-icons-round transition-transform ${isSelectOpen ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {isSelectOpen && (
                <div className="absolute bottom-full mb-2 left-0 right-0 z-50 rounded-xl overflow-hidden bg-[#1a1a2e] border border-white/10 shadow-2xl" 
                     style={{ maxHeight: "250px", display: "flex", flexDirection: "column" }}>
                  <div className="p-2 border-b border-white/5 bg-white/5">
                    <input
                      type="text"
                      placeholder="Pesquisar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50"
                      autoFocus
                    />
                  </div>
                  <div className="overflow-y-auto py-1">
                    {mySubjects
                      .map(s => s.materia)
                      .filter(m => m.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((m) => (
                        <button
                          key={m}
                          onClick={() => {
                            setSelectedSubject(m);
                            setIsSelectOpen(false);
                            setSearchTerm("");
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 transition-colors"
                          style={{ color: selectedSubject === m ? "var(--primary)" : "var(--text-secondary)" }}
                        >
                          {m}
                        </button>
                      ))}
                  </div>
                </div>
              )}
           </div>

           <button 
              disabled={!selectedSubject || isGenerating}
              onClick={() => handleGenerate(selectedSubject)} 
              className="py-3 px-6 rounded-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
              style={{ background: "linear-gradient(135deg, #5c5cf0, #a855f7)", boxShadow: "0 4px 15px rgba(92,92,240,0.3)" }}
           >
              {isGenerating ? "Gerando..." : "Gerar Flashcards com IA"}
           </button>
        </div>
      </div>
    );
  }


  return (
    <div className="p-6 min-h-screen" style={{ background: "var(--background)" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Flashcards</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Revisão espaçada com algoritmo SM-2
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowGenPanel(!showGenPanel)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ 
              background: showGenPanel ? "var(--primary)" : "rgba(255,255,255,0.05)", 
              border: "1px solid var(--border-subtle)",
              color: showGenPanel ? "white" : "var(--text-secondary)"
            }}
          >
            <span className="material-icons-round text-base">add_circle</span>
            Nova Carga
          </button>

          <div className="flex items-center gap-4 px-4 py-2 rounded-lg text-sm" style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}>
            <span style={{ color: "var(--danger)" }}>❌ {stats.errei}</span>
            <span style={{ color: "#f59e0b" }}>🆗 {stats.bom}</span>
            <span style={{ color: "var(--success)" }}>✅ {stats.facil}</span>
          </div>
        </div>
      </div>

      {showGenPanel && (
        <div className="mb-8 p-6 rounded-2xl glass border border-primary/20 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="material-icons-round" style={{ color: "var(--primary)" }}>auto_awesome</span>
              Gerar Novos Cards com IA
            </h3>
            <button onClick={() => setShowGenPanel(false)} className="text-muted-foreground hover:text-white transition-colors">
              <span className="material-icons-round">close</span>
            </button>
          </div>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            A IA do ConcursoTech criará novos flashcards baseados no edital da sua disciplina.
          </p>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <button
                onClick={() => setIsSelectOpen(!isSelectOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all"
                style={{ 
                  background: "rgba(0,0,0,0.2)", 
                  border: `1px solid ${isSelectOpen ? "var(--primary)" : "var(--border-subtle)"}`,
                  color: selectedSubject ? "white" : "var(--text-secondary)"
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="material-icons-round text-base" style={{ color: "var(--primary)" }}>book</span>
                  <span>{selectedSubject || "Escolha a disciplina do seu edital..."}</span>
                </div>
                <span className={`material-icons-round transition-transform ${isSelectOpen ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {isSelectOpen && (
                <div className="absolute top-full mt-2 left-0 right-0 z-50 rounded-xl overflow-hidden bg-[#1a1a2e] border border-white/10 shadow-2xl" 
                     style={{ maxHeight: "250px", display: "flex", flexDirection: "column" }}>
                  <div className="p-2 border-b border-white/5 bg-white/5">
                    <input
                      type="text"
                      placeholder="Pesquisar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50"
                      autoFocus
                    />
                  </div>
                  <div className="overflow-y-auto py-1">
                    {mySubjects
                      .map(s => s.materia)
                      .filter(m => m.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((m) => (
                        <button
                          key={m}
                          onClick={() => {
                            setSelectedSubject(m);
                            setIsSelectOpen(false);
                            setSearchTerm("");
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 transition-colors"
                          style={{ color: selectedSubject === m ? "var(--primary)" : "var(--text-secondary)" }}
                        >
                          {m}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <button 
              disabled={!selectedSubject || isGenerating}
              onClick={() => handleGenerate(selectedSubject)} 
              className="py-3 px-8 rounded-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #5c5cf0, #a855f7)", boxShadow: "0 4px 15px rgba(92,92,240,0.3)" }}
            >
              {isGenerating ? "Gerando..." : "Gerar Agora"}
            </button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
          <span>{currentIndex + 1} de {total} cards</span>
          <span>{total - currentIndex - 1} restantes</span>
        </div>
        <div className="progress-bar" style={{ height: 6 }}>
          <div className="progress-fill" style={{ width: `${progress}%`, borderRadius: 3 }} />
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <span className="badge" style={{ background: "rgba(92,92,240,0.15)", color: "var(--primary-light)", border: "1px solid rgba(92,92,240,0.25)" }}>
            {card.materia}
          </span>
          <span className="badge" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
            {card.deck}
          </span>
          <span className="badge ml-auto" style={{ background: config.bg, color: config.color, border: `1px solid ${config.color}30` }}>
            {config.label}
          </span>
        </div>

        <div className="flashcard-container mb-6" style={{ height: 320 }}>
          <div className={`flashcard-inner ${isFlipped ? "flipped" : ""}`}>
            <div
              className="flashcard-front rounded-2xl flex flex-col items-center justify-center p-8 cursor-pointer"
              style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
              onClick={() => setIsFlipped(true)}
            >
              <span className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "var(--text-muted)" }}>
                🃏 Pergunta — clique para ver a resposta
              </span>
              <p className="text-xl font-medium text-center text-white leading-relaxed">{card.frente}</p>
            </div>
            <div
              className="flashcard-back rounded-2xl flex flex-col p-8 cursor-pointer"
              style={{ background: "linear-gradient(135deg, rgba(92,92,240,0.1), rgba(168,85,247,0.05))", border: "1px solid rgba(92,92,240,0.25)" }}
              onClick={() => setIsFlipped(false)}
            >
              <span className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--primary)" }}>
                💡 Resposta
              </span>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--foreground)" }}>{card.verso}</p>
            </div>
          </div>
        </div>

        {isFlipped ? (
          <div className="grid grid-cols-3 gap-3">
            <button id="btn-errei" onClick={() => handleRate("errei")} className="py-3 rounded-xl font-semibold text-sm" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
              😬 Errei
            </button>
            <button id="btn-bom" onClick={() => handleRate("bom")} className="py-3 rounded-xl font-semibold text-sm" style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>
              🆗 Bom
            </button>
            <button id="btn-facil" onClick={() => handleRate("facil")} className="py-3 rounded-xl font-semibold text-sm" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}>
              🚀 Fácil
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button id="btn-revelar" onClick={() => setIsFlipped(true)} className="px-8 py-3 rounded-xl font-semibold text-white" style={{ background: "linear-gradient(135deg, #5c5cf0, #7c7cf8)", boxShadow: "0 4px 20px rgba(92,92,240,0.3)" }}>
              Revelar Resposta
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
