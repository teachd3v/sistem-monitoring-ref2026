import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { REJECT_MARKER } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const recordId = data.id;
    const undo = data.undo === true;

    if (!recordId) {
      return NextResponse.json(
        { error: 'Missing id' },
        { status: 400 }
      );
    }

    const updatePayload = undo
      ? { nama_validator: '' }
      : {
          nama_validator: REJECT_MARKER,
          kode_unik: '',
          campaign: '',
          tipe_donatur: '',
          jenis_donasi: '',
          kategori: '',
          pelaksana_program: '',
          metode: '',
        };

    const { error: updateError } = await supabase
      .from('finance')
      .update(updatePayload)
      .eq('id', recordId);

    if (updateError) throw updateError;

    return NextResponse.json({
      message: undo
        ? 'Penolakan dibatalkan. Status kembali ke Pending.'
        : 'Transaksi berhasil ditolak.',
    });
  } catch (error) {
    console.error('Reject transaction error:', error);
    return NextResponse.json(
      { error: 'Failed to process rejection', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
