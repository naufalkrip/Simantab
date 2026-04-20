import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL=(.*)/)?.[1] || '';
const SUPABASE_ANON_KEY = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1] || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const { data: member } = await supabase.from('members').select('*').limit(1).single();
  if (!member) return console.log('No member found');
  
  console.log('Inserting with ID omitted (simulating my change)...');
  const payload1 = {
    member_id: member.id,
    amount: 1000,
    type: 'deposit',
    date: new Date().toISOString().split('T')[0],
    description: 'Test omit ID'
  };
  const { error: err1 } = await supabase.from('transactions').insert(payload1);
  console.log('Result 1:', err1 ? err1.message : 'SUCCESS');

  console.log('Inserting with empty ID (simulating original)...');
  const payload2 = {
    ...payload1,
    id: ''
  };
  const { error: err2 } = await supabase.from('transactions').insert(payload2);
  console.log('Result 2:', err2 ? err2.message : 'SUCCESS');

  console.log('Inserting with string ID (simulating DailySavingsInput)...');
  const payload3 = {
    ...payload1,
    id: Date.now().toString() + member.id.substring(0,5)
  };
  const { error: err3 } = await supabase.from('transactions').insert(payload3);
  console.log('Result 3:', err3 ? err3.message : 'SUCCESS');

  const { error: bucketErr } = await supabase.storage.getBucket('proofs');
  console.log('Bucket check:', bucketErr ? bucketErr.message : 'SUCCESS');
}

run();
