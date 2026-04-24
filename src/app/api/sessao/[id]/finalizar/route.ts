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
    const sessao_id = params.id

    const sessaoAtual = await prisma.sessao.findUnique({ where: { id: sessao_id } })
    if (!sessaoAtual) return NextResponse.json({ message: 'Sessão não encontrada' }, { status: 404 })

    // Validação de segurança para garantir q a sessão pertence ao usuário
    if (sessaoAtual.usuario_id !== usuario_id) {
      return NextResponse.json({ message: 'Sessão pertence a outro usuário' }, { status: 403 })
    }

    if (sessaoAtual.fim) {
      return NextResponse.json({ message: 'Esta sessão já foi finalizada anteriormete' }, { status: 400 })
    }

    // Calcular xp (Exemplo: 10xp por acerto + 10xp por concluir sessao)
    const xpAcurado = (sessaoAtual.acertos * 10) + 10

    // Finaliza sessão
    const sessaoAtualizada = await prisma.sessao.update({
      where: { id: sessao_id },
      data: {
        fim: new Date(),
        xp_ganho: xpAcurado
      }
    })

    // Atualiza o nível e XP do usuário também...
    await prisma.usuario.update({
      where: { id: usuario_id },
      data: {
        xp: { increment: xpAcurado }
        // Se a xp passar a proxima marcaçao de Nível, podiamos atualizar o nivel aqui ou na interface
      }
    })

    return NextResponse.json({ 
      message: 'Sessão finalizada',
      resumo: sessaoAtualizada 
    }, { status: 200 })
  } catch (err) {
    console.error('[SESSAO_FINALIZAR_POST_ERROR]', err)
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 })
  }
}
