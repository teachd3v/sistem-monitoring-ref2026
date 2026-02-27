import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const COOKIES: Record<string, string> = {
  validasi: 'validasi_token',
  upload: 'upload_token',
};

export async function POST(req: Request) {
  try {
    const { type = 'validasi' } = await req.json();
    const cookieName = COOKIES[type];

    if (!cookieName) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const cookieStore = await cookies();
    cookieStore.set(cookieName, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
