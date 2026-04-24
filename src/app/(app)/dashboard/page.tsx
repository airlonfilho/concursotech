import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";

const diasSemana = ["D", "S", "T", "Q", "Q", "S", "S"];

type Day = { active: boolean; today: boolean };

export default async function DashboardPage() {
  // Ler Cookies e pegar Usuário
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  let usuario_id = "";
  if (token) {
    const payload = await verifyJWT(token);
    if (payload) usuario_id = payload.id as string;
  }

  // Buscar Configuracoes do Banco
  const user = await prisma.usuario.findUnique({ where: { id: usuario_id } });
  const concurso = await prisma.concurso.findUnique({ where: { usuario_id } });

  // Buscar todas as sessões finalizadas para cálculos
  const sessoesUsuario = await prisma.sessao.findMany({
    where: { usuario_id, fim: { not: null } }
  });

  // Pegar a última atividade geral (independente de estar finalizada ou não) para o "Continuar"
  const ultimaSessao = await prisma.sessao.findFirst({
    where: { usuario_id },
    orderBy: { inicio: 'desc' }
  });

  const nivelamentosReal = await prisma.nivelamento.findMany({
    where: { usuario_id },
    orderBy: { materia: 'asc' }
  });

  // Buscar progresso do edital
  const progressoEdital = await prisma.progressoTopico.findMany({
    where: { usuario_id },
    orderBy: { data_conclusao: 'desc' }
  });

  // Buscar conteúdo do edital para calcular total de tópicos
  const conteudoEdital = await prisma.conteudoEdital.findUnique({
    where: { usuario_id }
  });

  // Calcular total de tópicos do edital
  let totalTopicosEdital = 0;
  const progressoPorMateria: Record<string, { total: number; concluidos: number }> = {};

  if (conteudoEdital?.materias_json) {
    const materias = conteudoEdital.materias_json as Record<string, string[]>;
    for (const [materia, topicos] of Object.entries(materias)) {
      totalTopicosEdital += topicos.length;
      progressoPorMateria[materia] = { total: topicos.length, concluidos: 0 };
    }
    // Contar concluídos por matéria
    for (const p of progressoEdital) {
      if (progressoPorMateria[p.materia]) {
        progressoPorMateria[p.materia].concluidos += 1;
      }
    }
  }

  const diasParaProva = concurso
    ? Math.max(0, Math.ceil((new Date(concurso.data_prova).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const titleConcurso = concurso?.cargo || "Nenhum concurso configurado";
  const banca = concurso?.banca || "---";

  // Cálculo de Horas Reais baseadas nas sessões finalizadas
  const totalMinutosEstudados = sessoesUsuario.reduce((acc: number, s: any) => {
    if (s.fim && s.inicio) {
      return acc + (s.fim.getTime() - s.inicio.getTime()) / (1000 * 60);
    }
    return acc;
  }, 0);

  const horasEstudadas = Math.round(totalMinutosEstudados / 60);
  const metaTotalHoras = (concurso?.horas_dia || 4) * 30; // Exemplo: meta mensal
  const horasRestantes = Math.max(0, metaTotalHoras - horasEstudadas);
  const progressoHoras = metaTotalHoras > 0 ? Math.round((horasEstudadas / metaTotalHoras) * 100) : 0;

  // Consistência Real nos últimos 35 dias
  const diasAtivosSet = new Set(sessoesUsuario.map((s: any) => s.inicio.toDateString()));
  const generateRealConsistency = (): Day[] => {
    const days: Day[] = [];
    const today = new Date();
    for (let i = 34; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      days.push({
        active: diasAtivosSet.has(d.toDateString()),
        today: i === 0
      });
    }
    return days;
  };
  const consistencyDays = generateRealConsistency();

  // Buscar Últimas 3 Sessões Finalizadas para o Log
  const sessoesRecentes = await prisma.sessao.findMany({
    where: { usuario_id, fim: { not: null } },
    orderBy: { inicio: 'desc' },
    take: 3,
  });

  const configTipos: any = {
    "QUESTOES": { icon: "quiz", label: "Questões", color: "#5c5cf0", href: "/questoes" },
    "FLASHCARDS": { icon: "style", label: "Flashcards", color: "#a855f7", href: "/flashcards" },
    "AULA": { icon: "play_circle", label: "Aula/Vídeo", color: "#ef4444", href: "/aulas" },
  };

  const getTipoProps = (tipo: string) => {
    const t = (tipo || "").toUpperCase();
    return configTipos[t] || { icon: "history", label: "Estudos", color: "#9ca3af", href: "/dashboard" };
  };

  return (
    <div className="p-6 min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Olá, {user?.nome?.split(' ')[0]} 👋</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Sua jornada para aprovação.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-lg"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border-subtle)" }}
          >
            <span className="text-lg">🔥</span>
            <span className="font-semibold text-sm text-white">{user?.streak || 0} dias</span>
          </div>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ background: "linear-gradient(135deg, #5c5cf0, #a855f7)" }}
          >
            {user?.nome?.[0]?.toUpperCase() || "U"}
          </div>
        </div>
      </div>


      {/* Concurso Card */}
      <div
        className="rounded-xl p-5 mb-5 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(92,92,240,0.2) 0%, rgba(168,85,247,0.1) 100%)",
          border: "1px solid rgba(92,92,240,0.3)",
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="badge"
                style={{
                  background: "rgba(92,92,240,0.2)",
                  color: "var(--primary-light)",
                  border: "1px solid rgba(92,92,240,0.3)",
                }}
              >
                {banca}
              </span>
              <span
                className="badge"
                style={{
                  background: "rgba(34,197,94,0.1)",
                  color: "var(--success)",
                  border: "1px solid rgba(34,197,94,0.2)",
                }}
              >
                {concurso?.horas_dia || 0}h / dia
              </span>
            </div>
            <h2 className="text-lg font-bold text-white">{titleConcurso}</h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              Contagem regressiva para a prova
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-white">{diasParaProva}</div>
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>dias restantes</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Continuar de onde parou */}
        <div className="col-span-12 lg:col-span-8">
          {ultimaSessao && (
            <Link
              href={`${getTipoProps(ultimaSessao.tipo).href}${ultimaSessao.materia ? `?materia=${encodeURIComponent(ultimaSessao.materia)}` : ""}`}
              className="block rounded-xl p-5 mb-4 hover-lift cursor-pointer transition-all"
              style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `rgba(${ultimaSessao.tipo === 'AULA' ? '239,68,68' : '92,92,240'}, 0.15)` }}
                >
                  <span className="material-icons-round text-2xl" style={{ color: getTipoProps(ultimaSessao.tipo).color }}>
                    {getTipoProps(ultimaSessao.tipo).icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
                    CONTINUE SEUS ESTUDOS
                  </div>
                  <h3 className="font-semibold text-white mb-1 truncate">
                    {ultimaSessao.materia || "Continuar Atividade"}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      Foco em: {getTipoProps(ultimaSessao.tipo).label}
                    </span>
                    <div className="flex-1 progress-bar max-w-32">
                      <div className="progress-fill" style={{ width: "85%", background: getTipoProps(ultimaSessao.tipo).color }} />
                    </div>
                  </div>
                </div>
                <span className="material-icons-round text-lg" style={{ color: "var(--text-muted)" }}>
                  arrow_forward_ios
                </span>
              </div>
            </Link>
          )}

          {/* Desempenho por Matéria */}
          <div
            className="rounded-xl p-5 mb-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Desempenho por Matéria</h3>
              <a href="/analises" className="text-xs" style={{ color: "var(--primary)" }}>
                Ver tudo
              </a>
            </div>
            <div className="space-y-3">
              {nivelamentosReal.length === 0 ? (
                <div className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>
                  Defina seu nivelamento para ver o progresso aqui.
                </div>
              ) : (
                nivelamentosReal.map((mat: any) => {
                  const percent = mat.total > 0 ? Math.round((mat.acertos / mat.total) * 100) : 0;
                  const color = mat.nivel === 'AVANCADO' ? '#22c55e' : mat.nivel === 'INTERMEDIARIO' ? '#f59e0b' : '#5c5cf0';
                  return (
                    <div key={mat.id} className="flex items-center gap-3">
                      <div className="w-28 text-xs font-medium truncate" style={{ color: "var(--text-secondary)" }}>
                        {mat.materia}
                      </div>
                      <div className="flex-1 progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${percent || 5}%`, // Minimo visual
                            background: `linear-gradient(90deg, ${color}, ${color}aa)`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold w-10 text-right" style={{ color: color }}>
                        {percent}%
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>


          {/* Log de Atividades (Sessões) */}
          <div
            className="rounded-xl p-5"
            style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Log de Estudos</h3>
              <a href="/historico" className="text-xs font-medium hover:underline" style={{ color: "var(--primary)" }}>
                Histórico completo
              </a>
            </div>
            <div className="space-y-3">
              {sessoesRecentes.length === 0 ? (
                <div className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>
                  Nenhuma atividade ainda. Comece a estudar!
                </div>
              ) : (
                sessoesRecentes.map((s: any) => {
                  const props = getTipoProps(s.tipo);
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/[0.02]"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)" }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                        style={{ background: `${props.color}15`, border: `1px solid ${props.color}30` }}
                      >
                        <span className="material-icons-round" style={{ color: props.color }}>{props.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white text-xs truncate">{props.label}</div>
                        <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                          {s.materia} • {new Date(s.inicio).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <span className="material-icons-round text-sm" style={{ color: "var(--text-muted)" }}>
                        arrow_forward_ios
                      </span>
                    </div>
                  );
                })
              )}

            </div>
          </div>

        </div>

        {/* Right column */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {/* Progresso Meta */}
          <div
            className="rounded-xl p-5"
            style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
          >
            <h3 className="font-semibold text-white mb-4">Progresso da Meta</h3>
            <div className="flex items-center justify-around mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold gradient-text">{horasEstudadas}h</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Estudadas</div>
              </div>
              <div className="h-10 w-px" style={{ background: "var(--border-subtle)" }} />
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: "var(--text-secondary)" }}>
                  {horasRestantes}h
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Restantes</div>
              </div>
            </div>
            <div className="progress-bar" style={{ height: 8, borderRadius: 4 }}>
              <div className="progress-fill" style={{ width: `${progressoHoras}%`, borderRadius: 4 }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Meta: {metaTotalHoras}h</span>
              <span className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
                {progressoHoras}%
              </span>
            </div>
          </div>

          {/* Consistência */}
          <div
            className="rounded-xl p-5"
            style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
          >
            <h3 className="font-semibold text-white mb-3">Consistência de Estudos</h3>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {diasSemana.map((d, i) => (
                <div key={i} className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {consistencyDays.map((day, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-sm"
                  style={{
                    background: day.today
                      ? "var(--primary)"
                      : day.active
                        ? "rgba(92,92,240,0.5)"
                        : "rgba(255,255,255,0.05)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Progresso do Edital */}
          {totalTopicosEdital > 0 && (
            <div
              className="rounded-xl p-5"
              style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">Progresso do Edital</h3>
                <a href="/edital" className="text-xs font-medium hover:underline" style={{ color: "var(--primary)" }}>
                  Ver edital
                </a>
              </div>

              {/* Progresso geral */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Geral</span>
                  <span className="text-xs font-semibold" style={{ color: "var(--success)" }}>
                    {progressoEdital.length}/{totalTopicosEdital} tópicos
                  </span>
                </div>
                <div className="progress-bar" style={{ height: 10, borderRadius: 5 }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.round((progressoEdital.length / totalTopicosEdital) * 100)}%`,
                      borderRadius: 5,
                      background: "linear-gradient(90deg, #22c55e, #10b981)"
                    }}
                  />
                </div>
                <div className="text-center mt-1">
                  <span className="text-lg font-bold" style={{ color: "var(--success)" }}>
                    {Math.round((progressoEdital.length / totalTopicosEdital) * 100)}%
                  </span>
                </div>
              </div>

              {/* Progresso por matéria */}
              <div className="space-y-2">
                {Object.entries(progressoPorMateria)
                  .filter(([_, data]) => data.total > 0)
                  .slice(0, 5)
                  .map(([materia, data]) => {
                    const percent = Math.round((data.concluidos / data.total) * 100);
                    return (
                      <div key={materia} className="flex items-center gap-2">
                        <span className="text-[10px] truncate flex-1" style={{ color: "var(--text-muted)" }}>
                          {materia}
                        </span>
                        <div className="flex-1 progress-bar" style={{ height: 4 }}>
                          <div
                            className="progress-fill"
                            style={{
                              width: `${percent}%`,
                              background: percent === 100 ? "var(--success)" : "var(--primary)"
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-semibold w-12 text-right" style={{ color: "var(--text-secondary)" }}>
                          {data.concluidos}/{data.total}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

