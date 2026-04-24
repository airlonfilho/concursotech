import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload || !payload.id) {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 })
    }

    const usuario_id = payload.id as string

    const { cargo, banca, modalidade, data_prova, horas_dia, dias_semana } = await req.json()

    if (!cargo || !data_prova || !horas_dia) {
      return NextResponse.json(
        { message: 'Parâmetros insuficientes' },
        { status: 400 }
      )
    }

    // Upsert para atualizar se já existir ou criar um novo
    const concurso = await prisma.concurso.upsert({
      where: { usuario_id },
      update: {
        cargo,
        banca: banca || 'A Definir',
        modalidade: modalidade || 'Nível Superior',
        data_prova: new Date(data_prova),
        horas_dia,
        dias_semana: dias_semana || ['SEG', 'TER', "QUA", "QUI", "SEX", "SAB", "DOM"]
      },
      create: {
        usuario_id,
        cargo,
        banca: banca || 'A Definir',
        modalidade: modalidade || 'Nível Superior',
        data_prova: new Date(data_prova),
        horas_dia,
        dias_semana: dias_semana || ['SEG', 'TER', "QUA", "QUI", "SEX", "SAB", "DOM"]
      }
    })

    return NextResponse.json(
      { message: 'Configuração do concurso salva com sucesso', concurso },
      { status: 200 }
    )
  } catch (err: any) {
    console.error('[CONCURSO_POST_ERROR]', err)
    return NextResponse.json(
      { message: 'Erro interno no servidor' },
      { status: 500 }
    )
  }
}
