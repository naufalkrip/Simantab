import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, Wallet, Calendar, TrendingUp, User, Download, RefreshCw, Send, Settings, Banknote, X, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { Toaster } from "../../components/ui/sonner";
import { toast } from "sonner";
import logoMBChondro from "figma:asset/45e4fce7a557fc1a50086cab7ccdf81229ecee5c.png";
import { memberService } from "../../services/memberService";
import { Member, Transaction, WithdrawRequest, AdminAccount } from "../../types";
import { supabase } from "../../services/supabaseClient";

export default function MemberDashboard() {
  const navigate = useNavigate();
  const [transactions, setSavings] = useState<Transaction[]>([]);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [downloadDateRange, setDownloadDateRange] = useState({
    startDate: "",
    endDate: ""
  });
  
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Partial<Member>>({});
  
  const [loggedInMember, setLoggedInMember] = useState<Member | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [depositRequests, setDepositRequests] = useState<any[]>([]);
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false);
  const [cancelWithdrawConfirm, setCancelWithdrawConfirm] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositProofInput, setDepositProofInput] = useState<File | null>(null);
  const [depositProofPreview, setDepositProofPreview] = useState<string | null>(null);
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);

  const fetchAllData = useCallback(async () => {
    const memberData = localStorage.getItem("memberData");
    const memberLoggedIn = localStorage.getItem("memberLoggedIn");
    
    if (!memberLoggedIn || !memberData) {
      navigate("/member/login");
      return;
    }
    
    const member = JSON.parse(memberData);
    setLoggedInMember(member);
    
    try {
      const [savingsRes, withdrawRes, depositRes, accountsRes] = await Promise.all([
        memberService.getMemberTransactions(member.id),
        memberService.getWithdrawRequests(member.id),
        memberService.getDepositRequests(member.id),
        memberService.getAdminAccounts()
      ]);

      setSavings(savingsRes);
      setWithdrawRequests(withdrawRes);
      setDepositRequests(depositRes);
      setAdminAccounts(accountsRes);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  }, [navigate]);

  // Load data from Backend API
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('member-dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdraw_requests' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposit_requests' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_accounts' }, () => fetchAllData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAllData]);

  const handleLogout = () => {
    localStorage.removeItem("memberLoggedIn");
    localStorage.removeItem("memberData");
    navigate("/member/login");
  };

  const handleWithdrawRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInMember) return;
    
    const amountNum = Number(withdrawAmount);
    if (!amountNum || amountNum <= 0) {
      toast.error("Nominal tidak valid");
      return;
    }
    
    const memberSavings = transactions.filter((s) => s.member_id === loggedInMember.id);
    const totalSavings = memberSavings.reduce((sum, s) => {
      return s.type === "withdrawal" ? sum - s.amount : sum + s.amount;
    }, 0);
    
    if (amountNum > totalSavings) {
      toast.error("Saldo tidak mencukupi");
      return;
    }

    setWithdrawConfirmOpen(true);
  };

  const confirmWithdrawRequest = async () => {
    if (!loggedInMember) return;
    const amountNum = Number(withdrawAmount);
    try {
      await memberService.createWithdrawRequest(loggedInMember.id, amountNum);
      toast.success("Permintaan penarikan berhasil dikirim");
      setWithdrawAmount("");
      
      const updatedReqs = await memberService.getWithdrawRequests(loggedInMember.id);
      setWithdrawRequests(updatedReqs);
      setWithdrawConfirmOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const cancelWithdrawRequest = async () => {
    if (!cancelWithdrawConfirm || !loggedInMember) return;
    try {
      await memberService.cancelWithdrawRequest(cancelWithdrawConfirm);
      
      // Update local state for immediate UI feedback
      setWithdrawRequests(prev => prev.filter(req => req.id !== cancelWithdrawConfirm));
      
      toast.success("Penarikan berhasil dibatalkan");
      setCancelWithdrawConfirm(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDepositRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInMember) return;
    
    const amountNum = Number(depositAmount);
    if (!amountNum || amountNum <= 0) {
      toast.error("Nominal transfer tidak valid");
      return;
    }
    if (!depositProofInput) {
      toast.error("Bukti transfer wajib diunggah");
      return;
    }

    try {
      setIsSubmittingDeposit(true);

      await memberService.createDepositRequest(loggedInMember.id, amountNum, depositProofInput);
      
      toast.success("Bukti transfer berhasil dikirim");
      setDepositAmount("");
      setDepositProofInput(null);
      setDepositProofPreview(null);
      
      const updatedReqs = await memberService.getDepositRequests(loggedInMember.id);
      setDepositRequests(updatedReqs);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  const handleDepositFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast.error("Hanya file gambar yang diperbolehkan");
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 2MB");
        return;
    }

    setDepositProofInput(file);
    const reader = new FileReader();
    reader.onloadend = () => {
        setDepositProofPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInMember) return;
    
    // Validation
    const { account_name, bank_name, account_number } = memberToEdit;
    
    if (!account_name || account_name.trim() === '') {
      toast.error('Nama pemilik rekening tidak boleh kosong');
      return;
    }
    if (!bank_name || bank_name.trim() === '') {
      toast.error('Nama bank wajib dipilih');
      return;
    }
    if (!account_number || account_number.trim() === '') {
      toast.error('Nomor rekening/e-wallet tidak boleh kosong');
      return;
    }

    console.log("DATA DIKIRIM:", { account_name, bank_name, account_number });

    try {
      const updatedMember = await memberService.updateProfile(loggedInMember.id, memberToEdit);
      
      setLoggedInMember(updatedMember);
      localStorage.setItem("memberData", JSON.stringify(updatedMember));
      setEditProfileOpen(false);
      toast.success("Profil berhasil diperbarui");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (!loggedInMember) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Memuat data...</p>
      </div>
    );
  }

  const memberSavings = transactions.filter((s) => s.member_id === loggedInMember.id);
  const totalSavings = memberSavings.reduce((sum, s) => {
    if (s.type === "withdrawal") {
      return sum - s.amount;
    }
    return sum + s.amount;
  }, 0);
  const savingsCount = memberSavings.length;

  const handleDownloadPDF = () => {
    try {
      const { startDate, endDate } = downloadDateRange;
      
      let filteredSavings = [...memberSavings];
      
      if (startDate && endDate) {
        filteredSavings = memberSavings.filter(s => s.date >= startDate && s.date <= endDate);
      } else if (startDate) {
        filteredSavings = memberSavings.filter(s => s.date >= startDate);
      } else if (endDate) {
        filteredSavings = memberSavings.filter(s => s.date <= endDate);
      }
      
      if (filteredSavings.length === 0) {
        toast.error("Tidak ada riwayat tabungan pada rentang tanggal tersebut");
        return;
      }

      const totalDeposit = filteredSavings.reduce((sum, s) => s.type === "deposit" ? sum + s.amount : sum, 0);
      const totalWithdrawal = filteredSavings.reduce((sum, s) => s.type === "withdrawal" ? sum + s.amount : sum, 0);
      const grandTotal = totalDeposit - totalWithdrawal;

      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.setTextColor(153, 27, 27); // red-800
      doc.text("Laporan Riwayat Transaksi Anda", 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Nama Anggota: ${loggedInMember.name}`, 14, 28);
      
      if (startDate && endDate) {
        doc.text(`Periode: ${format(new Date(startDate), 'dd MMM yyyy')} - ${format(new Date(endDate), 'dd MMM yyyy')}`, 14, 34);
      } else if (startDate) {
        doc.text(`Periode: Mulai ${format(new Date(startDate), 'dd MMM yyyy')}`, 14, 34);
      } else if (endDate) {
        doc.text(`Periode: Sampai ${format(new Date(endDate), 'dd MMM yyyy')}`, 14, 34);
      } else {
        doc.text(`Periode: Semua Waktu`, 14, 34);
      }

      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Total Uang Masuk: Rp ${totalDeposit.toLocaleString("id-ID")}`, 14, 44);
      doc.text(`Total Uang Keluar: Rp ${totalWithdrawal.toLocaleString("id-ID")}`, 14, 51);
      doc.setFont("helvetica", "bold");
      doc.text(`Total Akhir (Net): Rp ${grandTotal.toLocaleString("id-ID")}`, 14, 58);
      doc.setFont("helvetica", "normal");

      const tableColumn = ["Tanggal", "Jenis", "Keterangan", "Nominal"];
      const tableRows: any[] = [];

      const sortedSavings = [...filteredSavings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      sortedSavings.forEach(transaction => {
        tableRows.push([
          format(new Date(transaction.date), 'dd/MM/yyyy'),
          transaction.type === "deposit" ? "Masuk (Setoran)" : "Keluar (Penarikan)",
          transaction.description,
          `${transaction.type === "deposit" ? "+" : "-"} Rp ${transaction.amount.toLocaleString("id-ID")}`
        ]);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 65,
        theme: 'grid',
        headStyles: { fillColor: [153, 27, 27] }, // red-800
        alternateRowStyles: { fillColor: [255, 255, 255] }, // white
        margin: { top: 65 },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 1) {
            if (data.cell.raw === 'Masuk (Setoran)') {
              data.cell.styles.textColor = [21, 128, 61]; // green-700
              data.cell.styles.fontStyle = 'bold';
            } else if (data.cell.raw === 'Keluar (Penarikan)') {
              data.cell.styles.textColor = [185, 28, 28]; // red-700
              data.cell.styles.fontStyle = 'bold';
            }
          }
          if (data.section === 'body' && data.column.index === 3) {
             const val = data.cell.raw as string;
             if (val.startsWith("+")) {
               data.cell.styles.textColor = [21, 128, 61];
             } else if (val.startsWith("-")) {
               data.cell.styles.textColor = [185, 28, 28];
             }
          }
        }
      });

      doc.save(`Riwayat_Tabungan_${loggedInMember.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
      setIsDownloadOpen(false);
      toast.success("File PDF berhasil diunduh");
    } catch (error: any) {
      console.error("Error generating PDF", error);
      toast.error("Gagal membuat PDF: Terjadi kesalahan internal");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <Dialog open={!!previewImageUrl} onOpenChange={(open) => !open && setPreviewImageUrl(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl p-1 overflow-hidden bg-transparent border-0 shadow-none">
          <div className="relative flex items-center justify-center">
            <Button
              variant="ghost"
              className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70 rounded-full w-8 h-8 p-0 z-50"
              onClick={() => setPreviewImageUrl(null)}
            >
              <X className="w-5 h-5" />
            </Button>
            <img 
              src={previewImageUrl || ""} 
              alt="Bukti Transfer" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl bg-white"
            />
          </div>
        </DialogContent>
      </Dialog>
      <div className="bg-gradient-to-r from-red-800 to-red-900 text-white border-b shadow-md">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Hi {loggedInMember.name}</h1>
              <p className="text-sm sm:text-base font-light text-red-50 mt-1">Gas Terus Nabungnya!</p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="bg-white text-red-800 hover:bg-red-50 border-white text-xs sm:text-sm px-3 sm:px-4">
              Keluar
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <Tabs defaultValue="home" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4 sm:mb-6 font-medium">
            <TabsTrigger value="home" className="text-xs sm:text-sm">Beranda</TabsTrigger>
            <TabsTrigger value="deposit" className="text-xs sm:text-sm">Setoran</TabsTrigger>
            <TabsTrigger value="withdraw" className="text-xs sm:text-sm">Tarik Tunai</TabsTrigger>
            <TabsTrigger value="profile" className="text-xs sm:text-sm">Profil</TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 w-full justify-start mb-4 sm:mb-6">
              <Card className="bg-gradient-to-br from-red-50 to-white flex flex-col justify-between h-full p-4 gap-3 border shadow-sm">
                <div className="flex flex-row items-center justify-between">
                  <h3 className="text-sm font-medium leading-tight text-gray-800">Total Tabungan</h3>
                  <Wallet className="h-4 w-4 text-red-800" />
                </div>
                <div className="flex-1 flex items-center justify-start">
                  <p className="text-2xl font-bold text-red-800 text-left">Rp {totalSavings.toLocaleString("id-ID")}</p>
                </div>
                <p className="text-xs text-gray-500 text-left">Akumulasi tabungan</p>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-white flex flex-col justify-between h-full p-4 gap-3 border shadow-sm">
                <div className="flex flex-row items-center justify-between">
                  <h3 className="text-sm font-medium leading-tight text-gray-800">Jumlah Transaksi</h3>
                  <TrendingUp className="h-4 w-4 text-red-800" />
                </div>
                <div className="flex-1 flex items-center justify-start">
                  <p className="text-2xl font-bold text-red-800 text-left">{savingsCount}</p>
                </div>
                <p className="text-xs text-gray-500 text-left">Total transaksi terdaftar</p>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-white flex flex-col justify-between h-full p-4 gap-3 border shadow-sm">
                <div className="flex flex-row items-center justify-between">
                  <h3 className="text-sm font-medium leading-tight text-gray-800">Bergabung Sejak</h3>
                  <Calendar className="h-4 w-4 text-red-800" />
                </div>
                <div className="flex-1 flex items-center justify-start">
                  <p className="text-2xl font-bold text-red-800 text-left">
                    {new Date(loggedInMember.join_date).toLocaleDateString("id-ID", {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <p className="text-xs text-gray-500 text-left">Tanggal bergabung</p>
              </Card>
            </div>

        <Card className="bg-white mb-4 sm:mb-6">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div>
              <CardTitle className="text-base sm:text-lg">Riwayat Tabungan</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Daftar transaksi tabungan Anda</CardDescription>
            </div>
            <Dialog open={isDownloadOpen} onOpenChange={setIsDownloadOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 text-xs sm:text-sm shadow-sm w-full sm:w-auto">
                  <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Download PDF
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-md mx-3">
                <DialogHeader>
                  <DialogTitle className="text-base sm:text-lg">Download Riwayat Transaksi</DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                    Pilih rentang tanggal transaksi untuk diunduh. Kosongkan untuk mengunduh semua transaksi.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-3">
                  <div className="space-y-2">
                    <Label htmlFor="startTrx" className="text-xs sm:text-sm">Tanggal Mulai</Label>
                    <Input
                      id="startTrx"
                      type="date"
                      value={downloadDateRange.startDate}
                      onChange={(e) => setDownloadDateRange({ ...downloadDateRange, startDate: e.target.value })}
                      className="text-xs sm:text-sm"
                      max={downloadDateRange.endDate || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTrx" className="text-xs sm:text-sm">Tanggal Akhir</Label>
                    <Input
                      id="endTrx"
                      type="date"
                      value={downloadDateRange.endDate}
                      onChange={(e) => setDownloadDateRange({ ...downloadDateRange, endDate: e.target.value })}
                      className="text-xs sm:text-sm"
                      min={downloadDateRange.startDate}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDownloadOpen(false)} className="text-xs sm:text-sm w-full sm:w-auto">
                    Batal
                  </Button>
                  <Button type="button" onClick={handleDownloadPDF} className="bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 text-xs sm:text-sm w-full sm:w-auto">
                    <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Download
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {memberSavings.length === 0 ? (
                <p className="text-center text-gray-500 py-8 text-xs sm:text-sm">Belum ada transaksi tabungan</p>
              ) : (
                memberSavings
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-red-50"
                    >
                      <div>
                        <p className="font-medium text-xs sm:text-sm">{transaction.description}</p>
                        <p className="text-xs text-gray-500 mb-1">
                          {new Date(transaction.created_at || transaction.date).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-sm sm:text-base ${
                          transaction.type === "withdrawal" ? "text-red-600" : "text-green-600"
                        }`}>
                          {transaction.type === "withdrawal" ? "- " : "+ "}
                          Rp {transaction.amount.toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
        </TabsContent>

        <TabsContent value="deposit" className="space-y-4">
          <Card className="bg-white border-blue-100 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-50 bg-blue-50/30">
              <CardTitle className="text-base sm:text-lg text-blue-900">Informasi Rekening Admin</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Gunakan rekening di bawah ini untuk transfer setoran</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {adminAccounts.map(acc => (
                  <div key={acc.id} className="p-3 sm:p-4 border border-blue-100 rounded-lg bg-white shadow-sm flex flex-col justify-between">
                    <div>
                      <p className="font-bold text-sm text-blue-800 uppercase tracking-wide">{acc.bank_name}</p>
                      <p className="text-lg font-mono text-gray-900 mt-1 mb-1">{acc.account_number}</p>
                      <p className="text-xs text-gray-500">a.n {acc.account_name}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3 w-full border-blue-200 text-blue-700 hover:bg-blue-50 h-8 text-xs"
                      onClick={() => {
                        navigator.clipboard.writeText(acc.account_number);
                        toast.success("Nomor rekening berhasil disalin");
                      }}
                    >
                      Salin Nomor
                    </Button>
                  </div>
                ))}
                {adminAccounts.length === 0 && (
                  <p className="text-xs text-gray-500 italic col-span-2">Belum ada rekening admin yang didaftarkan.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Kirim Bukti Transfer</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Lampirkan bukti jika Anda sudah melakukan transfer ke admin</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDepositRequest} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="depositAmount" className="text-xs sm:text-sm">Nominal Setoran (Rp)</Label>
                  <Input 
                    id="depositAmount"
                    type="number" 
                    placeholder="Contoh: 50000" 
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    required
                    min={1000}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="depositProof" className="text-xs sm:text-sm">Upload Bukti Transfer</Label>
                  <Input 
                    id="depositProof"
                    type="file" 
                    accept="image/*"
                    onChange={handleDepositFileChange}
                    required
                    className="file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                  />
                  {depositProofPreview && (
                    <div className="mt-2 border rounded-lg p-2 max-w-xs bg-gray-50">
                      <p className="text-xs text-gray-500 mb-2">Preview Gambar:</p>
                      <img src={depositProofPreview} alt="Preview Bukti" className="w-full h-auto max-h-48 object-contain rounded" />
                    </div>
                  )}
                </div>
                <Button type="submit" disabled={isSubmittingDeposit} className="w-full font-semibold bg-gradient-to-r from-red-800 to-red-900 text-white rounded-lg shadow-md transition-all active:scale-95">
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmittingDeposit ? "Mengirim..." : "Kirim Bukti Transfer"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Status Setoran</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Riwayat pengajuan setoran dana Anda via transfer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {depositRequests.length === 0 ? (
                  <p className="text-xs text-center p-3 text-gray-500">Belum ada riwayat setoran transfer.</p>
                ) : (
                  depositRequests.map(req => (
                    <div key={req.id} className="p-3 border rounded-lg flex flex-col gap-2 bg-gray-50 relative overflow-hidden group">
                      <div className="flex justify-between items-start z-10">
                        <p className="font-bold text-blue-900">Rp {Number(req.amount).toLocaleString('id-ID')}</p>
                        <span className={`text-[10px] sm:text-xs px-2 py-1 rounded-full font-bold shadow-sm ${
                          req.status === 'dikirim' ? 'bg-yellow-100 text-yellow-800' :
                          req.status === 'diproses' ? 'bg-blue-100 text-blue-800' :
                          req.status === 'selesai' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {req.status === 'dikirim' ? 'DIKIRIM' :
                           req.status === 'diproses' ? 'DIPROSES' :
                           req.status === 'selesai' ? 'SELESAI' : 'DITOLAK'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 z-10 border-l-2 pl-2 border-gray-300">{req.note}</p>
                      {req.proof_image && (
                        <button type="button" onClick={() => setPreviewImageUrl(req.proof_image)} className="text-xs text-blue-600 hover:underline inline-flex items-center w-fit border border-blue-200 bg-blue-50 px-2 py-1 rounded-md mt-1 cursor-pointer z-10 relative">
                          Lihat Bukti Transfer
                        </button>
                      )}
                      <p className="text-[10px] text-gray-400 z-10">{new Date(req.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdraw" className="space-y-4">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Request Penarikan Dana</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Kirim permintaan pencairan saldo tabungan Anda ke Admin.
                <span className="block mt-1.5 text-blue-600/90 font-medium">
                  Penting: Dana akan ditransfer ke <span className="underline">informasi rekening Anda</span>. 
                  Pastikan rekening sudah benar atau atur terlebih dahulu di bagian profil jika belum ada.
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWithdrawRequest} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Saldo Tersedia</Label>
                  <p className="text-xl font-bold text-red-800">Rp {totalSavings.toLocaleString("id-ID")}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="withdrawAmount" className="text-xs sm:text-sm">Nominal Penarikan</Label>
                  <Input 
                    id="withdrawAmount"
                    type="number" 
                    placeholder="Contoh: 50000" 
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    required
                    min={10000}
                    max={totalSavings}
                  />
                </div>
                <Button type="submit" disabled={totalSavings <= 0} className="w-full bg-gradient-to-r from-red-800 to-red-900 text-white">
                  <Send className="w-4 h-4 mr-2" /> Kirim Request Pencairan
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-white mt-4">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Status Penarikan</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Riwayat pengajuan penarikan dana Anda</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {withdrawRequests.length === 0 ? (
                  <p className="text-xs text-center p-3 text-gray-500">Belum ada riwayat penarikan.</p>
                ) : (
                  withdrawRequests.map(req => (
                    <div key={req.id} className="p-3 border rounded-lg flex flex-col gap-2 relative bg-gray-50">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-red-800">Rp {Number(req.amount).toLocaleString('id-ID')}</p>
                        <span className={`text-[10px] sm:text-xs px-2 py-1 rounded-full font-semibold ${
                          req.status === 'diajukan' ? 'bg-yellow-100 text-yellow-800' :
                          req.status === 'diproses' ? 'bg-blue-100 text-blue-800' :
                          req.status === 'disetujui' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {req.status === 'diajukan' ? 'DIAJUKAN' :
                           req.status === 'diproses' ? 'DIPROSES' :
                           req.status === 'disetujui' ? 'DISETUJUI' : 'DITOLAK'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{req.note}</p>
                      {req.proof_image && (
                        <button type="button" onClick={() => setPreviewImageUrl(req.proof_image)} className="text-xs text-blue-600 hover:underline inline-flex items-center w-fit border border-blue-200 bg-blue-50 px-2 py-1 rounded-md mt-1 cursor-pointer">
                          Lihat Bukti Transfer
                        </button>
                      )}
                      <div className="flex justify-between items-end mt-1">
                        <p className="text-[10px] text-gray-400">{new Date(req.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</p>
                        {req.status === 'diajukan' && (
                          <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] border-red-200 text-red-600 hover:bg-red-50" onClick={() => setCancelWithdrawConfirm(req.id)}>
                            Batalkan
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <AlertDialog open={withdrawConfirmOpen} onOpenChange={setWithdrawConfirmOpen}>
            <AlertDialogContent className="max-w-[95vw] sm:max-w-md mx-3">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-base sm:text-lg">Konfirmasi Penarikan</AlertDialogTitle>
                <AlertDialogDescription className="text-xs sm:text-sm">
                  Apakah Anda yakin ingin mengajukan pencairan dana sebesar <strong className="text-red-800">Rp {Number(withdrawAmount).toLocaleString('id-ID')}</strong>? 
                  Pengajuan ini akan dikirim ke Admin untuk disetujui.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-2">
                <AlertDialogCancel className="text-xs sm:text-sm w-full sm:w-auto m-0">Batal</AlertDialogCancel>
                <AlertDialogAction onClick={confirmWithdrawRequest} className="bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 text-white text-xs sm:text-sm w-full sm:w-auto m-0">
                  Ya, Ajukan Pencairan
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={!!cancelWithdrawConfirm} onOpenChange={(open) => !open && setCancelWithdrawConfirm(null)}>
            <AlertDialogContent className="max-w-[95vw] sm:max-w-md mx-3">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-base sm:text-lg">Batalkan Pengajuan</AlertDialogTitle>
                <AlertDialogDescription className="text-xs sm:text-sm">
                  Apakah Anda yakin ingin membatalkan pengajuan pencairan dana ini?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-2">
                <AlertDialogCancel className="text-xs sm:text-sm w-full sm:w-auto m-0">Tidak</AlertDialogCancel>
                <AlertDialogAction onClick={cancelWithdrawRequest} className="bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 text-white text-xs sm:text-sm w-full sm:w-auto m-0">
                  Ya, Batalkan
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg">Informasi Profil</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Kelola data rahasia profil Anda</CardDescription>
              </div>
              <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => setMemberToEdit(loggedInMember)} className="h-8">
                    <Settings className="w-4 h-4 mr-2" /> Edit Rekening
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Informasi Bank</DialogTitle>
                    <DialogDescription>Data bank ini digunakan admin saat transfer pencairan dana.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nama Pemilik Rekening</Label>
                        <Input value={memberToEdit.account_name || ""} onChange={e => setMemberToEdit({...memberToEdit, account_name: e.target.value})} placeholder="A.n Rekening" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Nama Bank</Label>
                        <select 
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          value={(["", "BCA", "BRI", "BNI", "Mandiri", "BTN", "CIMB Niaga", "Danamon", "Permata", "DANA", "OVO", "GoPay", "ShopeePay"].includes(memberToEdit.bank_name || "") ? (memberToEdit.bank_name || "") : "Lainnya")}
                          onChange={e => {
                            if (e.target.value === "Lainnya") {
                              setMemberToEdit({...memberToEdit, bank_name: "Lainnya_temp"});
                            } else {
                              setMemberToEdit({...memberToEdit, bank_name: e.target.value});
                            }
                          }}
                          required
                        >
                          <option value="" disabled>Pilih Bank/e-Wallet...</option>
                          <option value="BCA">BCA</option>
                          <option value="BRI">BRI</option>
                          <option value="BNI">BNI</option>
                          <option value="Mandiri">Mandiri</option>
                          <option value="BTN">BTN</option>
                          <option value="CIMB Niaga">CIMB Niaga</option>
                          <option value="Danamon">Danamon</option>
                          <option value="Permata">Permata</option>
                          <option value="DANA">DANA</option>
                          <option value="OVO">OVO</option>
                          <option value="GoPay">GoPay</option>
                          <option value="ShopeePay">ShopeePay</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                        {!(["", "BCA", "BRI", "BNI", "Mandiri", "BTN", "CIMB Niaga", "Danamon", "Permata", "DANA", "OVO", "GoPay", "ShopeePay"].includes(memberToEdit.bank_name || "")) && (
                          <Input 
                            className="mt-2"
                            placeholder="Ketik nama bank..." 
                            value={memberToEdit.bank_name === "Lainnya_temp" ? "" : memberToEdit.bank_name} 
                            onChange={e => setMemberToEdit({...memberToEdit, bank_name: e.target.value})}
                            required
                          />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Nomor Rekening</Label>
                        <Input value={memberToEdit.account_number || ""} onChange={e => setMemberToEdit({...memberToEdit, account_number: e.target.value})} placeholder="Contoh: 12345678" required />
                      </div>
                    </div>
                    <Button type="submit" className="w-full mt-4 bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 text-white">Simpan Perubahan</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 border-b pb-4">
                  <div>
                    <span className="block text-gray-600 text-xs mt-1">Nama</span>
                    <span className="font-medium text-sm block mt-1">{loggedInMember.name}</span>
                  </div>
                  <div>
                    <span className="block text-gray-600 text-xs mt-1">Telepon</span>
                    <span className="font-medium text-sm block mt-1">{loggedInMember.phone}</span>
                  </div>
                  <div>
                    <span className="block text-gray-600 text-xs mt-1">Bergabung Sejak</span>
                    <span className="font-medium text-sm block mt-1">
                      {new Date(loggedInMember.join_date).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Banknote className="w-5 h-5 text-blue-800" />
                    <h3 className="font-medium text-sm text-blue-900">Info Rekening Penarikan</h3>
                  </div>
                  
                  {(!loggedInMember.bank_name || !loggedInMember.account_number) ? (
                    <p className="text-gray-500 italic text-sm">Belum diisi</p>
                  ) : (
                    <div className="flex flex-col gap-1.5 items-start py-1">
                      <span className="font-semibold text-gray-900 text-sm tracking-wide uppercase">
                        {loggedInMember.account_name || loggedInMember.name}
                      </span>
                      <span className="bg-blue-100 text-blue-800 border border-blue-200 text-xs px-2 py-0.5 rounded-md font-medium tracking-wide">
                        {loggedInMember.bank_name}
                      </span>
                      <span className="text-gray-800 text-sm font-medium tracking-wider">
                        {loggedInMember.account_number}
                      </span>
                    </div>
                  )}

                  {(!loggedInMember.bank_name || !loggedInMember.account_number) && (
                    <p className="text-xs text-red-600 mt-3">* Mohon lengkapi data rekening Anda untuk memudahkan penarikan.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
