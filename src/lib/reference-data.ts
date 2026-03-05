export const NamaValidatorOptions = [
  'Dindin Komarudin',
  'Yuli Aulia Sugiarti'
];

export const TipeDonaturOptions = ['Individu', 'Corporate'];

export const KategoriOptions = ['Uang', 'Barang'];

export const MetodeOptions = ['Transfer', 'Tunai'];

export const JenisDonasiOptions = [
  'Wakaf',
  'Infak Alumni',
  'Infak Umum',
  'Zakat Umum',
  'Zakat Alumni',
  'Infak Tematik'
];

export const OrganOptions = [
  'HOLDING',
  'eTAHFIDZ',
  'IMZ',
  'KBUU',
  'TEACH',
  'STIM BB',
  'SSC',
  'SMART',
  'PIASYU',
  'ALSYUKRO',
  'IK'
];

export interface Campaign {
  nama_campaign: string;
  kode_unik: string | null;
  pelaksana_program: string;
}

export const CampaignList: Campaign[] = [
  { nama_campaign: 'Sedekah Penghafal Al Quran', kode_unik: null, pelaksana_program: 'HOLDING' },
  { nama_campaign: 'Kelas Literasi Kreatif Ramadan', kode_unik: '53', pelaksana_program: 'TEACH' },
  { nama_campaign: 'Pulang Kampung SMART', kode_unik: '02', pelaksana_program: 'SMART' },
  { nama_campaign: 'Pelukan Ramadan untuk Guru Daerah', kode_unik: '10', pelaksana_program: 'TEACH' },
  { nama_campaign: 'Berbagi Yatim dan Dhuafa', kode_unik: '06', pelaksana_program: 'HOLDING' },
  { nama_campaign: 'Sedekah Quran', kode_unik: '25', pelaksana_program: 'HOLDING' },
  { nama_campaign: 'Sedekah Subuh dan Sedekah 1 Miliar', kode_unik: '24', pelaksana_program: 'HOLDING' },
  { nama_campaign: 'Sedekah Jumat', kode_unik: '48', pelaksana_program: 'HOLDING' },
  { nama_campaign: 'Teman Tumbuh Beasiswa Etos dan BAKTINUSA', kode_unik: '73', pelaksana_program: 'TEACH' },
  { nama_campaign: 'Ramadan Ini Jangan Biarkan Harapan Mereka Ikut Tenggelam', kode_unik: null, pelaksana_program: 'TEACH' },
  { nama_campaign: 'Cuci AC & Bebersih 100 Masjid', kode_unik: null, pelaksana_program: 'IK' },
  { nama_campaign: 'Sedekah Buka Puasa Daerah Bencana', kode_unik: '44', pelaksana_program: 'HOLDING' },
  { nama_campaign: 'Infak Alumni TEACH', kode_unik: '56', pelaksana_program: 'TEACH' },
  { nama_campaign: 'Berbagi THR Untuk Pelestari Budaya Silat', kode_unik: null, pelaksana_program: 'TEACH' },
  { nama_campaign: 'Zakat Alumni Beasiswa Etos dan BAKTINUSA', kode_unik: '55', pelaksana_program: 'TEACH' },
  { nama_campaign: 'Sedekah Ramadan', kode_unik: null, pelaksana_program: 'HOLDING' },
  { nama_campaign: 'Zakat Ramadan', kode_unik: null, pelaksana_program: 'HOLDING' },
  { nama_campaign: 'Sedekah Project BA Jakarta', kode_unik: '64', pelaksana_program: 'TEACH' },
  { nama_campaign: 'Sedekah Project BA Surabaya', kode_unik: '65', pelaksana_program: 'TEACH' },
  { nama_campaign: 'Sedekah Project BA Palembang', kode_unik: '66', pelaksana_program: 'TEACH' },
  { nama_campaign: 'Sedekah Project BA Padang', kode_unik: '67', pelaksana_program: 'TEACH' }
];

// Combine to general dropdown structure for API compatibility if needed
export const DropdownOptions = {
  'Nama Validator': NamaValidatorOptions,
  'Tipe Donatur': TipeDonaturOptions,
  'Jenis Donasi': JenisDonasiOptions,
  'Kategori': KategoriOptions,
  'Metode': MetodeOptions,
  'Organ': OrganOptions,
  'Campaign': CampaignList.map(c => c.nama_campaign),
  'Pelaksana Program': Array.from(new Set(CampaignList.map(c => c.pelaksana_program))),
};

