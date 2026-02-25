import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Parse date from formatted string like "Senin, 25/02/2026 10:30:45"
 * Returns Date object or null if parsing fails
 */
function parseFormattedDate(dateStr: string): Date | null {
  try {
    // Remove day name if present (e.g., "Senin, ")
    let cleanDate = dateStr;
    if (dateStr.includes(', ')) {
      cleanDate = dateStr.split(', ')[1];
    }

    // Parse "DD/MM/YYYY HH:MM:SS" format
    const parts = cleanDate.split(' ');
    if (parts.length === 0) return null;

    const datePart = parts[0]; // "DD/MM/YYYY"
    const timePart = parts[1] || '00:00:00'; // "HH:MM:SS"

    const [day, month, year] = datePart.split('/').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    if (!day || !month || !year) return null;

    // Create Date object (month is 0-indexed in JS)
    return new Date(year, month - 1, day, hours || 0, minutes || 0, seconds || 0);
  } catch (_) {
    return null;
  }
}

export async function GET() {
  try {
    // Fetch all data from Supabase
    const { data: financeValues, error } = await supabase
      .from('finance')
      .select('*');

    if (error) throw error;

    if (!financeValues || financeValues.length === 0) {
      return NextResponse.json([]);
    }

    const allData = financeValues.map((row) => {
      const validator = row.nama_validator ? row.nama_validator.trim() : '';
      const status = validator !== '' ? 'Tervalidasi' : 'Pending';

      return {
        id: row.id,
        row_index: row.row_index,
        date: row.date || '',
        nama_donatur: row.nama_donatur || '',
        keterangan: row.keterangan || '',
        amount: row.amount || '',
        status,
        validation: {
          nama_validator: row.nama_validator || '',
          kode_unik: row.kode_unik || '',
          campaign: row.campaign || '',
          tipe_donatur: row.tipe_donatur || '',
          jenis_donasi: row.jenis_donasi || '',
          kategori: row.kategori || '',
          pelaksana_program: row.pelaksana_program || '',
          metode: row.metode || '',
        },
      };
    });

    // Sort by date (newest first)
    allData.sort((a, b) => {
      const dateA = parseFormattedDate(a.date);
      const dateB = parseFormattedDate(b.date);

      // Handle null dates
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1; // Put invalid dates at the end
      if (!dateB) return -1;

      // Descending order (newest first)
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json(allData);
  } catch (error) {
    console.error('All finance data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch finance data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
