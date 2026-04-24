"use client";

import { useEffect, useState } from "react";

const DIAS_SEMANA = [
  { id: "SEG", label: "SEG" },
  { id: "TER", label: "TER" },
  { id: "QUA", label: "QUA" },
  { id: "QUI", label: "QUI" },
  { id: "SEX", label: "SEX" },
  { id: "SAB", label: "SÁB" },
  { id: "DOM", label: "DOM" },
];

export default function ConfiguracoesPage() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Estados locais para edição (Alvo do Concurso)
  const [concursoAlvo, setConcursoAlvo] = useState("Serpro");
  const [cargoEspecífico, setCargoEspecífico] = useState("");
  const [banca, setBanca] = useState("CESPE/Cebraspe");
  const [modalidade, setModalidade] = useState("Nível Superior");
  const [dataProva, setDataProva] = useState("");
  const [metaHoras, setMetaHoras] = useState(4);
  const [diasDisponiveis, setDiasDisponiveis] = useState<string[]>(["SEG", "TER", "QUA", "QUI", "SEX"]);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        const c = data.profile.concurso;
        if (c) {
          setConcursoAlvo(c.nome || "");
          setCargoEspecífico(c.cargo || "");
          setBanca(c.banca || "CESPE/Cebraspe");
          setModalidade(c.modalidade || "Nível Superior");
          setMetaHoras(c.horas_dia || 4);
          setDiasDisponiveis(c.dias_semana || ["SEG", "TER", "QUA", "QUI", "SEX"]);
          if (c.data_prova) {
            setDataProva(new Date(c.data_prova).toISOString().split('T')[0]);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  const toggleDay = (dayId: string) => {
    setDiasDisponiveis(prev => 
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
    );
  };

  async function handleSave() {
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concurso_nome: concursoAlvo,
          cargo: cargoEspecífico,
          banca,
          modalidade,
          data_prova: dataProva,
          horas_dia: metaHoras,
          dias_semana: diasDisponiveis
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Erro ao salvar");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || "Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return (
    <div className="p-6 text-white text-center flex flex-col items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mb-4"></div>
      <p className="text-sm text-gray-400">Carregando configurações...</p>
    </div>
  );

  return (
    <div className="p-6 min-h-screen" style={{ background: "var(--background)" }}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Configurações do Concurso</h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Atualize seus parâmetros de alvo, recalibre a IA e visualize seu histórico de desempenho.
        </p>
      </div>

      <div className="max-w-4xl">
        <div className="rounded-2xl p-8 glass border border-white/5 relative overflow-hidden">
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
             <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-icons-round text-primary text-xl">track_changes</span>
             </div>
             <h2 className="text-xl font-bold text-white">Alvo do Concurso</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Concurso Alvo */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Concurso Alvo</label>
              <div className="relative">
                <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">flag</span>
                <input 
                  type="text"
                  placeholder="Ex: SERPRO, TCU, INSS..."
                  value={concursoAlvo}
                  onChange={(e) => setConcursoAlvo(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Cargo Específico */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Cargo Específico</label>
              <div className="relative">
                <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">search</span>
                <input 
                  type="text"
                  placeholder="Ex: Analista de TI"
                  value={cargoEspecífico}
                  onChange={(e) => setCargoEspecífico(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Banca Organizadora */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Banca Organizadora</label>
              <div className="relative">
                <select 
                  value={banca}
                  onChange={(e) => setBanca(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white appearance-none focus:outline-none focus:border-primary transition-all"
                >
                  <option value="CESPE/Cebraspe">CESPE/Cebraspe</option>
                  <option value="FGV">FGV</option>
                  <option value="FCC">FCC</option>
                  <option value="Vunesp">Vunesp</option>
                </select>
                <span className="material-icons-round absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">expand_more</span>
              </div>
            </div>

            {/* Modalidade */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Modalidade</label>
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                <button 
                  onClick={() => setModalidade("Nível Médio")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${modalidade === "Nível Médio" ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500'}`}
                >
                  Nível Médio
                </button>
                <button 
                  onClick={() => setModalidade("Nível Superior")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${modalidade === "Nível Superior" ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500'}`}
                >
                  Nível Superior
                </button>
              </div>
            </div>

            {/* Data da Prova */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Data da Prova</label>
              <div className="relative">
                <input 
                  type="date"
                  value={dataProva}
                  onChange={(e) => setDataProva(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-all custom-calendar-icon"
                />
              </div>
            </div>

            {/* Meta de Horas */}
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Meta de Horas Líquidas</label>
                <span className="text-xs font-bold text-primary">{metaHoras}h / dia</span>
              </div>
              <div className="flex items-center gap-4 cursor-pointer">
                <input 
                  type="range"
                  min="1"
                  max="12"
                  step="1"
                  value={metaHoras}
                  onChange={(e) => setMetaHoras(parseInt(e.target.value))}
                  className="flex-1 accent-primary h-1.5 rounded-full bg-white/10 appearance-none"
                />
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-white font-bold text-sm">
                  {metaHoras}
                </div>
              </div>
            </div>

            {/* Dias Disponíveis */}
            <div className="md:col-span-2 space-y-3 pt-4">
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Dias Disponíveis para Estudo</label>
              <div className="flex flex-wrap gap-2">
                {DIAS_SEMANA.map((dia) => {
                  const isActive = diasDisponiveis.includes(dia.id);
                  return (
                    <button
                      key={dia.id}
                      onClick={() => toggleDay(dia.id)}
                      className={`min-w-[50px] py-3 rounded-lg text-xs font-black transition-all border ${
                        isActive 
                          ? 'bg-primary border-primary text-white shadow-[0_0_20px_rgba(92,92,240,0.4)]' 
                          : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'
                      }`}
                    >
                      {dia.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-12 flex justify-end">
             <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  boxShadow: "0 8px 25px rgba(16, 185, 129, 0.25)"
                }}
             >
                <span className="material-icons-round text-lg">{saved ? "check_circle" : "check"}</span>
                {isSaving ? "SALVANDO..." : saved ? "ALTERAÇÕES SALVAS!" : "SALVAR ALTERAÇÕES"}
             </button>
          </div>
        </div>

        {/* Nivelamento Hint (Optional summary, as it's separate) */}
        <div className="mt-8 rounded-2xl p-6 glass border border-white/5 flex flex-col md:flex-row items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
               <span className="material-icons-round text-primary text-2xl">psychology</span>
            </div>
            <div className="flex-1 text-center md:text-left">
                <h4 className="font-bold text-white mb-1">Nivelamento da IA</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                   Sente que os planos de estudo ou questões estão muito fáceis ou muito difíceis? 
                   Refaça o nivelamento para recalibrar o algoritmo do ConcursoTech.
                </p>
            </div>
            <button 
              onClick={() => window.location.href = '/nivelamento'}
              className="px-6 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase transition-all hover:bg-primary hover:text-white"
            >
               Refazer Nivelamento
            </button>
        </div>
      </div>
    </div>
  );
}
