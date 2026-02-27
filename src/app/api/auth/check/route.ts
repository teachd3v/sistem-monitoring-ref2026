import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const TOKENS: Record<string, { cookie: string; token: string }> = {
  validasi: { cookie: 'validasi_token', token: 'validasi_session_active' },
  upload: { cookie: 'upload_token', token: 'upload_session_active' },
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'validasi';
  const config = TOKENS[type];

  if (!config) {
    return NextResponse.json({ authenticated: false });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(config.cookie);

  if (token?.value === config.token) {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false });
}
