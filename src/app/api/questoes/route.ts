import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJWT } from '@/lib/auth'

import { mockQuestoes } from '@/lib/mock-questoes'

// Mapeia o mock do arquivo central para o formato esperado pela API/Frontend
const formattedMock = mockQuestoes.map(q => ({
  id: `q${q.numero}`,
  banca: q.banca,
  ano: q.ano,
  materia: q.disciplina,
  cargo: q.cargo,
  dificuldade: q.nivel || 'Média',
  enunciado: q.enunciado,
  alternativas: Object.entries(q.alternativas).map(([key, val]) => ({
    id: key,
    texto: val
  })),
  resposta_correta: q.resposta_correta,
  assunto: q.assunto,
  explicacao: `O gabarito oficial é a alternativa ${q.resposta_correta}.` // Complementado pelo Gemini no detalhe
}))


export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

    const payload = await verifyJWT(token)
    if (!payload || !payload.id) return NextResponse.json({ message: 'Token inválido' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const materia = searchParams.get('materia')

    let filtered = formattedMock
    if (materia && materia !== 'Todas') {
      filtered = formattedMock.filter(q => q.materia === materia)
    }

    // Extrai matérias únicas do mock central (disciplina)
    const uniqueMaterias = Array.from(new Set(mockQuestoes.map(q => q.disciplina))).sort()
    const materias = ['Todas', ...uniqueMaterias]

    // Embaralha levemente para não vir sempre igual
    const shuffled = [...filtered].sort(() => Math.random() - 0.5)

    return NextResponse.json({ 
      questoes: shuffled,
      materias: materias 
    }, { status: 200 })
  } catch (err) {
    console.error('[QUESTOES_GET_ERROR]', err)
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 })
  }
}

