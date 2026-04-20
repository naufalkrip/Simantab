import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://oqgncefjzcayspyujvat.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xZ25jZWZqemNheXNweXVqdmF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NTM1ODQsImV4cCI6MjA5MjEyOTU4NH0.8zX9OMfLqf0bozv6cTr-k8FNo8WMGb1ouNgT5jo4fp0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.storage.createBucket('proofs', {
    public: true,
    fileSizeLimit: 2097152 // 2MB
  });
  console.log('Create Bucket:', error ? error.message : 'SUCCESS', data);

  const { error: bucketErr } = await supabase.storage.getBucket('proofs');
  console.log('Bucket check:', bucketErr ? bucketErr.message : 'SUCCESS');
}

run();
