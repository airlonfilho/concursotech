import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'
import { parseSyllabus } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

    const payload = await verifyJWT(token)
    if (!payload || !payload.id) return NextResponse.json({ message: 'Token inválido' }, { status: 401 })

    const usuario_id = payload.id as string
    const { text } = await req.json()

    if (!text || text.length < 50) {
      return NextResponse.json({ message: 'Texto muito curto para análise' }, { status: 400 })
    }

    // 1. Processar com Gemini
    const materias_json = await parseSyllabus(text)
    if (!materias_json) {
       return NextResponse.json({ message: 'Falha ao processar conteúdo. Tente outro formato.' }, { status: 500 })
    }

    // 2. Salvar ou atualizar no banco
    const edital = await prisma.conteudoEdital.upsert({
      where: { usuario_id },
      update: { materias_json, raw_text: text, atualizado_em: new Date() },
      create: { usuario_id, materias_json, raw_text: text }
    })

    // 3. ✨ BONUS: Atualizar os nivelamentos do usuário com as matérias novas (reset ou merge)
    // Vamos apenas garantir que as matérias existam no nivelamento
    const disciplinas = Object.keys(materias_json as any)
    for (const d of disciplinas) {
      const existe = await prisma.nivelamento.findFirst({
        where: { usuario_id, materia: d }
      })
      if (!existe) {
        await prisma.nivelamento.create({
          data: {
            usuario_id,
            materia: d,
            nivel: 'INICIANTE',
            acertos: 0,
            total: 0
          }
        })
      }
    }

    return NextResponse.json({ message: 'Edital processado com sucesso!', edital }, { status: 200 })
  } catch (err) {
    console.error('[EDITAL_POST_ERROR]', err)
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
   try {
    const token = req.cookies.get('auth_token')?.value
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

    const payload = await verifyJWT(token)
    if (!payload || !payload.id) return NextResponse.json({ message: 'Token inválido' }, { status: 401 })

    const edital = await prisma.conteudoEdital.findUnique({
      where: { usuario_id: payload.id as string }
    })

    return NextResponse.json({ edital }, { status: 200 })
  } catch (err) {
    console.error('[EDITAL_GET_ERROR]', err)
    return NextResponse.json({ message: 'Erro ao buscar edital' }, { status: 500 })
  }
}

