import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJWT } from '@/lib/auth'

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  const { pathname } = request.nextUrl

  // Se for página de login ou cadastro e tiver token válido, redireciona para o dashboard
  if (pathname === '/login' || pathname === '/cadastro') {
    if (token) {
      try {
        const payload = await verifyJWT(token)
        if (payload) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      } catch (err) {}
    }
    return NextResponse.next()
  }

  // Rotas protegidas: todas, exceto login, cadastro, favicon, globals e rotas de auth
  const isPublicFile = pathname.startsWith('/_next') || pathname.includes('.')
  const isAuthApi = pathname.startsWith('/api/auth')
  
  if (isPublicFile || isAuthApi) {
    return NextResponse.next()
  }

  // Verificar rotas privadas (no nosso caso, as rotas que não são _next, api/auth, etc)
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const payload = await verifyJWT(token)
    if (!payload) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  } catch (err) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (API routes used for auth via REST)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}
