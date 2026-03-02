import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { REJECT_MARKER } from '@/lib/constants';

/**
 * Parse amount string like "Rp 1.000.000" or "1000000" to number
 */
function parseAmount(amountStr: string | number | null | undefined): number {
  if (amountStr === null || amountStr === undefined || amountStr === '') return 0;
  // If already a number
  if (typeof amountStr === 'number') return amountStr;
  try {
    // Remove "Rp", spaces, and dots (thousand separators), keep commas
    const cleaned = String(amountStr)
      .replace(/Rp\s*/gi, '')
      .replace(/\./g, '')
      .replace(/,/g, '');
    return parseFloat(cleaned) || 0;
  } catch {
    return 0;
  }
}

export async function GET() {
  try {
    // Ambil semua data dari tabel finance
    const { data: financeData, error } = await supabase
      .from('finance')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      throw error;
    }

    if (!financeData || financeData.length === 0) {
      return NextResponse.json([]);
    }

    // Filter hanya data yang sudah tervalidasi (nama_validator terisi, bukan REJECT_MARKER)
    const validatedData = financeData.filter((item) => {
      const validator = item.nama_validator ? String(item.nama_validator).trim() : '';
      return validator !== '' && validator !== REJECT_MARKER;
    });

    if (validatedData.length === 0) {
      return NextResponse.json([]);
    }

    // Format data untuk Excel / PDF
    const formattedData = validatedData.map((item, index) => ({
      'No': index + 1,
      'Tanggal Upload': item.timestamp || '-',
      'Date (Trx)': item.date || '-',
      'FT Number': item.ft_number || '-',
      'Keterangan': item.keterangan || '-',
      'Nama Donatur': item.nama_donatur || '-',
      'Amount (Rp)': parseAmount(item.amount),
      'Organ (PIC)': item.organ || item.pelaksana_program || '-',
      'Campaign': item.campaign || '-',
      'Tipe Donasi': item.tipe_donasi || '-',
      'Validator': item.nama_validator || '-',
      'Status': 'Tervalidasi',
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error fetching export data:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data export.', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
