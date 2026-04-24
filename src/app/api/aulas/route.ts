import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'
import { rankVideos } from '@/lib/gemini'
import ytSearch from 'yt-search'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

    const payload = await verifyJWT(token)
    if (!payload || !payload.id) return NextResponse.json({ message: 'Token inválido' }, { status: 401 })

    const usuario_id = payload.id as string

    // 1. Pegar parâmetro de matéria da URL
    const { searchParams } = new URL(req.url)
    const materiaQuery = searchParams.get('materia')

    // 2. Definir matérias do usuário (prioridade para ConteudoEdital)
    const edital = await prisma.conteudoEdital.findUnique({
      where: { usuario_id }
    })

    const plano = await prisma.planoSemanal.findFirst({
        where: { usuario_id },
        orderBy: { semana_inicio: 'desc' }
    });

    let materiasDisponiveis: string[] = []
    let materiasSugeridasPlano: string[] = []
    
    // Pegar matérias do edital
    if (edital && edital.materias_json) {
        materiasDisponiveis = Object.keys(edital.materias_json as any)
    } else {
        const nivelamentos = await prisma.nivelamento.findMany({
            where: { usuario_id },
            select: { materia: true }
        })
        materiasDisponiveis = nivelamentos.map((n: { materia: string }) => n.materia)
    }

    if (materiasDisponiveis.length === 0) {
        materiasDisponiveis = ['Português', 'Direito Administrativo', 'Raciocínio Lógico']
    }

    // 3. Pegar matérias do plano para HOJE
    const diasSemanaMap: Record<number, string> = {
        0: 'domingo', 1: 'segunda', 2: 'terca', 3: 'quarta', 4: 'quinta', 5: 'sexta', 6: 'sabado'
    };
    const hoje = diasSemanaMap[new Date().getDay()];
    
    if (plano && (plano.atividades_json as any)[hoje]) {
        const atividadesHoje = (plano.atividades_json as any)[hoje];
        materiasSugeridasPlano = atividadesHoje.map((a: any) => a.materia);
    }

    // Prioridade na seleção da matéria:
    // 1. Matéria da Query string (filtro do usuário)
    // 2. Matéria do Plano de Hoje
    // 3. Primeira matéria disponível do Edital
    const materiaAtual = materiaQuery || materiasSugeridasPlano[0] || materiasDisponiveis[0]

    // 4. Pegar parâmetro de duração
    const duration = searchParams.get('duration') || 'medium' // medium (4-20m) ou long (>20m)

    // 5. Refinar busca com Tópicos do Edital
    const topicoQuery = searchParams.get('topico');
    let todosTopicos: string[] = [];
    
    if (edital && edital.materias_json && (edital.materias_json as any)[materiaAtual]) {
        const topicos = (edital.materias_json as any)[materiaAtual];
        if (Array.isArray(topicos)) {
            todosTopicos = topicos;
        }
    }

    let topicoAtivo = topicoQuery;
    if (!topicoAtivo && todosTopicos.length > 0) {
        // Se não foi enviado um tópico, pegamos o primeiro tópico da matéria em vez de ser aleatório
        topicoAtivo = todosTopicos[0];
    }

    const searchQuery = topicoAtivo 
        ? `${materiaAtual} ${topicoAtivo} aula concurso`
        : `${materiaAtual} aula curso completo concurso`
    
    // Buscamos 15 resultados para a IA filtrar os 8 melhores
    const searchResult = await ytSearch(searchQuery);

    const rawVideos = searchResult.videos.slice(0, 15).map((item: any) => ({
      id: item.videoId,
      titulo: item.title,
      descricao: item.description || '',
      thumb: item.thumbnail,
      canal: item.author.name,
      data_publicacao: item.ago,
      materia: materiaAtual,
      topico: topicoAtivo,
      no_plano_hoje: materiasSugeridasPlano.includes(materiaAtual)
    }))

    // 7. Curadoria por IA (Topico 2)
    const videos = await rankVideos(rawVideos, materiaAtual, topicoAtivo || "")

    return NextResponse.json({ 
        videos, 
        materias: materiasDisponiveis,
        materia_ativa: materiaAtual,
        topicos_materia: todosTopicos,
        topico_atual: topicoAtivo || "",
        plano_hoje: materiasSugeridasPlano
    }, { status: 200 })
  } catch (err) {
    console.error('[AULAS_GET_ERROR]', err)
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 })
  }
}

