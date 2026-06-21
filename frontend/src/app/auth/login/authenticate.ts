
'use server'
import { createSession } from '@/_lib/server/session'
import { redirect } from 'next/navigation';

export async function authenticate(prevState: { error: string }, formData: FormData)
  : Promise<{ error: string }> {

  let res: Response;
  try {
    res = await fetch(process.env.API_URL + '/api/users/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: formData.get('username'),
        password: formData.get('password'),
        serverSecret: process.env.SERVER_SECRET,
      }),
    });
  } catch (e) {
    console.error('Login network error:', e);
    return { error: 'Cannot reach the server. Please try again.' };
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.log('Login failed:', res.status, text);
    return { error: 'Invalid username or password.' };
  }

  let jsonResponse: { jwt?: string; publicJwt?: string };
  try {
    jsonResponse = await res.json();
  } catch {
    return { error: 'Unexpected server response.' };
  }

  if (jsonResponse.jwt && jsonResponse.publicJwt) {
    await createSession(jsonResponse.jwt, jsonResponse.publicJwt);
    redirect('/home/work');
  }

  console.log('Login response missing jwt fields:', jsonResponse);
  return { error: 'Login failed.' };
} 