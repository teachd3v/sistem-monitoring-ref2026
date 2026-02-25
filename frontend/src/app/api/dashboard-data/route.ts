import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Parse date from formatted string like "Senin, 25/02/2026 10:30:45"
 */
function parseFormattedDate(dateStr: string): Date | null {
  try {
    let cleanDate = dateStr;
    if (dateStr.includes(', ')) {
      cleanDate = dateStr.split(', ')[1];
    }

    const parts = cleanDate.split(' ');
    if (parts.length === 0) return null;

    const datePart = parts[0];
    const timePart = parts[1] || '00:00:00';

    const [day, month, year] = datePart.split('/').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    if (!day || !month || !year) return null;

    return new Date(year, month - 1, day, hours || 0, minutes || 0, seconds || 0);
  } catch (error) {
    return null;
  }
}

/**
 * Parse amount string like "Rp 1.000.000" to number
 */
function parseAmount(amountStr: string): number {
  if (!amountStr) return 0;
  try {
    const cleaned = amountStr.replace(/Rp\s*/g, '').replace(/\./g, '');
    return parseInt(cleaned) || 0;
  } catch (error) {
    return 0;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const campaign = searchParams.get('campaign');
    const organ = searchParams.get('organ');

    // Fetch finance data from Supabase
    const { data: financeValues, error: financeError } = await supabase
      .from('finance')
      .select('*');

    if (financeError) throw financeError;

    // Fetch weekly targets from target_penghimpunan Supabase table
    const TOTAL_TARGET = 1447000000; // 1.447 miliar
    let weeklyTargets: { [key: string]: { startDate: Date, endDate: Date, target: number, percent: number, label: string } } = {};

    try {
      const { data: targetValues, error: targetError } = await supabase
        .from('target_penghimpunan')
        .select('*');

      if (targetError) throw targetError;

      if (targetValues && targetValues.length > 0) {
        targetValues.forEach((row) => {
          const weekLabel = row.pekan;
          const startDateStr = row.start_date;
          const endDateStr = row.end_date;
          const targetAmount = Number(row.target_amount) || 0;
          const percent = Number(row.percent) || 0;

          if (startDateStr && endDateStr) {
            const startDate = new Date(startDateStr);
            const endDate = new Date(endDateStr);

            weeklyTargets[weekLabel] = {
              startDate,
              endDate,
              target: targetAmount,
              percent,
              label: weekLabel
            };
          }
        });
      }
    } catch (error) {
      console.log('Target table fetch failed, using default targets');
      // Default fallback targets for Ramadan 2026
      weeklyTargets = {
        'Pekan 1': { startDate: new Date('2026-02-19'), endDate: new Date('2026-02-25'), target: 144700000, percent: 10, label: 'Pekan 1' },
        'Pekan 2': { startDate: new Date('2026-02-26'), endDate: new Date('2026-03-04'), target: 434100000, percent: 30, label: 'Pekan 2' },
        'Pekan 3': { startDate: new Date('2026-03-05'), endDate: new Date('2026-03-11'), target: 868200000, percent: 60, label: 'Pekan 3' },
        'Pekan 4': { startDate: new Date('2026-03-12'), endDate: new Date('2026-03-20'), target: 1447000000, percent: 100, label: 'Pekan 4' },
      };
    }

    if (!financeValues || financeValues.length === 0) {
      return NextResponse.json({
        summary: { totalDonasi: 0, totalDonatur: 0, totalTransaksi: 0, progressPercent: 0, totalTarget: TOTAL_TARGET },
        weeklyData: [],
        campaignData: [],
        organData: [],
        campaignTableData: []
      });
    }

    // Process and filter data
    const validatedData: any[] = [];

    financeValues.forEach((row) => {
      // Skip if not validated
      if (!row.nama_validator || row.nama_validator.trim() === '') return;
      if (!row.date || row.date.trim() === '') return;

      const dateObj = parseFormattedDate(row.date);
      if (!dateObj) return;

      const rowData = {
        date: dateObj,
        dateStr: row.date,
        nama_donatur: row.nama_donatur || '',
        keterangan: row.keterangan || '',
        amount: parseAmount(row.amount),
        amountStr: row.amount || '',
        campaign: row.campaign || '',
        organ: row.pelaksana_program || '',
      };

      // Apply filters
      if (startDate) {
        const start = new Date(startDate);
        if (rowData.date < start) return;
      }

      if (endDate) {
        const end = new Date(endDate);
        if (rowData.date > end) return;
      }

      if (campaign && campaign !== 'all' && rowData.campaign !== campaign) return;
      if (organ && organ !== 'all' && rowData.organ !== organ) return;

      validatedData.push(rowData);
    });

    // Calculate summary
    const totalDonasi = validatedData.reduce((sum, item) => sum + item.amount, 0);
    const uniqueDonors = new Set(validatedData.map(item => item.nama_donatur).filter(Boolean));
    const totalDonatur = uniqueDonors.size;
    const totalTransaksi = validatedData.length;
    const progressPercent = TOTAL_TARGET > 0 ? Math.round((totalDonasi / TOTAL_TARGET) * 100) : 0;

    // Group by week for line chart (using defined week periods)
    const weeklyData: any[] = [];

    Object.values(weeklyTargets)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      .forEach((weekInfo) => {
        // Calculate cumulative donations up to end of this week
        const cumulativeDonasi = validatedData
          .filter(item => item.date <= weekInfo.endDate)
          .reduce((sum, item) => sum + item.amount, 0);

        weeklyData.push({
          week: `${weekInfo.label} (${format(weekInfo.startDate, 'dd MMM', { locale: id })} - ${format(weekInfo.endDate, 'dd MMM', { locale: id })})`,
          weekKey: weekInfo.label,
          capaian: cumulativeDonasi,
          target: weekInfo.target,
          percent: weekInfo.percent
        });
      });

    // Group by campaign for bar chart
    const campaignMap: { [key: string]: number } = {};

    validatedData.forEach(item => {
      if (item.campaign) {
        if (!campaignMap[item.campaign]) {
          campaignMap[item.campaign] = 0;
        }
        campaignMap[item.campaign] += item.amount;
      }
    });

    const campaignData = Object.entries(campaignMap)
      .map(([name, capaian]) => ({
        campaign: name,
        capaian
      }))
      .sort((a, b) => b.capaian - a.capaian);

    // Group by organ for table
    const organMap: { [key: string]: number } = {};

    validatedData.forEach(item => {
      if (item.organ) {
        if (!organMap[item.organ]) {
          organMap[item.organ] = 0;
        }
        organMap[item.organ] += item.amount;
      }
    });

    const organData = Object.entries(organMap)
      .map(([name, total]) => ({
        organ: name,
        jumlah_donasi: total
      }))
      .sort((a, b) => b.jumlah_donasi - a.jumlah_donasi);

    // Campaign table data
    const campaignTableData = campaignData.map(item => ({
      campaign: item.campaign,
      jumlah_donasi: item.capaian
    }));

    return NextResponse.json({
      summary: {
        totalDonasi,
        totalDonatur,
        totalTransaksi,
        progressPercent,
        totalTarget: TOTAL_TARGET
      },
      weeklyData,
      campaignData,
      organData,
      campaignTableData
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
