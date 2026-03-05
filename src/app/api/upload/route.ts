import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { 
  matchCampaignByAmount, 
  getKategori, 
  getMetode, 
  getJenisDonasi,
  resolveFallbackCampaign 
} from '@/lib/reference-data';

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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
    return amountStr;
  }
}

const REQUIRED_HEADERS = ['Date', 'Description', 'Amount', 'FT Number'];

const FT_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function generateFtNumber(): string {
  let result = '';
  for (let i = 0; i < 9; i++) {
    result += FT_CHARSET[Math.floor(Math.random() * FT_CHARSET.length)];
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const organ = (formData.get('organ') as string) || '';

    if (!file) {
      return NextResponse.json(
        { error: 'Tidak ada file yang diupload.' },
        { status: 400 }
      );
    }

    // Parse file based on type
    let records: string[][];
    const isXlsx = /\.(xlsx|xls)$/i.test(file.name);

    if (isXlsx) {
      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
        records = data.map(row => row.map((cell: any) => String(cell ?? '')));
      } catch (parseErr) {
        return NextResponse.json(
          { error: 'Format XLSX tidak valid. Pastikan file adalah Excel yang benar.', details: parseErr instanceof Error ? parseErr.message : 'Parse error' },
          { status: 400 }
        );
      }
    } else {
      // CSV - auto-detect delimiter (comma or semicolon)
      const fileContent = await file.text();
      const firstLine = fileContent.split('\n')[0] || '';
      const commaCount = (firstLine.match(/,/g) || []).length;
      const semicolonCount = (firstLine.match(/;/g) || []).length;
      const delimiter = semicolonCount > commaCount ? ';' : ',';

      try {
        records = parse(fileContent, {
          skip_empty_lines: true,
          relax_column_count: true,
          delimiter,
        });
      } catch (parseErr) {
        return NextResponse.json(
          { error: 'Format CSV tidak valid. Pastikan file adalah CSV yang benar.', details: parseErr instanceof Error ? parseErr.message : 'Parse error' },
          { status: 400 }
        );
      }
    }

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'File kosong.' },
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
        // Generate unique 9-char alphanumeric code, avoid collisions within file
        let candidate = generateFtNumber();
        let tries = 0;
        while (seenFtNumbers.has(candidate) && tries < 20) {
          candidate = generateFtNumber();
          tries++;
        }
        ftNumber = candidate;
        autoGenerated.push({ row: rowNum, ftNumber });
      }

      // Check for duplicate FT Number within the same file
      if (seenFtNumbers.has(ftNumber)) {
        inFileDuplicates.push({ row: rowNum, ftNumber });
        continue;
      }
      seenFtNumbers.add(ftNumber);

      // Validate date - must be non-empty AND parseable
      const dateValue = (cleanRow[dateIndex] || '').trim();
      if (!dateValue) {
        rowErrors.push({ row: rowNum, ftNumber, message: 'Kolom Date kosong' });
        continue;
      }
      const parsedDate = new Date(dateValue);
      if (isNaN(parsedDate.getTime())) {
        rowErrors.push({ row: rowNum, ftNumber, message: `Format Date tidak valid: "${dateValue}". Gunakan format seperti: 2/20/2026 6:55:00 AM` });
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

      // Auto-tagging berdasarkan rules baru di reference-data.ts
      let autoCampaign = '';
      let autoPelaksanaProgram = '';
      let autoKodeUnik: number | null = null;
      const autoKategori = getKategori(cleanRow[descriptionIndex] || '');
      const autoMetode = getMetode(cleanRow[descriptionIndex] || '');
      // Tipe Donatur default Individu
      const autoTipeDonatur = 'Individu';
      let autoJenisDonasi = '';

      let matchedCampaign = matchCampaignByAmount(cleanAmount);
      
      // Jika tidak ada kode unik / tidak cocok, jalankan logic fallback
      if (!matchedCampaign) {
        matchedCampaign = resolveFallbackCampaign(dateValue, cleanRow[descriptionIndex] || '');
      }

      if (matchedCampaign) {
        autoCampaign = matchedCampaign.nama_campaign;
        autoPelaksanaProgram = matchedCampaign.pelaksana_program;
        autoKodeUnik = matchedCampaign.kode_unik ? parseInt(matchedCampaign.kode_unik, 10) : null;
        
        // Jenis donasi berdasarkan campaign name logic
        autoJenisDonasi = getJenisDonasi(autoCampaign);
      }

      processedData.push({
        ft_number: ftNumber,
        date: formattedDate,
        nama_donatur: namaDonatur,
        keterangan: keterangan,
        amount: formattedAmount,
        organ: organ,
        // Auto-tagged fields
        campaign: autoCampaign,
        pelaksana_program: autoPelaksanaProgram,
        kode_unik: autoKodeUnik,
        kategori: autoKategori,
        metode: autoMetode,
        tipe_donatur: autoTipeDonatur,
        jenis_donasi: autoJenisDonasi,
      });
    }

    // ── PRE-INSERTION GATE ──────────────────────────────────────────────────
    // Jika ada SATU SAJA baris yang error (date invalid, FT number kosong, dll)
    // batalkan seluruh proses. Tidak ada data yang masuk ke DB.
    if (rowErrors.length > 0) {
      return NextResponse.json({
        error: `Upload dibatalkan: ${rowErrors.length} baris memiliki kesalahan format. Tidak ada data yang disimpan. Perbaiki baris yang ditandai lalu upload ulang.`,
        validationErrors: rowErrors,
        summary: {
          totalRows: dataRows.filter(row => {
            const clean = [...row];
            while (clean.length > 0 && clean[clean.length - 1] === '') clean.pop();
            return clean.length > 0;
          }).length,
          inserted: 0,
          dbDuplicates: 0,
          inFileDuplicates: inFileDuplicates.length,
          errorRows: rowErrors.length,
          autoGenerated: 0,
          dbDuplicateFtNumbers: [],
          inFileDuplicateFtNumbers: inFileDuplicates.map(r => r.ftNumber),
          autoGeneratedFtNumbers: [],
          errors: rowErrors,
        },
      }, { status: 400 });
    }
    // ─────────────────────────────────────────────────────────────────────────

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
