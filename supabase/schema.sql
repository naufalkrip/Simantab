-- Buat tabel untuk anggota (members)
CREATE TABLE IF NOT EXISTS public.members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    "joinDate" TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Buka row level security (Opsional, tapi praktik baik)
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for all users" ON public.members FOR ALL USING (true) WITH CHECK (true);

-- Buat tabel untuk tabungan (savings)
CREATE TABLE IF NOT EXISTS public.savings (
    id TEXT PRIMARY KEY,
    "memberId" TEXT NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    date TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Buka row level security
ALTER TABLE public.savings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for all users" ON public.savings FOR ALL USING (true) WITH CHECK (true);

-- Buat tabel untuk pengguna admin aplikasi (users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Buka row level security tabel pengguna
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for all users" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- Berikan kredensial awal administrator. Username dan kata sandi dapat diubah di supabase kapan pun
INSERT INTO public.users (username, password, role)
SELECT 'admin', 'admin123', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE username = 'admin');

-- --- UPDATE LANJUTAN ---

-- Tambahkan opsi informasi bank di members (jika belum ada)
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS account_name TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS category TEXT;

-- Tambahkan kolom bukti transfer di savings (jika belum ada)
ALTER TABLE public.savings
ADD COLUMN IF NOT EXISTS proof_url TEXT;

-- Buat tabel request penarikan
CREATE TABLE IF NOT EXISTS public.withdraw_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id TEXT NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    proof_image TEXT,
    status TEXT DEFAULT 'diajukan',
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.withdraw_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for all users" ON public.withdraw_requests FOR ALL USING (true) WITH CHECK (true);

-- Buat tabel request deposit
CREATE TABLE IF NOT EXISTS public.deposit_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id TEXT NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    proof_image TEXT,
    status TEXT DEFAULT 'dikirim',
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for all users" ON public.deposit_requests FOR ALL USING (true) WITH CHECK (true);

-- Buat tabel rekening admin
CREATE TABLE IF NOT EXISTS public.admin_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_name TEXT,
    account_number TEXT,
    account_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for all users" ON public.admin_accounts FOR ALL USING (true) WITH CHECK (true);

-- Opsional: Buat storage bucket untuk proofs jika tidak ada
INSERT INTO storage.buckets (id, name, public) 
VALUES ('proofs', 'proofs', true)
ON CONFLICT (id) DO NOTHING;

-- PERBAIKAN: Jika tabel withdraw_requests sudah telanjur dibuat tanpa proof_image
ALTER TABLE public.withdraw_requests 
ADD COLUMN IF NOT EXISTS proof_image TEXT;

