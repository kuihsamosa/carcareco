import { NextResponse, NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

async function getSessionJwt(request: NextRequest): Promise<string | null> {
  const session = request.cookies.get('session')?.value;
  if (!session) return null;
  try {
    const key = new TextEncoder().encode(process.env.SESSION_SECRET);
    const { payload } = await jwtVerify(session, key, { algorithms: ['HS256'] });
    return (payload.apiRootJwt as string) ?? null;
  } catch {
    return null;
  }
}

export default async function authorizationMiddleware(request: NextRequest, response: NextResponse) {
  const path = request.nextUrl.pathname;
  const isProtectedRoute = path.startsWith('/home');

  if (path.includes('/home/logout')) {
    const redirect = NextResponse.redirect(new URL('/auth/login', request.url));
    redirect.cookies.delete('session');
    redirect.cookies.delete('jwt');
    redirect.cookies.delete('session_timestamp');
    return redirect;
  }

  const jwt = await getSessionJwt(request);

  if (isProtectedRoute && !jwt) {
    return NextResponse.redirect(new URL('/auth/login', request.nextUrl));
  }

  if (!isProtectedRoute && jwt) {
    return NextResponse.redirect(new URL('/home/work', request.nextUrl));
  }

  return response;
}
