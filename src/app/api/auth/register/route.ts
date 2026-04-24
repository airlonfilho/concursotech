import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const { nome, email, senha } = await req.json()

    if (!nome || !email || !senha) {
      return NextResponse.json(
        { message: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    const alreadyExists = await prisma.usuario.findUnique({
      where: { email },
    })

    if (alreadyExists) {
      return NextResponse.json(
        { message: 'Usuário já existe. Faça login.' },
        { status: 400 }
      )
    }

    const salt = await bcrypt.genSalt(10)
    const senha_hash = await bcrypt.hash(senha, salt)

    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha_hash,
      },
    })

    return NextResponse.json(
      { message: 'Usuário cadastrado com sucesso', userId: usuario.id },
      { status: 201 }
    )
  } catch (err: any) {
    console.error('[AUTH_REGISTER_ERROR]', err)
    return NextResponse.json(
      { message: 'Erro interno no servidor' },
      { status: 500 }
    )
  }
}
