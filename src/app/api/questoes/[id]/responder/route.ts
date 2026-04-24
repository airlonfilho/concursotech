import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'
import { explainQuestion } from '@/lib/gemini'
import { mockQuestoes } from '@/lib/mock-questoes'

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get('auth_token')?.value
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

    const payload = await verifyJWT(token)
    if (!payload || !payload.id) return NextResponse.json({ message: 'Token inválido' }, { status: 401 })

    // Await params as per Next.js 15+ patterns
    const params = await props.params
    const questao_id_param = params.id // ex: "q1"
    const { sessao_id, alternativa_marcada, tempo_segundos } = await req.json()

    if (!sessao_id || !alternativa_marcada || tempo_segundos === undefined) {
      return NextResponse.json({ message: 'Dados incompletos' }, { status: 400 })
    }

    // Encontrar a questão no mock central
    // O ID no frontend vem como "q1", "q2", etc. Extraímos o número.
    const numeroQuestao = parseInt(questao_id_param.replace('q', ''))
    const dadosQuestao = mockQuestoes.find(q => q.numero === numeroQuestao)

    if (!dadosQuestao) {
      return NextResponse.json({ message: 'Questão não encontrada' }, { status: 404 })
    }

    const gabaritoOficial = dadosQuestao.resposta_correta.toLowerCase()
    const ehCorreta = alternativa_marcada.toLowerCase() === gabaritoOficial

    // 1. Inserir Log da Resposta vinculada à Sessão
    const novaResposta = await prisma.resposta.create({
      data: {
        sessao_id,
        questao_id: questao_id_param,
        alternativa: alternativa_marcada,
        correta: ehCorreta,
        tempo_segundos
      }
    })

    // 2. Atualizar o placar da Sessão e garantir erro/acerto persistido
    await prisma.sessao.update({
      where: { id: sessao_id },
      data: {
        acertos: ehCorreta ? { increment: 1 } : undefined,
        erros: !ehCorreta ? { increment: 1 } : undefined,
        materia: dadosQuestao.disciplina // Garante que a sessão tenha a matéria
      }
    })

    // 3. ✨ IA: Gerar explicação dinâmica no Gemini
    const explicacaoAi = await explainQuestion(
      dadosQuestao.enunciado,
      gabaritoOficial,
      alternativa_marcada,
      ehCorreta
    )

    return NextResponse.json({
      message: 'Resposta processada',
      resultado: {
        acertou: ehCorreta,
        gabarito: gabaritoOficial,
        explicacaoAi
      },
      registroDaResposta: novaResposta
    }, { status: 200 })
  } catch (err) {
    console.error('[QUESTOES_RESPONDER_ERROR]', err)
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 })
  }
}
