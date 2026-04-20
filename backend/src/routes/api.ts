import { Router } from "express";
import { supabase } from "../lib/supabase";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });


// ---- MEMBERS ----

// Get all members
router.get("/members", async (req, res) => {
  try {
    const { data, error } = await supabase.from("members").select("*").order("name");
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a member
router.post("/members", async (req, res) => {
  try {
    // Generate a unique ID if not using UUID auto-generation
    const { id, name, phone, joinDate, account_name, bank_name, account_number, category } = req.body;
    let memberId = id || Date.now().toString();
    
    const { data, error } = await supabase
      .from("members")
      .insert([{ id: memberId, name, phone, joinDate, account_name, bank_name, account_number, category }])
      .select()
      .single();
      
    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a member
router.put("/members/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, joinDate, account_name, bank_name, account_number, category } = req.body;
    
    const { data, error } = await supabase
      .from("members")
      .update({ name, phone, joinDate, account_name, bank_name, account_number, category })
      .eq("id", id)
      .select()
      .single();
      
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a member
router.delete("/members/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Explicitly delete related records before deleting member to ensure they are removed
    await supabase.from("savings").delete().eq("memberId", id);
    await supabase.from("deposit_requests").delete().eq("member_id", id);
    await supabase.from("withdraw_requests").delete().eq("member_id", id);

    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) throw error;
    
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ---- SAVINGS ----

// Get all savings
router.get("/savings", async (req, res) => {
  try {
    const { data, error } = await supabase.from("savings").select("*").order("date", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a savings transaction
router.post("/savings", async (req, res) => {
  try {
    const { id, memberId, amount, date, description, type, proof_url } = req.body;
    let transactionId = id || Date.now().toString();
    
    const { data, error } = await supabase
      .from("savings")
      .insert([{ id: transactionId, memberId, amount: Number(amount), date, description, type, proof_url }])
      .select()
      .single();
      
    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a savings transaction
router.put("/savings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { memberId, amount, date, description, type } = req.body;
    
    const { data, error } = await supabase
      .from("savings")
      .update({ memberId, amount: Number(amount), date, description, type })
      .eq("id", id)
      .select()
      .single();
      
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a savings transaction
router.delete("/savings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("savings").delete().eq("id", id);
    if (error) throw error;
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---- WITHDRAW REQUESTS ----

// Duplicated routes removed. Unified with /withdraw prefix below.

// ---- ADMIN ACCOUNTS ----

router.get("/admin-accounts", async (req, res) => {
  try {
    const { data, error } = await supabase.from("admin_accounts").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/admin-accounts", async (req, res) => {
  try {
    const { bank_name, account_number, account_name } = req.body;
    const { data, error } = await supabase
      .from("admin_accounts")
      .insert([{ bank_name, account_number, account_name }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/admin-accounts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("admin_accounts").delete().eq("id", id);
    if (error) throw error;
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---- AUTHENTICATION ----


// Admin Login Route
router.post("/auth/login", async (req, res) => {
  try {
    const { username, password, captcha, expectedCaptcha } = req.body;
    
    // Validasi Captcha
    if (!captcha || !expectedCaptcha || captcha !== expectedCaptcha) {
      return res.status(400).json({ error: "Captcha tidak valid" });
    }

    // Query data user dari supabase: mencari yang username & password-nya cocok
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .single();
      
    if (error || !user) {
      return res.status(401).json({ error: "Username atau password salah" });
    }
    
    // Jika valid, kembalikan response objek user sukses.
    return res.status(200).json({ 
      message: "Login berhasil", 
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message || "Terjadi kesalahan internal server" });
  }
});
// ---- WITHDRAW REQUESTS ----

// Submit new withdraw request
router.post("/withdraw", async (req, res) => {
  try {
    console.log("BODY REQUEST:", req.body);
    const { member_id, amount } = req.body;
    if (!member_id || !amount) {
      return res.status(400).json({ error: "member_id dan amount wajib diisi" });
    }
    const { data, error } = await supabase
      .from("withdraw_requests")
      .insert([
        {
          member_id,
          amount,
          status: "diajukan",
          note: "Sedang diajukan ke admin",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all requests for admin
router.get("/withdraw", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("withdraw_requests")
      .select(`
        *,
        members (name, account_name, bank_name, account_number)
      `)
      .order("created_at", { ascending: false });
      
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get member requests
router.get("/withdraw/member/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("withdraw_requests")
      .select("*")
      .eq("member_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update status (Admin)
router.put("/withdraw/:id", upload.single("proof_image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    
    // First, fetch the request
    const { data: request, error: fetchErr } = await supabase
      .from("withdraw_requests")
      .select("*")
      .eq("id", id)
      .single();
      
    if (fetchErr) throw fetchErr;
    if (!request) return res.status(404).json({ error: "Request tidak ditemukan" });

    // Handle optional proof_image FIRST
    let proof_image = request.proof_image || null;
    if (req.file) {
      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `withdraw_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("proofs")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          cacheControl: "3600",
          upsert: false
        });
        
      if (uploadError) throw uploadError;
      
      const { data: publicUrlData } = supabase.storage
        .from("proofs")
        .getPublicUrl(fileName);
        
      proof_image = publicUrlData.publicUrl;
    }

    if (status === "disetujui" && request.status !== "disetujui") {
      // Validate balance
      const { data: savings, error: savingsErr } = await supabase
        .from("savings")
        .select("amount, type")
        .eq("memberId", request.member_id);
      
      if (savingsErr) throw savingsErr;
      
      let balance = 0;
      savings?.forEach(s => {
         if (s.type === 'deposit') balance += Number(s.amount);
         if (s.type === 'withdrawal') balance -= Number(s.amount);
      });
      
      if (balance < request.amount) {
        // Automatically reject
        const { data: rejData, error: rejErr } = await supabase
          .from("withdraw_requests")
          .update({
            status: "ditolak",
            note: "Saldo tidak mencukupi",
            updated_at: new Date().toISOString()
          })
          .eq("id", id)
          .select()
          .single();
          
        if (rejErr) throw rejErr;
        return res.json(rejData); // return rejected
      }
      
      // Balance is sufficient, record withdrawal
      const { error: deductErr } = await supabase
        .from("savings")
        .insert([{
          id: Date.now().toString(),
          memberId: request.member_id,
          amount: Math.abs(Number(request.amount)), // Using absolute positive value properly
          date: new Date().toISOString().split('T')[0],
          description: "Penarikan dana",
          type: "withdrawal",
          proof_url: proof_image
        }]);
        
      if (deductErr) throw deductErr;
    }

    // Update request status normally
    const { data, error } = await supabase
      .from("withdraw_requests")
      .update({ status, note, proof_image, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
      
    if (error) throw error;
    res.json(data);
    
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel/Delete withdraw request (only if still 'diajukan')
router.delete("/withdraw/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("MENCOBA MENGHAPUS REQUEST:", id);
    
    const { data, error } = await supabase
      .from("withdraw_requests")
      .delete()
      .eq("id", id)
      .select();

    if (error) {
      console.error("Gagal hapus di Supabase:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log("HAPUS GAGAL: Request tidak ditemukan untuk ID:", id);
      return res.status(404).json({ error: "Permintaan penarikan tidak ditemukan atau sudah diproses" });
    }

    console.log("BERHASIL HAPUS:", data);
    res.json({ success: true, message: "Penarikan berhasil dibatalkan", data: data[0] });
  } catch (error: any) {
    console.error("Internal Error DELETE:", error);
    res.status(500).json({ error: error.message });
  }
});

// ---- DEPOSIT REQUESTS ----

// Submit new deposit request
router.post("/deposit", upload.single("proof_image"), async (req, res) => {
  try {
    const { member_id, amount } = req.body;
    
    if (!member_id || !amount) {
      return res.status(400).json({ error: "member_id dan amount wajib diisi" });
    }
    
    let proof_image = null;
    
    if (req.file) {
      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("proofs")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          cacheControl: "3600",
          upsert: false
        });
        
      if (uploadError) throw uploadError;
      
      const { data: publicUrlData } = supabase.storage
        .from("proofs")
        .getPublicUrl(fileName);
        
      proof_image = publicUrlData.publicUrl;
    } else {
      return res.status(400).json({ error: "Bukti transfer wajib diunggah" });
    }

    const { data, error } = await supabase
      .from("deposit_requests")
      .insert([{
        member_id,
        amount: Number(amount),
        proof_image,
        status: "dikirim",
        note: "Bukti transfer telah dikirim",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    console.error("Deposit Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get all deposit requests (Admin)
router.get("/deposit", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("deposit_requests")
      .select(`
        *,
        members (name, account_name, bank_name, account_number)
      `)
      .order("created_at", { ascending: false });
      
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get member deposit requests
router.get("/deposit/member/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("deposit_requests")
      .select("*")
      .eq("member_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update deposit status (Admin)
router.put("/deposit/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    // Fetch the request
    const { data: request, error: fetchErr } = await supabase
      .from("deposit_requests")
      .select("*")
      .eq("id", id)
      .single();
      
    if (fetchErr) throw fetchErr;
    if (!request) return res.status(404).json({ error: "Request tidak ditemukan" });

    // Handle auto-insert to savings when status becomes 'selesai'
    if (status === "selesai" && request.status !== "selesai") {
      const { error: insertErr } = await supabase
        .from("savings")
        .insert([{
          id: Date.now().toString(),
          memberId: request.member_id,
          amount: Number(request.amount),
          date: new Date().toISOString().split('T')[0],
          description: "Setoran via transfer",
          type: "deposit",
          proof_url: request.proof_image
        }]);
        
      if (insertErr) throw insertErr;
    }

    // Update the request status
    const { data, error } = await supabase
      .from("deposit_requests")
      .update({ status, note, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
      
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


export default router;
