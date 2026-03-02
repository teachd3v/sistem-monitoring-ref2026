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
    if (isNaN(date.getTime())) return dateStr;

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
 * Extract DD/MM/YYYY from a date string for FT Number generation
 */
function extractDateForFT(dateStr: string): string | null {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (_) {
    return null;
  }
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

const REQUIRED_HEADERS = ['Date', 'Description', 'Amount', 'FT Number'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const organ = (formData.get('organ') as string) || '';

    // Fetch rekap_kodeunik untuk auto-tagging campaign
    // Map: kode_unik (number) → { campaign, organ }
    const kodeUnikMap = new Map<number, { campaign: string; organ: string }>();
    try {
      const { data: kodeUnikData } = await supabase
        .from('rekap_kodeunik')
        .select('kode_unik, campaign, organ')
        .not('kode_unik', 'is', null);

      if (kodeUnikData) {
        kodeUnikData.forEach((row) => {
          if (row.kode_unik !== null) {
            kodeUnikMap.set(Number(row.kode_unik), {
              campaign: row.campaign || '',
              organ: row.organ || '',
            });
          }
        });
      }
    } catch (_) {
      // Jika gagal fetch rekap_kodeunik, upload tetap berjalan tanpa auto-tag
      console.warn('Gagal fetch rekap_kodeunik, auto-tag dinonaktifkan');
    }

    if (!file) {
      return NextResponse.json(
        { error: 'Tidak ada file yang diupload.' },
        { status: 400 }
      );
    }

    // Read file content
    const fileContent = await file.text();

    // Parse CSV
    let records: string[][];
    try {
      records = parse(fileContent, {
        skip_empty_lines: true,
        relax_column_count: true,
      });
    } catch (parseErr) {
      return NextResponse.json(
        { error: 'Format CSV tidak valid. Pastikan file adalah CSV yang benar.', details: parseErr instanceof Error ? parseErr.message : 'Parse error' },
        { status: 400 }
      );
    }

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'File CSV kosong.' },
        { status: 400 }
      );
    }

    // Validate headers
    const headers = records[0].map(h => h.trim());
    const dataRows = records.slice(1);

    if (dataRows.length === 0) {
      return NextResponse.json(
        { error: 'File CSV hanya berisi header tanpa data.' },
        { status: 400 }
      );
    }

    const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return NextResponse.json({
        error: `Header CSV tidak lengkap. Kolom yang tidak ditemukan: ${missingHeaders.join(', ')}`,
        foundHeaders: headers.filter(h => h !== ''),
        missingHeaders,
      }, { status: 400 });
    }

    // Get column indices
    const dateIndex = headers.indexOf('Date');
    const descriptionIndex = headers.indexOf('Description');
    const amountIndex = headers.indexOf('Amount');
    const ftNumberIndex = headers.indexOf('FT Number');

    // Validate and process each row
    const processedData: any[] = [];
    const rowErrors: { row: number; ftNumber: string; message: string }[] = [];
    const allFtNumbers: string[] = [];
    const seenFtNumbers = new Set<string>();
    const inFileDuplicates: { row: number; ftNumber: string }[] = [];
    const autoGenerated: { row: number; ftNumber: string }[] = [];
    // Counter for generated FT Numbers to avoid collisions (keyed by base like "BARANG/25/02/2026/ORGAN_A")
    const generatedCounters = new Map<string, number>();

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + 2; // 1-indexed + header row

      // Clean trailing empty values
      const cleanRow = row.slice(0, Math.max(row.length, 8));
      while (cleanRow.length > 0 && cleanRow[cleanRow.length - 1] === '') {
        cleanRow.pop();
      }
      if (cleanRow.length === 0) continue;

      // Get FT Number - auto-generate if empty
      let ftNumber = (cleanRow[ftNumberIndex] || '').trim();
      if (!ftNumber) {
        const description = (cleanRow[descriptionIndex] || '').trim();
        const dateValue = (cleanRow[dateIndex] || '').trim();

        // Try to auto-generate based on BARANG/TUNAI keywords
        const descLower = description.toLowerCase();
        const datePart = extractDateForFT(dateValue);

        if (!datePart) {
          rowErrors.push({ row: rowNum, ftNumber: '-', message: 'FT Number kosong dan Date tidak valid untuk auto-generate' });
          continue;
        }

        let prefix: string | null = null;
        if (descLower.includes('barang')) {
          prefix = 'BARANG';
        } else if (descLower.includes('tunai')) {
          prefix = 'TUNAI';
        }

        if (!prefix) {
          rowErrors.push({ row: rowNum, ftNumber: '-', message: 'FT Number kosong dan Description tidak mengandung kata BARANG atau TUNAI' });
          continue;
        }

        const baseKey = `${prefix}/${datePart}/${organ}`;
        const count = (generatedCounters.get(baseKey) || 0) + 1;
        generatedCounters.set(baseKey, count);

        ftNumber = count > 1 ? `${baseKey}-${count}` : baseKey;
        autoGenerated.push({ row: rowNum, ftNumber });
      }

      // Check for duplicate FT Number within the same file
      if (seenFtNumbers.has(ftNumber)) {
        inFileDuplicates.push({ row: rowNum, ftNumber });
        continue;
      }
      seenFtNumbers.add(ftNumber);

      // Validate date
      const dateValue = (cleanRow[dateIndex] || '').trim();
      if (!dateValue) {
        rowErrors.push({ row: rowNum, ftNumber, message: 'Kolom Date kosong' });
        continue;
      }

      // Validate amount
      const amountValue = (cleanRow[amountIndex] || '').trim();
      if (!amountValue) {
        rowErrors.push({ row: rowNum, ftNumber, message: 'Kolom Amount kosong' });
        continue;
      }

      // Check if amount is a valid number
      const cleanAmount = amountValue.replace(/,/g, '');
      if (isNaN(parseFloat(cleanAmount))) {
        rowErrors.push({ row: rowNum, ftNumber, message: `Amount tidak valid: "${amountValue}"` });
        continue;
      }

      allFtNumbers.push(ftNumber);

      const formattedDate = formatDateWithDay(dateValue);
      const { keterangan, namaDonatur } = cleanRow[descriptionIndex]
        ? extractDescAndDonor(cleanRow[descriptionIndex])
        : { keterangan: '', namaDonatur: '' };
      const formattedAmount = formatAmount(amountValue);

      // Auto-tag campaign & pelaksana_program berdasarkan 2 digit akhir amount
      let autoCampaign = '';
      let autoPelaksanaProgram = '';
      let autoKodeUnik: number | null = null;

      if (kodeUnikMap.size > 0) {
        const numericAmount = Math.round(parseFloat(cleanAmount));
        const last2Digits = numericAmount % 100;
        const matched = kodeUnikMap.get(last2Digits);
        if (matched) {
          autoCampaign = matched.campaign;
          autoPelaksanaProgram = matched.organ;
          autoKodeUnik = last2Digits;
        }
      }

      processedData.push({
        ft_number: ftNumber,
        date: formattedDate,
        nama_donatur: namaDonatur,
        keterangan: keterangan,
        amount: formattedAmount,
        organ: organ,
        // Auto-tagged fields (kosong jika tidak ada match)
        campaign: autoCampaign,
        pelaksana_program: autoPelaksanaProgram,
        kode_unik: autoKodeUnik,
      });
    }

    // Check for existing FT Numbers in database (batch query to avoid URL length limits)
    const existingFtNumbers = new Set<string>();
    const batchSize = 200;

    for (let i = 0; i < allFtNumbers.length; i += batchSize) {
      const batch = allFtNumbers.slice(i, i + batchSize);
      const { data, error: queryError } = await supabase
        .from('finance')
        .select('ft_number')
        .in('ft_number', batch);

      if (queryError) throw queryError;
      data?.forEach(r => existingFtNumbers.add(r.ft_number));
    }

    // Separate new vs duplicate data
    const newData = processedData.filter(row => !existingFtNumbers.has(row.ft_number));
    const dbDuplicates = processedData.filter(row => existingFtNumbers.has(row.ft_number));

    // Insert only new data
    if (newData.length > 0) {
      const { error: insertError } = await supabase
        .from('finance')
        .insert(newData);

      if (insertError) throw insertError;
    }

    // Build response
    const totalProcessable = dataRows.filter(row => {
      const clean = [...row];
      while (clean.length > 0 && clean[clean.length - 1] === '') clean.pop();
      return clean.length > 0;
    }).length;

    return NextResponse.json({
      message: newData.length > 0
        ? `${newData.length} baris berhasil masuk ke database!`
        : 'Tidak ada data baru yang dimasukkan.',
      summary: {
        totalRows: totalProcessable,
        inserted: newData.length,
        dbDuplicates: dbDuplicates.length,
        inFileDuplicates: inFileDuplicates.length,
        errorRows: rowErrors.length,
        autoGenerated: autoGenerated.length,
        dbDuplicateFtNumbers: dbDuplicates.map(r => r.ft_number),
        inFileDuplicateFtNumbers: inFileDuplicates.map(r => r.ftNumber),
        autoGeneratedFtNumbers: autoGenerated.slice(0, 50),
        errors: rowErrors.slice(0, 50),
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Gagal memproses file CSV.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
