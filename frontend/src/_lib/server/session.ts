import 'server-only'
import { cookies } from 'next/headers' 
import { JWTPayload, SignJWT, jwtVerify } from 'jose' 

const secretKey = process.env.SESSION_SECRET
const sessionTimeoutInSecondsString = process.env.NEXT_PUBLIC_SESSION_TIMEOUT;
 
if(!secretKey) throw new Error('SESSION_SECRET env not set');

const encodedKey = new TextEncoder().encode(secretKey)

interface SessionPayload extends JWTPayload{
  apiRootJwt:string
}

 async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}
 
 async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload
  } catch (error) {
    console.log('Failed to verify session')
    console.log(error)
  }
}
// Fallback when NEXT_PUBLIC_SESSION_TIMEOUT is missing, "0", or non-numeric.
// A zero/NaN timeout mints cookies that expire instantly, causing an
// infinite /auth/login <-> /home/work redirect loop, so never allow it.
const DEFAULT_SESSION_TIMEOUT_SECONDS = 1500;

export async function buildSession(rootJwt: string, publicJwt: string) {
  const parsed = parseInt(sessionTimeoutInSecondsString ?? '', 10);
  const timeoutSeconds = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SESSION_TIMEOUT_SECONDS;
  const expiresAt = new Date(Date.now());
  expiresAt.setSeconds(expiresAt.getSeconds() + timeoutSeconds);
  const sessionToken = await encrypt({ apiRootJwt: rootJwt, expiresAt });
  const isSecure = process.env.NODE_ENV === 'production';
  const opts = { expires: expiresAt, sameSite: 'lax' as const, path: '/', secure: isSecure };
  return {
    sessionToken,
    publicJwt,
    timestamp: Date.now().toString(),
    sessionOpts: { ...opts, httpOnly: true },
    publicOpts: { ...opts, httpOnly: false },
  };
}

export async function createSession(rootJwt: string, publicJwt: string) {
  const s = await buildSession(rootJwt, publicJwt);
  const cookieStore = await cookies();
  cookieStore.set('session', s.sessionToken, s.sessionOpts);
  cookieStore.set('jwt', s.publicJwt, s.publicOpts);
  cookieStore.set('session_timestamp', s.timestamp, s.publicOpts);
}
export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
  cookieStore.delete('jwt')
  cookieStore.delete('session_timestamp')
}
export async function getJwt() { 
  const session = (await cookies()).get('session')?.value;
  const payload = await decrypt(session)
 
  if (!session || !payload || !payload.apiRootJwt) {
    return null
  }
  return payload.apiRootJwt;
}
