import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract form fields
    const nama_event = formData.get('nama_event') as string;
    const lokasi = formData.get('lokasi') as string;
    const tanggal_pelaksanaan = formData.get('tanggal_pelaksanaan') as string;
    const peserta = formData.get('peserta') as string;
    const pelaksana_event = formData.get('pelaksana_event') as string;
    const pic_report = formData.get('pic_report') as string;
    const jumlah_dokumentasi = parseInt(formData.get('jumlah_dokumentasi') as string) || 0;

    // Upload files to Supabase Storage and collect URLs
    const imageUrls: string[] = [];
    for (let i = 0; i < jumlah_dokumentasi; i++) {
      const file = formData.get(`dokumentasi_${i}`) as File;
      if (file) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const fileExt = file.name.split('.').pop() || 'jpg';
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

          const { error } = await supabase.storage
            .from('events')
            .upload(fileName, buffer, {
              contentType: file.type || 'image/jpeg',
            });

          if (error) throw error;

          const { data: publicUrlData } = supabase.storage
            .from('events')
            .getPublicUrl(fileName);

          if (publicUrlData) {
            imageUrls.push(publicUrlData.publicUrl);
          }
        } catch (error) {
          console.error(`Failed to upload file ${file.name}:`, error);
        }
      }
    }

    const dokumentasi_urls = imageUrls.join('|||') || '-';

    // Prepare row data for Supabase Database
    const { error: insertError } = await supabase
      .from('events')
      .insert({
        nama_event,
        lokasi,
        tanggal_pelaksanaan,
        dokumentasi_urls,
        peserta,
        pelaksana_event,
        pic_report,
      });

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      message: 'Data event berhasil disimpan!',
      success: true
    });

  } catch (error) {
    console.error('Error submitting event:', error);
    return NextResponse.json(
      { error: 'Gagal menyimpan data event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
