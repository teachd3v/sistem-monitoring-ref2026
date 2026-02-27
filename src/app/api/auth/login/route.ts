import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const CREDENTIALS: Record<string, { username: string; password: string; cookie: string; token: string }> = {
  validasi: {
    username: 'validator',
    password: 'REF@2026',
    cookie: 'validasi_token',
    token: 'validasi_session_active',
  },
  upload: {
    username: 'finance',
    password: 'REF@2026',
    cookie: 'upload_token',
    token: 'upload_session_active',
  },
};

export async function POST(req: Request) {
  try {
    const { username, password, type = 'validasi' } = await req.json();
    const cred = CREDENTIALS[type];

    if (!cred) {
      return NextResponse.json({ success: false, message: 'Tipe login tidak valid.' }, { status: 400 });
    }

    if (username === cred.username && password === cred.password) {
      const cookieStore = await cookies();
      cookieStore.set(cred.cookie, cred.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 1 hari
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'Username atau password salah.' }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan.' }, { status: 500 });
  }
}
