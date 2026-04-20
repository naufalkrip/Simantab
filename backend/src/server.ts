import dotenv from "dotenv";
import fs from "fs";

// pilih env file (opsional, tapi rapi)
const envFile =
  process.env.NODE_ENV === "production" && fs.existsSync(".env.production")
    ? ".env.production"
    : fs.existsSync(".env.local")
    ? ".env.local"
    : ".env";

// load SEKALI saja
dotenv.config({ path: envFile });

console.log("ENV FILE:", envFile);

import express from "express";
import cors from "cors";

import apiRoutes from "./routes/api";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Tabungan Backend is running' });
});

// Start server function with robust fallback
const MAX_RETRIES = 5;
const startServer = (port: number, retryCount = 0) => {
  const server = app.listen(port, () => {
    console.log(`\n🚀 Backend AKTIF di: http://localhost:${port}`);
    console.log(`DB Terhubung ke: ${process.env.SUPABASE_URL}\n`);
    
    if (port !== 5000) {
      console.warn(`📢 CATATAN: Backend berjalan di port ${port}.`);
      console.warn(`   Pastikan Frontend menyesuaikan API_URL ke port ini.\n`);
    }
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      if (retryCount < MAX_RETRIES) {
        console.warn(`⚠️ PORT ${port} sibuk. Mencoba port ${port + 1}...`);
        startServer(port + 1, retryCount + 1);
      } else {
        console.error(`\n❌ FATAL: Mencoba ${MAX_RETRIES} port tapi semuanya sibuk.`);
        console.error(`   Silakan matikan proses yang menggunakan port 5000-5005.`);
        process.exit(1);
      }
    } else {
      console.error(`❌ Terjadi kesalahan server:`, err);
    }
  });
};

startServer(Number(PORT));
