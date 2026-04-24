import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

    const payload = await verifyJWT(token)
    if (!payload || !payload.id) return NextResponse.json({ message: 'Token inválido' }, { status: 401 })

    const usuario_id = payload.id as string

    const user = await prisma.usuario.findUnique({
      where: { id: usuario_id },
      select: {
        id: true,
        nome: true,
        email: true,
        avatar: true,
        xp: true,
        nivel: true,
        streak: true,
        created_at: true,
        concurso: true,
      }
    })

    if (!user) return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 })

    return NextResponse.json({ profile: user }, { status: 200 })
  } catch (err) {
    console.error('[USER_PROFILE_GET_ERROR]', err)
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

    const payload = await verifyJWT(token)
    if (!payload || !payload.id) return NextResponse.json({ message: 'Token inválido' }, { status: 401 })

    const usuario_id = payload.id as string
    const body = await req.json()
    
    // Destructuring all possible fields
    const { 
        nome, 
        avatar,
        concurso_nome,
        cargo, 
        banca, 
        modalidade, 
        data_prova, 
        horas_dia, 
        dias_semana 
    } = body

    // 1. Atualiza dados do Usuário principal
    const updatedUser = await prisma.usuario.update({
      where: { id: usuario_id },
      data: {
        nome: nome || undefined,
        avatar: avatar || undefined
      },
      select: {
        id: true,
        nome: true,
        email: true,
        avatar: true,
      }
    })

    // 2. Sincroniza dados do Concurso (Alvo)
    // Usamos UPSERT para garantir que o registro exista
    await prisma.concurso.upsert({
      where: { usuario_id },
      update: {
        nome: concurso_nome || undefined,
        cargo: cargo || undefined,
        banca: banca || undefined,
        modalidade: modalidade || undefined,
        data_prova: data_prova ? new Date(data_prova) : undefined,
        horas_dia: horas_dia !== undefined ? Number(horas_dia) : undefined,
        dias_semana: dias_semana || undefined
      },
      create: {
        usuario_id,
        nome: concurso_nome || 'Geral',
        cargo: cargo || 'Geral',
        banca: banca || 'CESPE/Cebraspe',
        modalidade: modalidade || 'Nível Superior',
        data_prova: data_prova ? new Date(data_prova) : new Date(Date.now() + 1000 * 60 * 60 * 24 * 90), // 90 dias default
        horas_dia: horas_dia !== undefined ? Number(horas_dia) : 4,
        dias_semana: dias_semana || ["SEG", "TER", "QUA", "QUI", "SEX"]
      }
    })

    return NextResponse.json({ 
      message: 'Perfil atualizado com sucesso', 
      profile: updatedUser 
    }, { status: 200 })
  } catch (err: any) {
    console.error('[USER_PROFILE_PUT_ERROR]', err.message, err.stack)
    return NextResponse.json({ 
        message: 'Erro interno no servidor ao salvar perfil',
        debug: err.message 
    }, { status: 500 })
  }
}
