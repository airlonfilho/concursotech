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

    const sessoes = await prisma.sessao.findMany({
      where: { usuario_id },
      orderBy: { inicio: 'desc' },
      take: 20, // Limite para as últimas 20
      include: {
        respostas: true
      }
    })

    return NextResponse.json({ sessoes }, { status: 200 })
  } catch (err) {
    console.error('[SESSOES_GET_ERROR]', err)
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 })
  }
}
