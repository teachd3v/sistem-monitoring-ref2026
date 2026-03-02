import { NextResponse } from 'next/server';
import { DropdownOptions } from '@/lib/reference-data';

export async function GET() {
  try {
    return NextResponse.json(DropdownOptions);
  } catch (err) {
    console.error('Dropdown options error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch dropdown options', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
