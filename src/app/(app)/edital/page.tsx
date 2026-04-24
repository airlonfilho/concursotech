"use client";

import { useEffect, useState } from "react";

export default function EditalPage() {
  const [rawText, setRawText] = useState("");
  const [edital, setEdital] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");

  async function fetchEdital() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/edital");
      const data = await res.json();
      if (data.edital) {
        setEdital(data.edital);
        setRawText(data.edital.raw_text || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchEdital();
  }, []);

  async function handleProcess() {
    if (!rawText || rawText.length < 50) {
      setMessage("O texto do edital é muito curto. Cole o conteúdo programático completo.");
      return;
    }

    setIsProcessing(true);
    setMessage("Processando com IA... Isso pode levar alguns segundos.");
    try {
      const res = await fetch("/api/edital", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText })
      });
      const data = await res.json();
      if (res.ok) {
        setEdital(data.edital);
        setMessage("Edital processado com sucesso! Suas matérias foram atualizadas.");
      } else {
        setMessage(data.message || "Erro ao processar.");
      }
    } catch (err) {
      setMessage("Erro na conexão.");
    } finally {
      setIsProcessing(false);
    }
  }

  if (isLoading) return <div className="p-10 text-center text-white">Carregando dados do edital...</div>;

  return (
    <div className="p-6 min-h-screen" style={{ background: "var(--background)" }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="material-icons-round text-primary">description</span>
          Conteúdo Programático (Edital)
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Suba o texto do edital para que a IA gere seus estudos de forma personalizada.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Editor Area */}
        <div className="space-y-4">
          <div className="rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}>
            <h3 className="text-white font-semibold mb-4">Cole o texto do edital aqui</h3>
            <textarea
              className="w-full h-80 rounded-xl p-4 text-sm focus:outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)", color: "white", resize: "none" }}
              placeholder="Ex: Português: 1. Compreensão e interpretação de textos... Direito: 1. Atos administrativos..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
            {message && (
               <div className="mt-4 p-3 rounded-lg text-xs" style={{ background: "rgba(92,92,240,0.1)", border: "1px solid var(--primary-light)", color: "var(--primary-light)" }}>
                 {message}
               </div>
            )}
            <button
              onClick={handleProcess}
              disabled={isProcessing}
              className="w-full mt-4 py-3 rounded-xl font-bold text-white transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #5c5cf0, #a855f7)", boxShadow: "0 4px 15px rgba(92,92,240,0.3)" }}
            >
              <span className="material-icons-round">{isProcessing ? "hourglass_top" : "auto_awesome"}</span>
              {isProcessing ? "Processando..." : "Analisar Edital com IA"}
            </button>
          </div>
        </div>

        {/* Structured Results */}
        <div className="space-y-4">
           {edital && edital.materias_json ? (
             <div className="rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}>
                <h3 className="text-white font-semibold mb-6 flex items-center justify-between">
                  Conteúdo Estruturado
                  <span className="text-[10px] px-2 py-1 rounded bg-success/10 text-success border border-success/20">PROCESSADO</span>
                </h3>
                
                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.entries(edital.materias_json).map(([subject, topics]: [string, any]) => (
                    <div key={subject}>
                      <div className="text-sm font-bold text-primary-light mb-2 flex items-center gap-2">
                         <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                         {subject}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {topics.map((t: string, idx: number) => (
                           <span key={idx} className="text-[10px] px-2.5 py-1 rounded-full text-white/70" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)" }}>
                             {t}
                           </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
             </div>
           ) : (
             <div className="rounded-2xl p-10 flex flex-col items-center justify-center text-center opacity-50 border-2 border-dashed border-border-subtle" style={{ background: "var(--surface)" }}>
               <span className="material-icons-round text-5xl mb-4">analytics</span>
               <p className="text-sm text-white">Nenhum edital analisado ainda.</p>
               <p className="text-xs text-muted-foreground mt-2 max-w-[200px]">A IA estruturará seus tópicos de estudo automaticamente após a análise.</p>
             </div>
           )}

           <div className="rounded-2xl p-5" style={{ background: "rgba(92,92,240,0.05)", border: "1px solid rgba(92,92,240,0.15)" }}>
              <h4 className="text-white font-bold text-sm mb-2">Por que subir o edital?</h4>
              <ul className="text-[11px] space-y-2" style={{ color: "var(--text-secondary)" }}>
                <li className="flex gap-2">
                  <span className="material-icons-round text-xs text-primary">check_circle</span>
                  <span><strong>Geração de Flashcards:</strong> A IA criará revisões focadas nos seus tópicos.</span>
                </li>
                <li className="flex gap-2">
                  <span className="material-icons-round text-xs text-primary">check_circle</span>
                  <span><strong>Plano de Estudo:</strong> Seu cronograma seguirá a ordem do edital.</span>
                </li>
                <li className="flex gap-2">
                  <span className="material-icons-round text-xs text-primary">check_circle</span>
                  <span><strong>Foco em Aulas:</strong> Filtros automáticos das matérias relevantes.</span>
                </li>
              </ul>
           </div>
        </div>
      </div>
    </div>
  );
}
