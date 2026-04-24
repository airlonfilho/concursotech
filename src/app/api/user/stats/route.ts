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

    // Busca o usuário básico (XP, Level, Streak)
    const user = await prisma.usuario.findUnique({
      where: { id: usuario_id },
      select: { xp: true, nivel: true, streak: true }
    })

    // Agrega total de sessoes concluidas
    const sessoesFeitas = await prisma.sessao.count({
      where: { usuario_id, fim: { not: null } }
    })

    // Quantas questões o usuário já respondeu (Total respostas registradas)
    const totalRespostas = await prisma.resposta.count({
      where: { sessao: { usuario_id } }
    })
    
    // Taxa de acerto (acertos / total params resgatadas)
    const totalAcertos = await prisma.resposta.count({
      where: { sessao: { usuario_id }, correta: true }
    })

    const taxaAcerto = totalRespostas > 0 ? Math.round((totalAcertos / totalRespostas) * 100) : 0

    return NextResponse.json({ 
      stats: {
        xp: user?.xp || 0,
        nivel: user?.nivel || 1,
        streak: user?.streak || 0,
        sessoes_concluidas: sessoesFeitas,
        total_questoes_respondidas: totalRespostas,
        taxa_acerto_pct: taxaAcerto,
        total_acertos: totalAcertos
      } 
    }, { status: 200 })
  } catch (err) {
    console.error('[USER_STATS_GET_ERROR]', err)
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 })
  }
}
