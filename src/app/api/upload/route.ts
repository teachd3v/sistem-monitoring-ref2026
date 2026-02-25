import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import { supabase } from '@/lib/supabase';

// Indonesian day names
const hariDict: { [key: number]: string } = {
  0: 'Minggu',
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
};

/**
 * Format date with Indonesian day name
 * Input: "2026-02-25T10:30:45" or similar
 * Output: "Senin, 25/02/2026 10:30:45"
 */
function formatDateWithDay(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const dayName = hariDict[date.getDay()];

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${dayName}, ${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch (_) {
    return dateStr; // Return original if parsing fails
  }
}

/**
 * Extract description and donor name from description field
 * Splits by last '-' character
 */
function extractDescAndDonor(description: string): { keterangan: string; namaDonatur: string } {
  if (!description || description.trim() === '') {
    return { keterangan: '', namaDonatur: '' };
  }

  const lastDashIndex = description.lastIndexOf('-');

  if (lastDashIndex === -1) {
    return { keterangan: description.trim(), namaDonatur: '' };
  }

  return {
    keterangan: description.substring(0, lastDashIndex).trim(),
    namaDonatur: description.substring(lastDashIndex + 1).trim(),
  };
}

/**
 * Format amount as Indonesian Rupiah
 * Input: "1000000" or "1,000,000"
 * Output: "Rp 1.000.000"
 */
function formatAmount(amountStr: string): string {
  if (!amountStr || amountStr.trim() === '') {
    return '';
  }

  try {
    // Remove commas if present
    const cleanAmount = amountStr.replace(/,/g, '');
    const numValue = parseFloat(cleanAmount);

    if (isNaN(numValue)) {
      return amountStr;
    }

    // Format with thousand separators using dots
    const formatted = Math.floor(numValue).toLocaleString('id-ID');
    return `Rp ${formatted}`;
  } catch (_) {
    return amountStr;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Read file content
    const fileContent = await file.text();

    // Parse CSV
    const records = parse(fileContent, {
      skip_empty_lines: true,
      relax_column_count: true, // Allow rows with different column counts
    });

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'CSV file is empty' },
        { status: 400 }
      );
    }

    // Remove header row
    const headers = records[0];
    const dataRows = records.slice(1);

    // Process each row
    const processedData: any[] = [];

    for (const row of dataRows) {
      // Take only first 8 columns and remove trailing empty values
      const cleanRow = row.slice(0, 8);
      while (cleanRow.length > 0 && cleanRow[cleanRow.length - 1] === '') {
        cleanRow.pop();
      }

      if (cleanRow.length === 0) continue;

      // Assuming CSV columns: Date, Description, Amount, ... (adjust as needed)
      // Based on Python code: df has columns from CSV headers
      const dateIndex = headers.indexOf('Date');
      const descriptionIndex = headers.indexOf('Description');
      const amountIndex = headers.indexOf('Amount');

      // Format date with Indonesian day name
      const formattedDate = dateIndex !== -1 && cleanRow[dateIndex]
        ? formatDateWithDay(cleanRow[dateIndex])
        : cleanRow[0] || '';

      // Extract description and donor name
      const { keterangan, namaDonatur } = descriptionIndex !== -1 && cleanRow[descriptionIndex]
        ? extractDescAndDonor(cleanRow[descriptionIndex])
        : { keterangan: '', namaDonatur: '' };

      // Format amount
      const formattedAmount = amountIndex !== -1 && cleanRow[amountIndex]
        ? formatAmount(cleanRow[amountIndex])
        : '';

      // Build final row: [Date, Nama Donatur, Keterangan, Amount]
      processedData.push({
        date: formattedDate,
        nama_donatur: namaDonatur,
        keterangan: keterangan,
        amount: formattedAmount,
      });
    }

    if (processedData.length === 0) {
      return NextResponse.json({ error: 'No valid data rows found in CSV.' }, { status: 400 });
    }

    // Insert to Supabase finance table
    const { error: insertError } = await supabase
      .from('finance')
      .insert(processedData);

    if (insertError) throw insertError;

    return NextResponse.json({
      message: 'Data berhasil diproses dan masuk ke Database!',
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process CSV file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
