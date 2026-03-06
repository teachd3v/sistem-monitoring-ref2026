import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { OrganOptions } from '@/lib/reference-data';

// Basic credentials for validator and finance
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

// Auto-generate viewer accounts from OrganOptions
const VIEWER_ACCOUNTS: Record<string, { cookie: string; tokenPrefix: string; program: string }> = {};
OrganOptions.forEach(organ => {
  const username = `viewer_${organ.toLowerCase().replace(/\s+/g, '')}`;
  VIEWER_ACCOUNTS[username] = {
    cookie: 'validasi_token',
    tokenPrefix: 'viewer_session_',
    program: organ
  };
});

export async function POST(req: Request) {
  try {
    const { username, password, type = 'validasi' } = await req.json();

    // Specific logic for Validasi (Validator and Viewer sharing the same page)
    if (type === 'validasi') {
      const cred = CREDENTIALS['validasi'];
      
      // 1. Check if Validator
      if (username === cred.username && password === cred.password) {
        const cookieStore = await cookies();
        cookieStore.set(cred.cookie, cred.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24, // 1 day
        });
        return NextResponse.json({ success: true, role: 'validator' });
      }

      // 2. Check if Viewer
      const viewer = VIEWER_ACCOUNTS[username];
      if (viewer && password === 'REF@2026') {
        const cookieStore = await cookies();
        cookieStore.set(viewer.cookie, `${viewer.tokenPrefix}${viewer.program}`, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24, // 1 day
        });
        return NextResponse.json({ success: true, role: 'viewer', program: viewer.program });
      }
      
      return NextResponse.json({ success: false, message: 'Username atau password salah.' }, { status: 401 });
    }

    // Default logic for other types (e.g. Upload)
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
        maxAge: 60 * 60 * 24, // 1 day
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'Username atau password salah.' }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan.' }, { status: 500 });
  }
}
