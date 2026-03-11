import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPendingData() {
  const { data, error } = await supabase
    .from('finance')
    .select('*')
    .or('nama_validator.is.null,nama_validator.eq.,nama_validator.eq. ')
    .limit(10);
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Pending data sample:');
  console.log(JSON.stringify(data, null, 2));
}

checkPendingData();
