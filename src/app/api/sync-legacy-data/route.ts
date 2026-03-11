import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { 
  matchCampaignByAmount, 
  getKategori, 
  getMetode, 
  getJenisDonasi,
} from '@/lib/reference-data';

export async function POST() {
  try {
    // 1. Fetch all data and filter manually to ensure we catch all Pending variations
    const { data: allData, error: fetchError } = await supabase
      .from('finance')
      .select('*');

    if (fetchError) throw fetchError;
    
    // Manual filtering for pending structure
    // A record is pending if nama_validator is functionally empty
    const actualPendingData = (allData || []).filter(row => {
        const v = row.nama_validator;
        const isColumnEmpty = !v || v.trim() === '';
        return isColumnEmpty;
    });

    if (actualPendingData.length === 0) {
      return NextResponse.json({ message: 'Tidak ada data Pending yang perlu disinkronisasi.', processedCount: 0 });
    }

    let processedCount = 0;
    const batchSize = 100;

    // 2. Process and update each record
    for (let i = 0; i < actualPendingData.length; i += batchSize) {
      const batch = actualPendingData.slice(i, i + batchSize);
      
      const updates = batch.map((item) => {
        // Run auto-tagging logic based on amount
        let autoCampaign = '';
        let autoPelaksanaProgram = item.organ || '';
        let autoKodeUnik: number | null = null;
        let autoJenisDonasi = '';
        
        // Remove trailing commas if any, and parse amount
        let cleanAmount = '';
        if (typeof item.amount === 'string') {
          cleanAmount = item.amount.replace(/Rp\s?/i, '').replace(/\./g, '').replace(/,/g, '').trim(); 
        } else if (typeof item.amount === 'number') {
          cleanAmount = item.amount.toString();
        }

        let matchedCampaign = matchCampaignByAmount(cleanAmount);
        
        // Handle Organ-based overrides if unmatched and organ is set
        if (!matchedCampaign && item.organ && item.organ !== 'HOLDING') {
             const descLower = (item.keterangan || '').toLowerCase();
             if (descLower.includes('zakat')) {
                matchedCampaign = { nama_campaign: `Zakat ${item.organ}`, kode_unik: null, pelaksana_program: item.organ, jenis_donasi: 'Zakat Umum' };
             } else if (descLower.includes('wakaf')) {
                matchedCampaign = { nama_campaign: `Wakaf ${item.organ}`, kode_unik: null, pelaksana_program: item.organ, jenis_donasi: 'Wakaf' };
             } else if (descLower.includes('infak') || descLower.includes('sedekah')) {
                matchedCampaign = { nama_campaign: `Infak ${item.organ}`, kode_unik: null, pelaksana_program: item.organ, jenis_donasi: 'Infak Tematik' };
             } else {
                matchedCampaign = { nama_campaign: `${item.organ} Berbagi`, kode_unik: null, pelaksana_program: item.organ, jenis_donasi: 'Infak Tematik' }; 
             }
        }

        // We won't run Date fallback here because sync logic usually shouldn't guess date-time based fallback heavily unless requested.
        // We stick to the main matchers.

        if (matchedCampaign) {
          autoCampaign = matchedCampaign.nama_campaign;
          autoPelaksanaProgram = matchedCampaign.pelaksana_program;
          autoKodeUnik = matchedCampaign.kode_unik ? parseInt(matchedCampaign.kode_unik, 10) : null;
          autoJenisDonasi = (matchedCampaign as any).jenis_donasi || getJenisDonasi(autoCampaign);
        }

        const autoKategori = getKategori(item.keterangan || '');
        const autoMetode = getMetode(item.keterangan || '');
        const autoTipeDonatur = 'Individu';

        // Prepare updated flattened fields representing validation data
        // For the empty string fallback, we rely on the DB's current value or empty string
        const updatedFields = {
           campaign: autoCampaign || item.campaign || '',
           pelaksana_program: autoPelaksanaProgram || item.pelaksana_program || '',
           kode_unik: autoKodeUnik !== null ? autoKodeUnik.toString() : item.kode_unik || '',
           kategori: autoKategori || item.kategori || '',
           metode: autoMetode || item.metode || '',
           tipe_donatur: autoTipeDonatur || item.tipe_donatur || '',
           jenis_donasi: autoJenisDonasi || item.jenis_donasi || ''
        };

        return {
          id: item.id,
          fields: updatedFields
        };
      });

      // Update in Supabase
      const updatePromises = updates.map(async (updateData) => {
         const { error } = await supabase
            .from('finance')
            .update(updateData.fields)
            .eq('id', updateData.id);
            
         if (!error) {
             processedCount++;
         } else {
             console.error(`[SYNC API] Error updating row ${updateData.id}:`, error);
         }
      });
      
      await Promise.all(updatePromises);
    }

    return NextResponse.json({ 
      success: true,
      message: `${processedCount} data Pending berhasil disinkronisasi dengan aturan auto-tagging terbaru.`,
      processedCount
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Gagal melakukan sinkronisasi.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
