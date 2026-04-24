import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

    const payload = await verifyJWT(token)
    if (!payload || !payload.id) return NextResponse.json({ message: 'Token inválido' }, { status: 401 })

    const usuario_id = payload.id as string
    const { searchParams } = new URL(req.url)
    const materia = searchParams.get('materia')

    console.log('[ANALYTICS] Fetching for user:', usuario_id, 'materia:', materia);

    // Filtros de base
    const sessaoFilter: any = { usuario_id }
    if (materia && materia !== "Todas") {
      sessaoFilter.materia = materia
    }

    // 1. Estatísticas Gerais
    console.log('[ANALYTICS] Querying totalRespostas...');
    const totalRespostas = await prisma.resposta.count({
      where: { sessao: sessaoFilter }
    });

    console.log('[ANALYTICS] Querying totalAcertos...');
    const totalAcertos = await prisma.resposta.count({
      where: { sessao: { ...sessaoFilter }, correta: true }
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    console.log('[ANALYTICS] Querying acertosHoje...');
    const acertosHoje = await prisma.resposta.count({
      where: {
        sessao: { ...sessaoFilter, inicio: { gte: startOfToday } },
        correta: true
      }
    });

    // 2. Tempo por Matéria
    console.log('[ANALYTICS] Querying sessoesMateria...');
    const sessoesMateria = await prisma.sessao.findMany({
      where: { ...sessaoFilter, fim: { not: null } },
      select: { materia: true, inicio: true, fim: true }
    });

    const tempoPorMateriaRaw: Record<string, number> = {};
    sessoesMateria.forEach((s: any) => {
      if (s.materia && s.fim) {
        const duracao = (s.fim.getTime() - s.inicio.getTime()) / (1000 * 60);
        tempoPorMateriaRaw[s.materia] = (tempoPorMateriaRaw[s.materia] || 0) + duracao;
      }
    });

    const tempoResumo = Object.entries(tempoPorMateriaRaw).map(([m, t]: [string, number]) => ({
      materia: m,
      minutos: Math.round(t),
      horasStr: `${Math.floor(t/60)}h ${Math.round(t%60)}m`,
      percent: Math.min(100, Math.round((t / (10 * 60)) * 100))
    })).sort((a, b) => b.minutos - a.minutos);

    // 3. Nivelamento/Erros
    const nivelamentoFilter: any = { usuario_id }
    if (materia && materia !== "Todas") {
      nivelamentoFilter.materia = materia
    }

    const nivelamentos = await prisma.nivelamento.findMany({
      where: nivelamentoFilter,
      orderBy: { acertos: 'asc' }
    });

    const mapaErros = nivelamentos.map((n: any) => {
      const taxa = n.total > 0 ? Math.round((n.acertos / n.total) * 100) : 0;
      return {
        materia: n.materia,
        taxaAcerto: taxa,
        total: n.total,
        nivel: taxa < 50 ? 'Crítico' : taxa < 80 ? 'Moderado' : 'Leve',
        tema: n.nivel === 'INICIANTE' ? 'Base Teórica' : 'Prática de Questões'
      };
    });

    // 4. Progresso Semanal (Últimos 7 dias)
    console.log('[ANALYTICS] Computing Weekly Progress...');
    const progressoSemanal = [];
    for (let i = 0; i < 7; i++) {
        const dia = new Date();
        dia.setDate(dia.getDate() - (6 - i));
        dia.setHours(0,0,0,0);
        const proxDia = new Date(dia);
        proxDia.setDate(dia.getDate() + 1);

        try {
            const totalDia = await prisma.resposta.count({
                where: { 
                  sessao: { 
                    usuario_id,
                    ...(materia && materia !== "Todas" ? { materia } : {}),
                    inicio: { gte: dia, lt: proxDia } 
                  } 
                }
            });
            const acertosDia = await prisma.resposta.count({
                where: { 
                    sessao: { 
                        usuario_id,
                        ...(materia && materia !== "Todas" ? { materia } : {}),
                        inicio: { gte: dia, lt: proxDia } 
                    },
                    correta: true 
                }
            });

            progressoSemanal.push({
                dia: ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'][dia.getDay()],
                taxa: totalDia > 0 ? Math.round((acertosDia / totalDia) * 100) : 0,
                count: acertosDia
            });
        } catch (e: any) {
            console.error('[ANALYTICS] Loop error at day', i, e.message);
            // Fallback for this day
            progressoSemanal.push({ dia: '?', taxa: 0, count: 0 });
        }
    }

    return NextResponse.json({
      stats: {
        totalRespostas,
        totalAcertos,
        acertosHoje,
        taxaAcertoGeral: totalRespostas > 0 ? Math.round((totalAcertos / totalRespostas) * 100) : 0
      },
      tempoPorMateria: tempoResumo,
      mapaErros,
      progressoSemanal
    }, { status: 200 })

  } catch (err: any) {
    console.error('[ANALYTICS_ERROR] Full crash details:', err.message, err.stack)
    return NextResponse.json({ 
      message: 'Erro interno no servidor ao processar estatísticas',
      debug: err.message 
    }, { status: 500 })
  }
}
