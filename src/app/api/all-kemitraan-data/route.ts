import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: kemitraanList, error } = await supabase
      .from('kemitraan')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!kemitraanList || kemitraanList.length === 0) {
      return NextResponse.json([]);
    }

    const kemitraanData = kemitraanList.map((row) => ({
      timestamp: row.created_at,
      nama_mitra: row.nama_mitra,
      tanggal_kerjasama: row.tanggal_kerjasama,
      dokumen_pks: row.pks_urls || '-',
      dokumentasi_kegiatan: row.dokumentasi_urls || '-',
      pelaksana_event: row.pelaksana_event,
      pic_report: row.pic_report,
    }));

    return NextResponse.json(kemitraanData);

  } catch (error) {
    console.error('Error fetching kemitraan data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kemitraan data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
