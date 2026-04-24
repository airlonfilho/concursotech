import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'

// Inicia uma nova sessão de estudos
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

    const payload = await verifyJWT(token)
    if (!payload || !payload.id) return NextResponse.json({ message: 'Token inválido' }, { status: 401 })

    const usuario_id = payload.id as string

    // Body pode definir um tipo pra sessao: QUESTOES, FLASHCARDS, ou AULA. Padrão: QUESTOES
    const body = await req.json().catch(() => ({}))
    const { tipo = 'QUESTOES', materia = null } = body

    const sessao = await prisma.sessao.create({
      data: {
        usuario_id,
        tipo,
        materia,
        inicio: new Date(),

        xp_ganho: 0,
        acertos: 0,
        erros: 0,
      }
    })

    return NextResponse.json({ message: 'Sessão iniciada', sessao }, { status: 201 })
  } catch (err) {
    console.error('[SESSAO_POST_ERROR]', err)
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 })
  }
}
