import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const FT_LENGTH = 9;
const MAX_COUNT = 500;

function generateCode(): string {
  let result = '';
  for (let i = 0; i < FT_LENGTH; i++) {
    result += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const count = parseInt(body.count, 10);

    if (!count || isNaN(count) || count < 1) {
      return NextResponse.json({ error: 'Jumlah harus berupa angka minimal 1.' }, { status: 400 });
    }
    if (count > MAX_COUNT) {
      return NextResponse.json({ error: `Maksimal generate ${MAX_COUNT} FT Number sekaligus.` }, { status: 400 });
    }

    // Generate candidates with retries to handle collisions
    const candidates = new Set<string>();
    let attempts = 0;
    const maxAttempts = count * 10;

    while (candidates.size < count && attempts < maxAttempts) {
      candidates.add(generateCode());
      attempts++;
    }

    const candidateList = Array.from(candidates);

    // Check against existing FT numbers in DB
    const { data: existing, error: dbError } = await supabase
      .from('finance')
      .select('ft_number')
      .in('ft_number', candidateList);

    if (dbError) throw dbError;

    const existingSet = new Set((existing || []).map((r: any) => r.ft_number));
    let unique = candidateList.filter(c => !existingSet.has(c));

    // If some collided with DB, generate more to fill the gap
    let extraAttempts = 0;
    while (unique.length < count && extraAttempts < count * 5) {
      const extra = generateCode();
      if (!existingSet.has(extra) && !unique.includes(extra)) {
        unique.push(extra);
      }
      extraAttempts++;
    }

    const result = unique.slice(0, count);

    return NextResponse.json({ ftNumbers: result, generated: result.length });
  } catch (error) {
    console.error('Generate FT error:', error);
    return NextResponse.json(
      { error: 'Gagal generate FT Number.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
