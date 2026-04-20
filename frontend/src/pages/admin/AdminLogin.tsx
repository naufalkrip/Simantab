import { useState, useEffect } from "react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import logoMBChondro from "figma:asset/45e4fce7a557fc1a50086cab7ccdf81229ecee5c.png";
import { authService } from "../../services/authService";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [captchaText, setCaptchaText] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");

  const generateCaptcha = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  useEffect(() => {
    setCaptchaText(generateCaptcha());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (captchaInput !== captchaText) {
      alert("Captcha salah");
      setCaptchaText(generateCaptcha());
      setCaptchaInput("");
      return;
    }

    setIsLoading(true);

    try {
      await authService.loginAdmin(username, password);
      // Login success
      navigate("/admin");
    } catch (error: any) {
      alert(error.message || "Gagal menghubungi server basis data. Pastikan jaringan terhubung.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-white flex flex-col items-center justify-center px-4 text-center">
      {/* Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}></div>

      {/* Branding */}
      <div className="mb-8 relative z-10">
        <img src={logoMBChondro} alt="Logo" className="w-16 h-16 object-contain mx-auto" />
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-800 to-red-900 bg-clip-text text-transparent tracking-wide mt-3" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>SIMANTAB</h1>
        <p className="text-gray-600 text-sm">Sistem Manajemen Tabungan</p>
        <p className="text-gray-400 text-xs mt-1">Anggota MB Chondro</p>
      </div>

      {/* Admin Login Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-6 w-full max-w-md relative z-10 text-left">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              id="username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-lg bg-white/70 border border-gray-200 px-4 py-2 text-gray-800 placeholder-gray-400 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
            />
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg bg-white/70 border border-gray-200 px-4 py-2 text-gray-800 placeholder-gray-400 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <Input
                id="captcha"
                type="text"
                placeholder="Kode captcha"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                required
                maxLength={5}
                className="flex-1 rounded-lg bg-white/70 border border-gray-200 px-4 py-2 text-gray-800 placeholder-gray-400 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none uppercase h-10 min-w-0"
              />
              <div className="flex border border-gray-200 rounded-lg overflow-hidden shrink-0 h-10">
                <div className="px-3 flex items-center justify-center font-semibold tracking-widest text-gray-700 bg-gray-100 min-w-[80px] select-none">
                  {captchaText}
                </div>
                <button 
                  type="button" 
                  onClick={() => { setCaptchaText(generateCaptcha()); setCaptchaInput(""); }}
                  className="px-3 bg-gray-50 hover:bg-gray-200 border-l border-gray-200 transition-colors text-gray-600 focus:outline-none flex items-center justify-center"
                  title="Refresh Captcha"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-gray-400 text-xs text-center mt-2">Login Admin</p>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 text-white font-semibold rounded-lg py-2 shadow-md transition-all active:scale-[0.98]">
            {isLoading ? "Memproses..." : "Masuk"}
          </Button>
          
          <div className="mt-4 text-center">
            <Link to="/member" className="text-sm text-gray-400 hover:text-red-500 underline text-center inline-block">
              Kembali ke Login Anggota
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
