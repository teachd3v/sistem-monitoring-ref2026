import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: dropdownData, error } = await supabase
      .from('dropdown_validation')
      .select('jenis_kolom, nilai');

    if (error) throw error;

    // Initialize dropdown structure matching frontend expectations exactly
    const dropdowns: Record<string, string[]> = {
      'Nama Validator': [],
      'Campaign': [],
      'Tipe Donatur': [],
      'Jenis Donasi': [],
      'Kategori': [],
      'Pelaksana Program': [],
      'Metode': [],
    };

    if (dropdownData && dropdownData.length > 0) {
      dropdownData.forEach((row) => {
        // the database `jenis_kolom` from our seed data was e.g. "Nama Validator", "Campaign"
        const jenisKolom = row.jenis_kolom.trim();
        const nilai = row.nilai.trim();
        
        switch (jenisKolom.toLowerCase().replace(' ', '_')) {
          case 'nama_validator':
            dropdowns['Nama Validator'].push(nilai);
            break;
          case 'campaign':
            dropdowns['Campaign'].push(nilai);
            break;
          case 'tipe_donatur':
            dropdowns['Tipe Donatur'].push(nilai);
            break;
          case 'jenis_donasi':
            dropdowns['Jenis Donasi'].push(nilai);
            break;
          case 'kategori':
            dropdowns['Kategori'].push(nilai);
            break;
          case 'organ':
          case 'pelaksana_program':
            dropdowns['Pelaksana Program'].push(nilai);
            break;
          case 'metode':
            dropdowns['Metode'].push(nilai);
            break;
        }
      });
    }

    return NextResponse.json(dropdowns);
  } catch (err) {
    console.error('Dropdown options error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch dropdown options', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
