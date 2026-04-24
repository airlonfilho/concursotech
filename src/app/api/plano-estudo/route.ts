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

    // Busca o plano semanal mais recente do usuário
    const plano = await prisma.planoSemanal.findFirst({
      where: { usuario_id },
      orderBy: { semana_inicio: 'desc' }
    })

    if (!plano) {
      return NextResponse.json({ message: 'Nenhum plano encontrado' }, { status: 404 })
    }

    return NextResponse.json({ plano }, { status: 200 })
  } catch (err) {
    console.error('[PLANO_GET_ERROR]', err)
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 })
  }
}
