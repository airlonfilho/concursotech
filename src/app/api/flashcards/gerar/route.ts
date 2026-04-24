import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'
import { generateFlashcards } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

    const payload = await verifyJWT(token)
    if (!payload || !payload.id) return NextResponse.json({ message: 'Token inválido' }, { status: 401 })

    const usuario_id = payload.id as string

    // 1. Pegar concurso para o contexto da IA
    const concurso = await prisma.concurso.findUnique({ where: { usuario_id } })
    const cargo = concurso?.cargo || "Geral"

    // 2. Definir a matéria e o nível para gerar
    const { materia, nivel } = await req.json()
    if (!materia) return NextResponse.json({ message: 'Informe a matéria' }, { status: 400 })

    // 3. ✨ Chamar Gemini para gerar a lista (JSON) considerando o nível do aluno
    const cardsGerados = await generateFlashcards(materia, cargo, nivel || 'INICIANTE')

    if (!cardsGerados || cardsGerados.length === 0) {
      return NextResponse.json({ message: 'IA não conseguiu gerar flashcards agora.' }, { status: 500 })
    }

    // 4. Salvar no Banco de Dados via PRISMA (Batch Create)
    const cardsFinalizados = await Promise.all(
      cardsGerados.map((item: { frente: string, verso: string }) => 
        prisma.flashcard.create({
          data: {
            usuario_id,
            materia,
            frente: item.frente,
            verso: item.verso,
            proxima_revisao: new Date() // Fica disponível na hora
          }
        })
      )
    )

    return NextResponse.json({ 
      message: 'Flashcards gerados com sucesso!',
      total: cardsFinalizados.length,
      cards: cardsFinalizados
    }, { status: 201 })

  } catch (err) {
    console.error('[FLASHCARDS_GERAR_ERROR]', err)
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 })
  }
}
