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

    // Busca apenas flashcards que estão pendentes para revisão HOJE ou datas anteriores
    const pendingFlashcards = await prisma.flashcard.findMany({
      where: {
        usuario_id,
        proxima_revisao: {
          lte: new Date(), // Menor ou igual a hoje
        }
      },
      orderBy: {
        proxima_revisao: 'asc'
      }
    })

    return NextResponse.json({ flashcards: pendingFlashcards }, { status: 200 })
  } catch (err) {
    console.error('[FLASHCARDS_GET_ERROR]', err)
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 })
  }
}

// Endpoint local mockado para criar um flashcard manualmente
// Já que o Gemini geraria eles depois, no momento vamos expôr uma forma de Inserir no Banco 
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

    const payload = await verifyJWT(token)
    if (!payload || !payload.id) return NextResponse.json({ message: 'Token inválido' }, { status: 401 })

    const usuario_id = payload.id as string
    const { frente, verso, materia } = await req.json()

    if (!frente || !verso || !materia) {
      return NextResponse.json({ message: 'Parâmetros insuficientes' }, { status: 400 })
    }

    const flashcard = await prisma.flashcard.create({
      data: {
        usuario_id,
        frente,
        verso,
        materia,
        intervalo_sm2: 1,
        proxima_revisao: new Date() // Pronto para revisar hoje
      }
    })

    return NextResponse.json({ message: 'Flashcard criado', flashcard }, { status: 201 })
  } catch (err) {
    console.error('[FLASHCARDS_POST_ERROR]', err)
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 })
  }
}