/**
 * Determine 'Jenis Donasi' based on the campaign name rule.
 */
export function getJenisDonasi(campaignName: string): string {
  if (!campaignName) return '';

  const name = campaignName.trim();
  
  if (name === 'Teman Tumbuh Beasiswa Etos dan BAKTINUSA' || name === 'Infak Alumni TEACH') {
    return 'Infak Alumni';
  }
  
  if (name === 'Zakat Alumni Beasiswa Etos dan BAKTINUSA') {
    return 'Zakat Alumni';
  }
  
  if (name === 'Zakat Ramadan') {
    return 'Zakat Umum';
  }
  
  const infakTematikCampaigns = [
    'Sedekah Quran',
    'Sedekah Penghafal Al Quran',
    'Kelas Literasi Kreatif Ramadan',
    'Pulang Kampung SMART',
    'Berbagi Yatim dan Dhuafa',
    'Ramadan Ini Jangan Biarkan Harapan Mereka Ikut Tenggelam',
    'Cuci AC & Bebersih 100 Masjid',
    'Sedekah Buka Puasa Daerah Bencana',
    'Berbagi THR Untuk Pelestari Budaya Silat',
    'Sedekah Project BA Jakarta',
    'Sedekah Project BA Surabaya',
    'Sedekah Project BA Palembang',
    'Sedekah Project BA Padang'
  ];
  
  if (infakTematikCampaigns.includes(name)) {
    return 'Infak Tematik';
  }
  
  const infakUmumCampaigns = [
    'Sedekah Subuh dan Sedekah 1 Miliar',
    'Sedekah Jumat',
    'Sedekah Ramadan'
  ];

  if (infakUmumCampaigns.includes(name)) {
    return 'Infak Umum';
  }

  return ''; // Default or empty if not matched
}

/**
 * Determine Kategori (Uang/Barang). Default is 'Uang'. Check description for 'Barang'.
 */
export function getKategori(description: string): string {
  if (!description) return 'Uang';
  if (description.toLowerCase().includes('barang')) {
    return 'Barang';
  }
  return 'Uang';
}

/**
 * Determine Metode (Transfer/Tunai). Default is 'Transfer'. Check description for 'Tunai'.
 */
export function getMetode(description: string): string {
  if (!description) return 'Transfer';
  if (description.toLowerCase().includes('tunai')) {
    return 'Tunai';
  }
  return 'Transfer';
}

/**
 * Helper to match amount to Campaign based on Kode Unik.
 */
export function matchCampaignByAmount(amountStr: string): Campaign | null {
  if (!amountStr) return null;
  // clean amount string and get last 2 digits
  const cleanAmount = amountStr.replace(/,/g, '');
  const numericAmount = Math.round(parseFloat(cleanAmount));
  
  if (isNaN(numericAmount)) return null;

  const last2Digits = (numericAmount % 100).toString().padStart(2, '0');
  
  // Find matching campaign
  const matched = CampaignList.find(c => c.kode_unik === last2Digits);
  return matched || null;
}

/**
 * Resolve fallback campaign if no unique code matched.
 * Rules:
 * 1. Time 03:00 - 06:00 -> Sedekah Subuh dan Sedekah 1 Miliar
 * 2. Day Friday, Time > 06:00 -> Sedekah Jumat
 * 3. Description contains "Zakat" -> Zakat Ramadan
 * 4. Default -> Sedekah Ramadan
 */
export function resolveFallbackCampaign(dateStr: string, description: string): Campaign {
  const getDefault = (name: string) => CampaignList.find(c => c.nama_campaign === name)!;
  
  try {
    const date = new Date(dateStr);
    
    if (!isNaN(date.getTime())) {
      const hours = date.getHours();
      const day = date.getDay(); // 0 = Sunday, 5 = Friday

      // Rule 1: Subuh (03:00 - 05:59)
      if (hours >= 3 && hours < 6) {
        return getDefault('Sedekah Subuh dan Sedekah 1 Miliar');
      }

      // Rule 2: Jumat (> 06:00)
      if (day === 5 && hours >= 6) {
        return getDefault('Sedekah Jumat');
      }
    }
  } catch {
    // Ignore date parsing errors and fallback to description/default
  }

  // Rule 3: Zakat Keyword
  if (description && description.toLowerCase().includes('zakat')) {
    return getDefault('Zakat Ramadan');
  }

  // Rule 4: Default Fallback
  return getDefault('Sedekah Ramadan');
}
