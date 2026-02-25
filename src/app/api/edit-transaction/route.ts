import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const {
      row_index,
      date,
      nama_donatur,
      keterangan,
      amount,
    } = data;

    const recordId = data.id || row_index;

    // Validate required fields
    if (!recordId) {
      return NextResponse.json(
        { error: 'Missing id or row_index' },
        { status: 400 }
      );
    }

    // Update the record in Supabase
    const { error: updateError } = await supabase
        .from('finance')
        .update({
          date: date || '',
          nama_donatur: nama_donatur || '',
          keterangan: keterangan || '',
          amount: amount || '',
        })
        .eq('id', recordId);

    if (updateError) throw updateError;

    return NextResponse.json({
      message: 'Data berhasil diupdate!',
    });
  } catch (error) {
    console.error('Edit transaction error:', error);
    return NextResponse.json(
      { error: 'Failed to edit transaction', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
