import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'
import { generateWeeklyPlan } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

    const payload = await verifyJWT(token)
    if (!payload || !payload.id) return NextResponse.json({ message: 'Token inválido' }, { status: 401 })

    const usuario_id = payload.id as string

    // 1. Pegar contexto do usuário
    const concurso = await prisma.concurso.findUnique({ where: { usuario_id } })
    const nivelamentos = await prisma.nivelamento.findMany({ where: { usuario_id } })
    const edital = await prisma.conteudoEdital.findUnique({ where: { usuario_id } })

    if (!concurso) {
      return NextResponse.json({ message: 'Configure seu concurso primeiro' }, { status: 400 })
    }

    // 2. ✨ Chamar Gemini para o Plano
    const planoJson = await generateWeeklyPlan(
      concurso.cargo,
      concurso.horas_dia,
      nivelamentos as any,
      edital?.materias_json
    )


    if (!planoJson) {
      return NextResponse.json({ message: 'IA não conseguiu gerar o plano.' }, { status: 500 })
    }

    // 3. Salvar no Banco
    const agora = new Date()
    const inicioSemana = new Date(agora.setDate(agora.getDate() - agora.getDay() + 1)) // Próxima Segunda ou Segunda atual

    const planoSalvo = await prisma.planoSemanal.create({
      data: {
        usuario_id,
        semana_inicio: inicioSemana,
        atividades_json: planoJson as any,
        meta_horas: concurso.horas_dia * 6 // Meta total de horas recomendada
      }
    })

    return NextResponse.json({ 
      message: 'Plano Semanal gerado!',
      plano: planoSalvo
    }, { status: 201 })

  } catch (err) {
    console.error('[PLANO_ESTUDOS_ERROR]', err)
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 })
  }
}
