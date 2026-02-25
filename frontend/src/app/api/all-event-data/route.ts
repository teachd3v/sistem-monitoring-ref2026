import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!events || events.length === 0) {
      return NextResponse.json([]);
    }

    const eventData = events.map((row) => ({
      timestamp: row.created_at,
      nama_event: row.nama_event,
      lokasi: row.lokasi,
      tanggal_pelaksanaan: row.tanggal_pelaksanaan,
      dokumentasi: row.dokumentasi_urls || '-',
      peserta: row.peserta,
      pelaksana_event: row.pelaksana_event,
      pic_report: row.pic_report,
    }));

    return NextResponse.json(eventData);

  } catch (error) {
    console.error('Error fetching event data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
