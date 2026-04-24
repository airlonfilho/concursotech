import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get('auth_token')?.value
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

    const payload = await verifyJWT(token)
    if (!payload || !payload.id) return NextResponse.json({ message: 'Token inválido' }, { status: 401 })

    const usuario_id = payload.id as string
    const params = await props.params
    const flashcard_id = params.id
    
    // As notas possíveis: 'nao_sabia' , 'dificuldade', 'facil'
    const { avaliacao } = await req.json()

    if (!avaliacao) {
        return NextResponse.json({ message: 'A avaliação é obrigatória' }, { status: 400 })
    }

    const card = await prisma.flashcard.findUnique({ where: { id: flashcard_id } })
    
    if (!card) return NextResponse.json({ message: 'Flashcard não encontrado' }, { status: 404 })
    if (card.usuario_id !== usuario_id) return NextResponse.json({ message: 'Não autorizado' }, { status: 403 })

    let novo_intervalo = card.intervalo_sm2

    switch (avaliacao) {
        case 'nao_sabia':
            novo_intervalo = 1 // Revisa amanhã
            break
        case 'dificuldade':
            novo_intervalo = Math.max(3, card.intervalo_sm2 + 2) // Revisa em 3 dias (ou +2)
            break
        case 'facil':
            novo_intervalo = Math.max(5, card.intervalo_sm2 * 2) // Dobro de dias com piso em 5 dias
            break
        default:
            return NextResponse.json({ message: 'Avaliação inválida' }, { status: 400 })
    }

    const nova_data_revisao = new Date()
    nova_data_revisao.setDate(nova_data_revisao.getDate() + novo_intervalo)

    const updatedCard = await prisma.flashcard.update({
        where: { id: flashcard_id },
        data: {
            intervalo_sm2: novo_intervalo,
            proxima_revisao: nova_data_revisao
        }
    })

    return NextResponse.json({
        message: 'Revisão registrada via algoritmo SM-2 Mapeado!',
        flashcard: updatedCard 
    }, { status: 200 })
  } catch (err) {
    console.error('[FLASHCARD_AVALIAR_POST_ERROR]', err)
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 })
  }
}
