import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, JWT_SECRET, JWTPayload } from '@/lib/jwt';

const PUBLIC_PATHS = [
  '/signin',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/images',
];
const AUTH_API_PATHS = ['/api/v1/auth/session', '/api/v1/auth/logout'];
const ADMIN_ONLY_PATHS = ['/usuarios', '/configuracion'];
const STAFF_PATHS = ['/calendar', '/categorias', '/clientes', '/mascotas', '/historial-medico', '/regiones', '/comunas'];
const VET_PATHS = ['/historial-medico'];

function getAllowedOrigins(): string[] {
  return (process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:8081,http://localhost:3000')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);
}

function setCorsHeaders(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get('origin');
  const allowedOrigins = getAllowedOrigins();
  const allowAll = allowedOrigins.includes('*');

  if (origin && (allowAll || allowedOrigins.includes(origin))) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Vary', 'Origin');
  } else if (!origin && allowAll) {
    response.headers.set('Access-Control-Allow-Origin', '*');
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, Accept, Origin',
  );
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (request.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    return setCorsHeaders(request, new NextResponse(null, { status: 204 }));
  }

  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    if (pathname.startsWith('/api/')) {
      return setCorsHeaders(request, NextResponse.next());
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/v1/auth/logout')) {
    return setCorsHeaders(request, NextResponse.next());
  }

  if (AUTH_API_PATHS.some(path => pathname.startsWith(path))) {
    return setCorsHeaders(request, NextResponse.next());
  }

  const cookieToken = request.cookies.get('auth-token')?.value;
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const token = cookieToken || bearerToken;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return setCorsHeaders(request, NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 }));
    }
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const session = payload as unknown as JWTPayload;

    if (pathname.startsWith('/portal')) {
      if (session.role !== 'CLIENT') {
        return NextResponse.redirect(new URL('/', request.url));
      }
      return NextResponse.next();
    }

    if (ADMIN_ONLY_PATHS.some(path => pathname.startsWith(path))) {
      if (session.role !== 'ADMIN') {
        if (pathname.startsWith('/api/')) {
          return setCorsHeaders(request, NextResponse.json({ success: false, error: 'Acceso prohibido' }, { status: 403 }));
        }
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    if (STAFF_PATHS.some(path => pathname.startsWith(path)) || VET_PATHS.some(path => pathname.startsWith(path))) {
      if (!['ADMIN', 'VET', 'RECEPTIONIST'].includes(session.role)) {
        if (pathname.startsWith('/api/')) {
          return setCorsHeaders(request, NextResponse.json({ success: false, error: 'Acceso prohibido' }, { status: 403 }));
        }
        return NextResponse.redirect(new URL('/portal/mis-citas', request.url));
      }
    }

    if (pathname === '/') {
      if (session.role === 'CLIENT') {
        return NextResponse.redirect(new URL('/portal/mis-citas', request.url));
      }
    }

    const response = NextResponse.next();
    response.headers.set('x-user-id', session.userId.toString());
    response.headers.set('x-user-role', session.role);
    response.headers.set('x-user-email', session.email);
    response.headers.set('x-user-name', `${session.firstName} ${session.lastName}`);
    return pathname.startsWith('/api/') ? setCorsHeaders(request, response) : response;
  } catch {
    if (pathname.startsWith('/api/')) {
      return setCorsHeaders(request, NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 }));
    }
    const response = NextResponse.redirect(new URL('/signin', request.url));
    response.cookies.delete('auth-token');
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/|uploads/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};