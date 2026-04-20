-- JALANKAN SCRIPT INI DI SQL EDITOR SUPABASE ANDA
-- Untuk mengaktifkan pembaruan data secara real-time pada aplikasi

-- 1. Tambahkan tabel ke publikasi realtime
ALTER PUBLICATION supabase_realtime ADD TABLE members;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE withdraw_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE deposit_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE admin_accounts;

-- 2. Pastikan Row Level Security (RLS) diatur dengan benar atau dinonaktifkan (jika diperlukan)
-- Tip: Jika Anda menggunakan kebijakan RLS, pastikan field 'id' disertakan dalam izin SELECT untuk pengguna anon/public.
