import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPendingData() {
  const { data, error } = await supabase
    .from('finance')
    .select('*')
    .limit(5);

  if (error) {
    console.error('Fetch Error:', error);
    return;
  }
  
  const pendingData = data.filter(r => !r.nama_validator || r.nama_validator.trim() === '');
  console.log('Found manual pending:', pendingData.length);
  
  if (pendingData.length > 0) {
     const row = pendingData[0];
     // Try to simulate update
     const newValidation = { ...row.validation, kode_unik: 68, campaign: 'Test Update' };
     console.log('Trying to update id', row.id, 'with new validation', newValidation);
     
     const { data: updateRes, error: updateErr } = await supabase
       .from('finance')
       .update({ validation: newValidation })
       .eq('id', row.id)
       .select();
       
     console.log('Update Data Output:', updateRes);
     console.log('Update Error Output:', updateErr);
  }
}

checkPendingData();
