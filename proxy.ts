import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifySessionToken } from '@/lib/session';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifySessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);

  if (pathname === '/admin/login') {
    return session ? NextResponse.redirect(new URL('/admin', request.url)) : NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  if (
    session.role !== 'super_admin' &&
    (pathname.startsWith('/admin/templates') || pathname.startsWith('/admin/admins'))
  ) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
