import { NextRequest, NextResponse } from 'next/server';
import { buildSession } from '@/_lib/server/session';

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  const res = await fetch(process.env.API_URL + '/api/users/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      password,
      serverSecret: process.env.SERVER_SECRET,
    }),
  }).catch(() => null);

  if (!res) {
    return NextResponse.json({ error: 'Cannot reach the server. Please try again.' }, { status: 503 });
  }

  if (!res.ok) {
    return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
  }

  const data = await res.json().catch(() => null);

  if (!data?.jwt || !data?.publicJwt) {
    return NextResponse.json({ error: 'Unexpected server response.' }, { status: 500 });
  }

  const s = await buildSession(data.jwt, data.publicJwt);

  const response = NextResponse.json({ ok: true });
  response.cookies.set('session', s.sessionToken, s.sessionOpts);
  response.cookies.set('jwt', s.publicJwt, s.publicOpts);
  response.cookies.set('session_timestamp', s.timestamp, s.publicOpts);
  return response;
}
