import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  console.log("Fetching withdraw requests...");
  const { data: requests, error: reqErr } = await supabase
    .from("withdraw_requests")
    .select("id, member_id, amount, status, proof_image")
    .eq("status", "disetujui")
    .not("proof_image", "is", null);

  if (reqErr) throw reqErr;
  console.log(`Found ${requests?.length} approved withdraw requests with proof images.`);

  for (const req of requests || []) {
    // Find the corresponding savings record
    // We assume same member, amount matches mathematically (absolute), type withdrawal
    const { data: savings, error: savErr } = await supabase
      .from("savings")
      .select("id, amount, proof_url")
      .eq("memberId", req.member_id)
      .eq("type", "withdrawal")
      .eq("amount", Math.abs(req.amount));

    if (savErr) throw savErr;

    if (savings && savings.length > 0) {
      // get the one missing proof_url if any
      const target = savings.find(s => !s.proof_url);
      if (target) {
        console.log(`Updating savings ID: ${target.id} with proof url from withdraw request...`);
        await supabase.from("savings").update({ proof_url: req.proof_image }).eq("id", target.id);
      }
    }
  }
  console.log("Done.");
}

fix().catch(console.error);
