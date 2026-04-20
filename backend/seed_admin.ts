import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: fs.existsSync('.env') ? '.env' : '.env.local' });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!);

async function seed() {
  console.log("Seeding admin info into users table...");
  const { data, error } = await supabase.from('users').upsert([
    {
      id: 1, // atau menyesuaikan dengan auto-increment, jika fail hapus id
      username: 'admin',
      password: 'admin123',
      role: 'admin'
    }
  ], { onConflict: 'username' });

  if (error) {
    if (error.code === '42P01') {
      console.log("Table 'users' may not exist yet, or other error:", error);
    } else {
      console.error("Error seeding user:", error);
      // Coba tanpa ID jika error karena id conflict atau bad typed
      const { data: d2, error: e2 } = await supabase.from('users').insert([
        { username: 'admin', password: 'admin123', role: 'admin' }
      ]);
      if (e2) console.error("Fallback insert error:", e2);
      else console.log("Seeded successfully via fallback");
    }
  } else {
    console.log("Seeded admin user successfully:", data || 'Done');
  }
}

seed();
