import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const {
      row_index,
      nama_validator,
      kode_unik,
      campaign,
      tipe_donatur,
      jenis_donasi,
      kategori,
      pelaksana_program,
      metode,
    } = data;

    // Use id from the payload: the frontend sends 'row_index' but we pass 'id' or we can check both
    const recordId = data.id || row_index;

    // Validate required fields
    if (!recordId) {
      return NextResponse.json(
        { error: 'Missing id or row_index' },
        { status: 400 }
      );
    }

    // Update record in Supabase
    const { error: updateError } = await supabase
      .from('finance')
      .update({
        nama_validator: nama_validator || '',
        kode_unik: kode_unik || '',
        campaign: campaign || '',
        tipe_donatur: tipe_donatur || '',
        jenis_donasi: jenis_donasi || '',
        kategori: kategori || '',
        pelaksana_program: pelaksana_program || '',
        metode: metode || '',
      })
      .eq('id', recordId);

    if (updateError) throw updateError;

    return NextResponse.json({
      message: 'Data berhasil divalidasi!',
    });
  } catch (error) {
    console.error('Submit validation error:', error);
    return NextResponse.json(
      { error: 'Failed to submit validation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
