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

    const nivelamentos = await prisma.nivelamento.findMany({
      where: { usuario_id },
      orderBy: { materia: 'asc' }
    })

    return NextResponse.json({ nivelamentos }, { status: 200 })
  } catch (err) {
    console.error('[NIVELAMENTO_GET_ERROR]', err)
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

    const payload = await verifyJWT(token)
    if (!payload || !payload.id) return NextResponse.json({ message: 'Token inválido' }, { status: 401 })

    const usuario_id = payload.id as string
    const { nivelamentos } = await req.json() // Array de { materia, nivel }

    if (!Array.isArray(nivelamentos)) {
      return NextResponse.json({ message: 'Dados inválidos' }, { status: 400 })
    }

    // Deletar nivelamentos antigos e criar novos (ou usar upsert loop)
    // Para simplificar o formulário de nivelamento inicial, limpamos e recriamos
    await prisma.nivelamento.deleteMany({
      where: { usuario_id }
    })

    const created = await Promise.all(
      nivelamentos.map((item: any) => 
        prisma.nivelamento.create({
          data: {
            usuario_id,
            materia: item.materia,
            nivel: item.nivel,
            acertos: 0,
            total: 0
          }
        })
      )
    )

    return NextResponse.json({ message: 'Nivelamento salvo com sucesso', count: created.length }, { status: 200 })
  } catch (err) {
    console.error('[NIVELAMENTO_POST_ERROR]', err)
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 })
  }
}
