import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'
import { generateMentoriaAnalyses } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

    const payload = await verifyJWT(token)
    if (!payload || !payload.id) return NextResponse.json({ message: 'Token inválido' }, { status: 401 })

    const usuario_id = payload.id as string
    const { nivelamentos } = await req.json()

    if (!nivelamentos) {
      return NextResponse.json({ message: 'Dados insuficientes' }, { status: 400 })
    }

    const promptAI = `O usuário está estudando para concurso. 
    Dados de desempenho (acertos/total por matéria): ${JSON.stringify(nivelamentos)}.
    Gere 2 sugestões de "Plano de Ação" curtas e motivacionais em JSON: [{ "icon": "string", "title": "string", "desc": "string", "color": "hex" }]. 
    Use cores como #5c5cf0 (azul), #f59e0b (laranja), #ef4444 (vermelho).`;

    const mentoria = await generateMentoriaAnalyses(promptAI);

    if (!mentoria) {
      return NextResponse.json({ 
        mentoria: [
            { icon: "bolt", title: "Foco em Revisão", desc: "Aumente sua carga de questões nas matérias base.", color: "#f59e0b" },
            { icon: "history_edu", title: "Pratique Mais", desc: "Consistência é a chave para a aprovação.", color: "#5c5cf0" }
        ] 
      }, { status: 200 })
    }

    return NextResponse.json({ mentoria }, { status: 200 })
  } catch (err) {
    console.error('[MENTORIA_IA_ERROR]', err)
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 })
  }
}
