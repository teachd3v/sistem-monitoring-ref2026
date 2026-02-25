import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract form fields
    const nama_mitra = formData.get('nama_mitra') as string;
    const tanggal_kerjasama = formData.get('tanggal_kerjasama') as string;
    const pelaksana_event = formData.get('pelaksana_event') as string;
    const pic_report = formData.get('pic_report') as string;
    const jumlah_pks = parseInt(formData.get('jumlah_pks') as string) || 0;
    const jumlah_dokumentasi = parseInt(formData.get('jumlah_dokumentasi') as string) || 0;

    // Upload PKS files to Supabase Storage
    const pksUrls: string[] = [];
    for (let i = 0; i < jumlah_pks; i++) {
      const file = formData.get(`pks_${i}`) as File;
      if (file) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const fileExt = file.name.split('.').pop() || 'pdf';
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

          const { error } = await supabase.storage
            .from('kemitraan_pks')
            .upload(fileName, buffer, {
              contentType: file.type || 'application/pdf',
            });

          if (error) throw error;

          const { data: publicUrlData } = supabase.storage
            .from('kemitraan_pks')
            .getPublicUrl(fileName);

          if (publicUrlData) {
            pksUrls.push(publicUrlData.publicUrl);
          }
        } catch (error) {
          console.error(`Failed to upload PKS file ${file.name}:`, error);
        }
      }
    }

    // Upload dokumentasi files to Supabase Storage
    const dokumentasiUrls: string[] = [];
    for (let i = 0; i < jumlah_dokumentasi; i++) {
      const file = formData.get(`dokumentasi_${i}`) as File;
      if (file) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const fileExt = file.name.split('.').pop() || 'jpg';
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

          const { error } = await supabase.storage
            .from('kemitraan_dokumentasi')
            .upload(fileName, buffer, {
              contentType: file.type || 'image/jpeg',
            });

          if (error) throw error;

          const { data: publicUrlData } = supabase.storage
            .from('kemitraan_dokumentasi')
            .getPublicUrl(fileName);

          if (publicUrlData) {
            dokumentasiUrls.push(publicUrlData.publicUrl);
          }
        } catch (error) {
          console.error(`Failed to upload dokumentasi file ${file.name}:`, error);
        }
      }
    }

    const pks_urls = pksUrls.join('|||') || '-';
    const dokumentasi_urls = dokumentasiUrls.join('|||') || '-';

    // Prepare row data for Supabase Database
    const { error: insertError } = await supabase
      .from('kemitraan')
      .insert({
        nama_mitra,
        tanggal_kerjasama,
        pks_urls,
        dokumentasi_urls,
        pelaksana_event,
        pic_report,
      });

    if (insertError) throw insertError;

    return NextResponse.json({
      message: 'Data kemitraan berhasil disimpan!',
      success: true
    });

  } catch (err) {
    console.error('Error submitting kemitraan:', err);
    return NextResponse.json(
      { error: 'Gagal menyimpan data kemitraan', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
