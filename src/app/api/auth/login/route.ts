import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { signJWT } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { email, senha } = await req.json()

    if (!email || !senha) {
      return NextResponse.json(
        { message: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email },
    })

    if (!usuario) {
      return NextResponse.json(
        { message: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    const isValid = await bcrypt.compare(senha, usuario.senha_hash)
    if (!isValid) {
      return NextResponse.json(
        { message: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Criar payload e token final
    const payload = {
      id: usuario.id,
      email: usuario.email,
    }
    const token = await signJWT(payload, '7d')

    // Response + Set-Cookie HTTP Only
    const response = NextResponse.json(
      { message: 'Login realizado com sucesso', usuario: { nome: usuario.nome, email: usuario.email } },
      { status: 200 }
    )

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (err: any) {
    console.error('[AUTH_LOGIN_ERROR]', err)
    return NextResponse.json(
      { message: 'Erro interno no servidor' },
      { status: 500 }
    )
  }
}
