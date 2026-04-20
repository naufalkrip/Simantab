import { Plus, Users, User, Wallet, TrendingUp, LogOut, Search, X, Trash2, Pencil, Minus, Check, ChevronsUpDown, Download, ChevronDown, ChevronUp, Menu } from "lucide-react";
import { Link, useNavigate } from "react-router";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, differenceInDays } from "date-fns";
import React, { useState, useEffect } from "react";
import MemberList from "../../components/member-list";
import SavingsList from "../../components/transactions-list";
import MemberFormDialog from "../../components/member-form-dialog";
import SavingsFormDialog from "../../components/transactions-form-dialog";
import DailySavingsInput from "../../components/daily-transactions-input";
import MemberSavingsList from "../../components/member-transactions-list";
import { Toaster } from "../../components/ui/sonner";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../../components/ui/command";
import { adminService } from "../../services/adminService";
export interface Member {
  id: string;
  name: string;
  phone: string;
  join_date: string;
  account_name?: string;
  bank_name?: string;
  account_number?: string;
  category?: string | null;
}

export interface Transaction {
  id: string;
  member_id: string;
  amount: number;
  date: string;
  description: string;
  type: "deposit" | "withdrawal"; // deposit = masuk, withdrawal = keluar
  proof_url?: string;
  created_at?: string;
}

export interface WithdrawRequest {
  id: string;
  member_id: string;
  amount: number;
  status: 'diajukan' | 'diproses' | 'disetujui' | 'ditolak';
  note?: string;
  created_at: string;
  members?: {
    name: string;
    account_name: string;
    bank_name: string;
    account_number: string;
  };
}

export interface DepositRequest {
  id: string;
  member_id: string;
  amount: number;
  status: 'dikirim' | 'diproses' | 'selesai' | 'ditolak';
  proof_image: string;
  note?: string;
  created_at: string;
  members?: {
    name: string;
    account_name: string;
    bank_name: string;
    account_number: string;
  };
}

export interface AdminAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  created_at: string;
}

// Mock data
const initialMembers: Member[] = [
  {
    id: "1",
    name: "Budi Santoso",
    phone: "081234567890",
    join_date: "2024-01-15",
  },
  {
    id: "2",
    name: "Siti Nurhaliza",
    phone: "082345678901",
    join_date: "2024-02-20",
  },
  {
    id: "3",
    name: "Ahmad Rizki",
    phone: "083456789012",
    join_date: "2024-03-10",
  },
];

const initialSavings: Transaction[] = [
  {
    id: "1",
    member_id: "1",
    amount: 50000,
    date: "2024-03-01",
    description: "Tabungan rutin Maret",
    type: "deposit"
  },
  {
    id: "2",
    member_id: "1",
    amount: 50000,
    date: "2024-04-01",
    description: "Tabungan rutin April",
    type: "deposit"
  },
  {
    id: "3",
    member_id: "2",
    amount: 75000,
    date: "2024-03-01",
    description: "Tabungan rutin Maret",
    type: "deposit"
  },
  {
    id: "4",
    member_id: "2",
    amount: 75000,
    date: "2024-04-01",
    description: "Tabungan rutin April",
    type: "deposit"
  },
  {
    id: "5",
    member_id: "3",
    amount: 100000,
    date: "2024-03-15",
    description: "Tabungan rutin Maret",
    type: "deposit"
  },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setSavings] = useState<Transaction[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [savingsDialogOpen, setSavingsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [selectedMemberDetail, setSelectedMemberDetail] = useState<Member | null>(null);
  const [editingSavings, setEditingSavings] = useState<Transaction | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMember, setNewMember] = useState<Member>({
    id: "",
    name: "",
    phone: "",
    join_date: new Date().toISOString().split('T')[0],
    account_name: "",
    bank_name: "",
    account_number: "",
    category: "",
  });
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member>({
    id: "",
    name: "",
    phone: "",
    join_date: new Date().toISOString().split('T')[0],
    account_name: "",
    bank_name: "",
    account_number: "",
    category: "",
  });
  const [isAddSavingOpen, setIsAddSavingOpen] = useState(false);
  const [newSaving, setNewSaving] = useState<Transaction>({
    id: "",
    member_id: "",
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: "",
    type: "deposit"
  });
  const [searchMember, setSearchMember] = useState("");
  const [searchSaving, setSearchSaving] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua Kategori");
  const [recapSearch, setRecapSearch] = useState("");
  const [recapCategoryFilter, setRecapCategoryFilter] = useState("Semua Kategori");
  const [addSavingCategoryFilter, setAddSavingCategoryFilter] = useState("Semua Kategori");
  const [withdrawalCategoryFilter, setWithdrawalCategoryFilter] = useState("Semua Kategori");

  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const uniqueCategories = Array.from(new Set([...members.map(m => m.category).filter(Boolean), ...customCategories])) as string[];

  const [transactionFilter, setTransactionFilter] = useState<"all" | "deposit" | "withdrawal">("all");
  const [tableStartDate, setTableStartDate] = useState("");
  const [tableEndDate, setTableEndDate] = useState("");
  const [expandedDates, setExpandedDates] = useState<string[]>([]);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const toggleExpandedDate = (date: string) => {
    setExpandedDates(prev =>
      prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
    );
  };

  const [expandedWithdrawals, setExpandedWithdrawals] = useState<string[]>([]);
  const toggleExpandedWithdrawal = (id: string) => {
    setExpandedWithdrawals(prev =>
      prev.includes(id) ? prev.filter(wId => wId !== id) : [...prev, id]
    );
  };

  const [expandedRecapMembers, setExpandedRecapMembers] = useState<string[]>([]);
  const toggleExpandedRecapMember = (id: string) => {
    setExpandedRecapMembers(prev =>
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: 'member' | 'transaction' } | null>(null);
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);
  const [withdrawal, setWithdrawal] = useState<Transaction>({
    id: "",
    member_id: "",
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: "",
    type: "withdrawal"
  });
  const [memberComboboxOpen, setMemberComboboxOpen] = useState(false);
  const [withdrawalComboboxOpen, setWithdrawalComboboxOpen] = useState(false);

  // States for Withdrawal Approval image upload
  const [isWithdrawApproveOpen, setIsWithdrawApproveOpen] = useState(false);
  const [withdrawToApprove, setWithdrawToApprove] = useState<WithdrawRequest | null>(null);
  const [withdrawProofInput, setWithdrawProofInput] = useState<File | null>(null);
  const [withdrawProofPreview, setWithdrawProofPreview] = useState<string | null>(null);
  const [isSubmittingApprove, setIsSubmittingApprove] = useState(false);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [downloadDateRange, setDownloadDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [isMemberDownloadOpen, setIsMemberDownloadOpen] = useState(false);
  const [memberDownloadDateRange, setMemberDownloadDateRange] = useState({
    startDate: "",
    endDate: ""
  });



  // Load data from Backend API on mount
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn");
    if (!isLoggedIn) {
      navigate("/admin/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [membersRes, savingsRes, withdrawRes, depositRes, accountsRes] = await Promise.all([
          adminService.getMembers(),
          adminService.getTransactions(),
          adminService.getWithdrawRequests(),
          adminService.getDepositRequests(),
          adminService.getAdminAccounts()
        ]);

        setMembers(membersRes.length > 0 ? membersRes : initialMembers);
        setSavings(savingsRes.length > 0 ? savingsRes : initialSavings);
        setWithdrawRequests(withdrawRes);
        setDepositRequests(depositRes);
        setAdminAccounts(accountsRes);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setMembers(initialMembers);
        setSavings(initialSavings);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    if (confirm("Apakah Anda yakin ingin keluar?")) {
      localStorage.removeItem("adminLoggedIn");
      navigate("/admin/login");
    }
  };

  const handleApproveWithdrawRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawToApprove) return;
    if (!withdrawProofInput) {
      toast.error("Bukti transfer pencairan wajib diunggah!");
      return;
    }

    try {
      setIsSubmittingApprove(true);

      // Upload proof image
      const proofUrl = await adminService.uploadProofImage(withdrawProofInput);

      // Update withdraw request
      const updatedReq = await adminService.updateWithdrawRequest(
        withdrawToApprove.id,
        "disetujui",
        "Dana telah dicairkan",
        proofUrl
      );

      setWithdrawRequests(prev => prev.map(req => req.id === updatedReq.id ? { ...req, status: updatedReq.status, note: updatedReq.note, proof_image: updatedReq.proof_image } : req));

      const savingsRes = await adminService.getTransactions();
      setSavings(savingsRes);

      toast.success("Permintaan berhasil disetujui!");
      setIsWithdrawApproveOpen(false);
      setWithdrawToApprove(null);
      setWithdrawProofInput(null);
      setWithdrawProofPreview(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmittingApprove(false);
    }
  };

  const handleWithdrawApproveFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setWithdrawProofInput(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setWithdrawProofPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateWithdrawStatus = async (id: string, status: string, note: string) => {
    try {
      const updatedReq = await adminService.updateWithdrawRequest(id, status, note);

      // Update state
      setWithdrawRequests(prev => prev.map(req => req.id === id ? { ...req, status: updatedReq.status, note: updatedReq.note } : req));

      if (updatedReq.status === 'disetujui' || updatedReq.status === 'ditolak') {
        // If approved or rejected due to balance, transactions changed
        const savingsRes = await adminService.getTransactions();
        setSavings(savingsRes);
      }

      toast.success(`Permintaan penarikan telah ${updatedReq.status}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdateDepositStatus = async (id: string, status: string, note: string) => {
    try {
      const updatedReq = await adminService.updateDepositRequest(id, status, note);

      // Update state
      setDepositRequests(prev => prev.map(req => req.id === id ? { ...req, status: updatedReq.status, note: updatedReq.note } : req));

      if (updatedReq.status === 'selesai') {
        // If approved, transactions increased!
        const savingsRes = await adminService.getTransactions();
        setSavings(savingsRes);
      }

      toast.success(`Setoran telah ${updatedReq.status}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddAdminAccount = async (e: React.FormEvent, account: Omit<AdminAccount, 'id' | 'created_at'>) => {
    e.preventDefault();
    try {
      const savedAcc = await adminService.addAdminAccount(account);
      setAdminAccounts([savedAcc, ...adminAccounts]);
      toast.success("Rekening berhasil ditambahkan");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteAdminAccount = async (id: string) => {
    if (!confirm("Hapus rekening ini?")) return;
    try {
      await adminService.deleteAdminAccount(id);
      setAdminAccounts(adminAccounts.filter(a => a.id !== id));
      toast.success("Rekening berhasil dihapus");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const totalMembers = members.length;
  const totalSavings = transactions.reduce((sum, s) => {
    if (s.type === "withdrawal") {
      return sum - s.amount;  // Kurangi untuk penarikan
    }
    return sum + s.amount;    // Tambah untuk deposit
  }, 0);
  const avgSavings = totalMembers > 0 ? totalSavings / totalMembers : 0;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!newMember.name.trim()) {
      toast.error("Nama tidak boleh kosong");
      return;
    }
    if (!newMember.phone.trim()) {
      toast.error("Nomor telepon tidak boleh kosong");
      return;
    }
    if (!/^[0-9]{10,13}$/.test(newMember.phone)) {
      toast.error("Nomor telepon harus 10-13 digit");
      return;
    }

    // Check duplicate phone
    if (members.some(m => m.phone === newMember.phone)) {
      toast.error("Nomor telepon sudah terdaftar");
      return;
    }

    try {
      const createdMember = await adminService.addMember(newMember);

      setMembers([...members, createdMember]);
      toast.success(`Anggota ${createdMember.name} berhasil ditambahkan`);

      // Reset form
      setNewMember({
        id: "",
        name: "",
        phone: "",
        join_date: new Date().toISOString().split('T')[0],
        account_name: "",
        bank_name: "",
        account_number: "",
      });
      setIsAddMemberOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEditMember = (member: Member) => {
    setMemberToEdit(member);
    setIsEditMemberOpen(true);
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!memberToEdit.name.trim()) {
      toast.error("Nama tidak boleh kosong");
      return;
    }
    if (!memberToEdit.phone.trim()) {
      toast.error("Nomor telepon tidak boleh kosong");
      return;
    }
    if (!/^[0-9]{10,13}$/.test(memberToEdit.phone)) {
      toast.error("Nomor telepon harus 10-13 digit");
      return;
    }
    if (!memberToEdit.account_name || memberToEdit.account_name.trim() === '') {
      toast.error('Nama pemilik rekening tidak boleh kosong');
      return;
    }
    if (!memberToEdit.bank_name || memberToEdit.bank_name.trim() === '') {
      toast.error('Nama bank wajib dipilih');
      return;
    }
    if (!memberToEdit.account_number || memberToEdit.account_number.trim() === '') {
      toast.error('Nomor rekening/e-wallet tidak boleh kosong');
      return;
    }

    // Check duplicate phone (exclude current member)
    if (members.some(m => m.phone === memberToEdit.phone && m.id !== memberToEdit.id)) {
      toast.error("Nomor telepon sudah terdaftar");
      return;
    }

    try {
      const updatedMember = await adminService.updateMember(memberToEdit.id, memberToEdit);

      setMembers(members.map((m) => (m.id === updatedMember.id ? updatedMember : m)));
      toast.success(`Data anggota ${updatedMember.name} berhasil diperbarui`);

      // Reset form
      setMemberToEdit({
        id: "",
        name: "",
        phone: "",
        join_date: new Date().toISOString().split('T')[0],
        account_name: "",
        bank_name: "",
        account_number: "",
      });
      setIsEditMemberOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteMember = (id: string) => {
    setDeleteConfirm({ id, type: 'member' });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      if (deleteConfirm.type === 'member') {
        await adminService.deleteMember(deleteConfirm.id);

        const member = members.find(m => m.id === deleteConfirm.id);

        setMembers(members.filter((m) => m.id !== deleteConfirm.id));
        setSavings(transactions.filter((s) => s.member_id !== deleteConfirm.id));
        setWithdrawRequests(withdrawRequests.filter((w) => w.member_id !== deleteConfirm.id));
        setDepositRequests(depositRequests.filter((d) => d.member_id !== deleteConfirm.id));

        toast.success(`Anggota ${member?.name} dan riwayat terkait berhasil dihapus`);
      } else if (deleteConfirm.type === 'transaction') {
        await adminService.deleteTransaction(deleteConfirm.id);

        const transaction = transactions.find(s => s.id === deleteConfirm.id);
        setSavings(transactions.filter((s) => s.id !== deleteConfirm.id));
        toast.success(`Transaksi sebesar Rp ${transaction?.amount.toLocaleString("id-ID")} berhasil dihapus`);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleSaveMember = async (member: Member) => {
    try {
      if (editingMember) {
        const updated = await adminService.updateMember(member.id, member);

        setMembers(members.map((m) => (m.id === updated.id ? updated : m)));
        toast.success("Data anggota berhasil diperbarui");
      } else {
        const created = await adminService.addMember(member);

        setMembers([...members, created]);
        toast.success("Anggota baru berhasil ditambahkan");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setMemberDialogOpen(false);
    }
  };

  const handleAddSavings = () => {
    setEditingSavings(null);
    setSavingsDialogOpen(true);
  };

  const handleEditSavings = (transaction: Transaction) => {
    setEditingSavings(transaction);
    setSavingsDialogOpen(true);
  };

  const handleDeleteSavings = (id: string) => {
    setDeleteConfirm({ id, type: 'transaction' });
  };

  const handleSaveSavings = async (transaction: Transaction) => {
    try {
      if (editingSavings) {
        const updated = await adminService.updateSaving(transaction.id, transaction);

        setSavings(transactions.map((s) => (s.id === updated.id ? updated : s)));
        toast.success("Transaksi berhasil diperbarui");
      } else {
        const created = await adminService.addTransaction(transaction);

        setSavings([...transactions, created]);
        toast.success("Transaksi berhasil ditambahkan");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSavingsDialogOpen(false);
    }
  };

  const handleSaveDailySavings = async (newSavings: Transaction[]) => {
    try {
      const promises = newSavings.map(s => adminService.addTransaction(s));

      const createdSavings = await Promise.all(promises);
      setSavings([...transactions, ...createdSavings]);
      toast.success(`${createdSavings.length} transaksi berhasil ditambahkan`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddSaving = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!newSaving.member_id) {
      toast.error("Pilih anggota terlebih dahulu");
      return;
    }
    if (newSaving.amount <= 0) {
      toast.error("Jumlah harus lebih dari 0");
      return;
    }

    try {
      const savedTransaction = await adminService.addTransaction({
        ...newSaving,
        description: newSaving.description || "Tabungan"
      });

      setSavings([savedTransaction, ...transactions]);

      const member = members.find(m => m.id === newSaving.member_id);
      toast.success(`Tabungan ${member?.name} sebesar Rp ${Number(newSaving.amount).toLocaleString("id-ID")} berhasil ditambahkan`);

      // Reset form
      setNewSaving({
        id: "",
        member_id: "",
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: "",
        type: "deposit"
      });
      setIsAddSavingOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteSaving = (id: string) => {
    setDeleteConfirm({ id, type: 'transaction' });
  };

  // Filter members and transactions based on search
  const filteredMembers = members.filter(m => {
    const matchesCategory = categoryFilter === "Semua Kategori" || m.category === categoryFilter;
    const matchesSearch = m.name.toLowerCase().includes(searchMember.toLowerCase()) || m.phone.includes(searchMember);
    return matchesCategory && matchesSearch;
  });

  // Calculate filtered transactions
  const filteredSavings = transactions.filter((transaction) => {
    const member = members.find((m) => m.id === transaction.member_id);
    const memberName = member?.name || "";
    const matchesSearch = memberName.toLowerCase().includes(searchSaving.toLowerCase()) ||
      transaction.date.includes(searchSaving) ||
      transaction.description.toLowerCase().includes(searchSaving.toLowerCase());

    let matchesType = true;
    if (transactionFilter !== "all") {
      matchesType = transaction.type === transactionFilter;
    }

    let matchesDate = true;
    if (tableStartDate && tableEndDate) {
      matchesDate = transaction.date >= tableStartDate && transaction.date <= tableEndDate;
    } else if (tableStartDate) {
      matchesDate = transaction.date >= tableStartDate;
    } else if (tableEndDate) {
      matchesDate = transaction.date <= tableEndDate;
    }

    return matchesSearch && matchesType && matchesDate;
  });

  // Calculate today's total transactions
  const today = new Date().toISOString().split('T')[0];
  const todaySavings = transactions.filter(s => s.date === today);
  const todayDeposit = todaySavings.filter(s => s.type === "deposit").reduce((sum, s) => sum + s.amount, 0);
  const todayWithdrawal = todaySavings.filter(s => s.type === "withdrawal").reduce((sum, s) => sum + s.amount, 0);
  const todayNet = todayDeposit - todayWithdrawal;
  const todayCount = todaySavings.length;

  const handleDownloadPDF = () => {
    const { startDate, endDate } = downloadDateRange;
    if (!startDate || !endDate) {
      toast.error("Silakan pilih rentang tanggal");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      toast.error("Tanggal mulai tidak boleh lebih dari tanggal akhir");
      return;
    }

    const diffDays = differenceInDays(end, start);
    if (diffDays < 0) return;
    if (diffDays > 31) {
      toast.error("Rentang tanggal maksimal 1 bulan (31 hari)");
      return;
    }

    // Filter data
    const filteredSavings = transactions.filter(s => {
      const sDate = new Date(s.date);
      return sDate >= start && sDate <= end;
    });

    if (filteredSavings.length === 0) {
      toast.error("Tidak ada transaksi pada rentang tanggal tersebut");
      return;
    }

    // Calculate totals
    const totalDeposit = filteredSavings
      .filter(s => s.type === "deposit")
      .reduce((sum, s) => sum + s.amount, 0);
    const totalWithdrawal = filteredSavings
      .filter(s => s.type === "withdrawal")
      .reduce((sum, s) => sum + s.amount, 0);
    const grandTotal = totalDeposit - totalWithdrawal;

    try {
      const doc = new jsPDF();

      // Title
      doc.setFontSize(16);
      doc.setTextColor(153, 27, 27); // red-800
      doc.text("Laporan Riwayat Transaksi", 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Periode: ${format(start, 'dd MMM yyyy')} - ${format(end, 'dd MMM yyyy')}`, 14, 30);

      // Summary section
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Total Uang Masuk: Rp ${totalDeposit.toLocaleString("id-ID")}`, 14, 40);
      doc.text(`Total Uang Keluar: Rp ${totalWithdrawal.toLocaleString("id-ID")}`, 14, 47);
      doc.setFont("helvetica", "bold");
      doc.text(`Total Akhir: Rp ${grandTotal.toLocaleString("id-ID")}`, 14, 54);
      doc.setFont("helvetica", "normal");

      // Table
      const tableColumn = ["Tanggal", "Anggota", "Jenis", "Keterangan", "Nominal"];

      // Group by Category
      const categoriesSet = new Set<string>();
      filteredSavings.forEach(s => {
        const m = members.find(x => x.id === s.member_id);
        categoriesSet.add(m?.category || "Tanpa Kategori");
      });
      const categories = Array.from(categoriesSet).sort();

      let currentY = 65;

      categories.forEach(category => {
        const categorySavings = filteredSavings.filter(s => {
          const m = members.find(x => x.id === s.member_id);
          return (m?.category || "Tanpa Kategori") === category;
        });

        if (categorySavings.length === 0) return;

        if (currentY > doc.internal.pageSize.getHeight() - 30) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(12);
        doc.setTextColor(153, 27, 27); // red-800
        doc.setFont("helvetica", "bold");
        doc.text(`Kategori: ${category}`, 14, currentY);
        doc.setFont("helvetica", "normal");

        currentY += 5;

        const tableRows: any[] = [];
        const sortedSavings = [...categorySavings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        sortedSavings.forEach(transaction => {
          const member = members.find(m => m.id === transaction.member_id);
          const memberName = member ? member.name : "Tidak diketahui";
          tableRows.push([
            format(new Date(transaction.date), 'dd/MM/yyyy'),
            memberName,
            transaction.type === "deposit" ? "Masuk (Setoran)" : "Keluar (Penarikan)",
            transaction.description,
            `${transaction.type === "deposit" ? "+" : "-"} Rp ${transaction.amount.toLocaleString("id-ID")}`
          ]);
        });

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: currentY,
          theme: 'grid',
          headStyles: { fillColor: [153, 27, 27] }, // red-800
          alternateRowStyles: { fillColor: [255, 255, 255] }, // white
          margin: { top: 20 },
          didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 2) {
              if (data.cell.raw === 'Masuk (Setoran)') {
                data.cell.styles.textColor = [21, 128, 61]; // green-700
                data.cell.styles.fontStyle = 'bold';
              } else if (data.cell.raw === 'Keluar (Penarikan)') {
                data.cell.styles.textColor = [185, 28, 28]; // red-700
                data.cell.styles.fontStyle = 'bold';
              }
            }
            if (data.section === 'body' && data.column.index === 4) {
              const val = data.cell.raw as string;
              if (val.startsWith("+")) {
                data.cell.styles.textColor = [21, 128, 61];
              } else if (val.startsWith("-")) {
                data.cell.styles.textColor = [185, 28, 28];
              }
            }
          }
        });

        currentY = (doc as any).lastAutoTable.finalY + 15;
      });

      doc.save(`Riwayat_Transaksi_${format(start, 'yyyyMMdd')}_${format(end, 'yyyyMMdd')}.pdf`);
      setIsDownloadOpen(false);
      toast.success("File PDF berhasil diunduh");
    } catch (error: any) {
      console.error("Error generating PDF", error);
      toast.error("Gagal membuat PDF: Terjadi kesalahan internal");
    }
  };

  const handleDownloadMemberPDF = () => {
    try {
      const { startDate, endDate } = memberDownloadDateRange;

      let membersToDownload = [...members];

      if (startDate && endDate) {
        membersToDownload = members.filter(m => m.join_date >= startDate && m.join_date <= endDate);
      } else if (startDate) {
        membersToDownload = members.filter(m => m.join_date >= startDate);
      } else if (endDate) {
        membersToDownload = members.filter(m => m.join_date <= endDate);
      }

      if (membersToDownload.length === 0) {
        toast.error("Tidak ada data anggota dalam rentang tanggal tersebut");
        return;
      }

      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.setTextColor(153, 27, 27); // red-800
      doc.text("Laporan Data Anggota", 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(100);
      if (startDate && endDate) {
        doc.text(`Periode Gabung: ${format(new Date(startDate), 'dd MMM yyyy')} - ${format(new Date(endDate), 'dd MMM yyyy')}`, 14, 30);
      } else if (startDate) {
        doc.text(`Periode Gabung: Mulai ${format(new Date(startDate), 'dd MMM yyyy')}`, 14, 30);
      } else if (endDate) {
        doc.text(`Periode Gabung: Sampai ${format(new Date(endDate), 'dd MMM yyyy')}`, 14, 30);
      } else {
        doc.text(`Periode: Semua Anggota Terdaftar`, 14, 30);
      }

      const totalMemberBalance = membersToDownload.reduce((sum, member) => {
        const memberBal = transactions.filter(s => s.member_id === member.id).reduce((subSum, s) => {
          if (s.type === "withdrawal") return subSum - s.amount;
          return subSum + s.amount;
        }, 0);
        return sum + memberBal;
      }, 0);

      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Total Anggota: ${membersToDownload.length} Orang`, 14, 40);
      doc.setFont("helvetica", "bold");
      doc.text(`Total Keseluruhan Saldo: Rp ${totalMemberBalance.toLocaleString("id-ID")}`, 14, 47);
      doc.setFont("helvetica", "normal");

      const tableColumn = ["Nama Anggota", "Telepon", "Tanggal Gabung", "Total Saldo"];

      // Group by Category
      const categoriesSet = new Set<string>();
      membersToDownload.forEach(m => {
        categoriesSet.add(m.category || "Tanpa Kategori");
      });
      const categories = Array.from(categoriesSet).sort();

      let currentY = 55;

      categories.forEach(category => {
        const categoryMembers = membersToDownload.filter(m => (m.category || "Tanpa Kategori") === category);

        if (categoryMembers.length === 0) return;

        if (currentY > doc.internal.pageSize.getHeight() - 30) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(12);
        doc.setTextColor(153, 27, 27); // red-800
        doc.setFont("helvetica", "bold");
        doc.text(`Kategori: ${category}`, 14, currentY);
        doc.setFont("helvetica", "normal");

        currentY += 5;

        const tableRows: any[] = [];
        const sortedMembers = [...categoryMembers].sort((a, b) => new Date(a.join_date).getTime() - new Date(b.join_date).getTime());

        sortedMembers.forEach((member) => {
          const memberBal = transactions.filter(s => s.member_id === member.id).reduce((subSum, s) => {
            if (s.type === "withdrawal") return subSum - s.amount;
            return subSum + s.amount;
          }, 0);

          tableRows.push([
            member.name,
            member.phone || "-",
            format(new Date(member.join_date), 'dd/MM/yyyy'),
            `Rp ${memberBal.toLocaleString("id-ID")}`
          ]);
        });

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: currentY,
          theme: 'grid',
          headStyles: { fillColor: [153, 27, 27] }, // red-800
          alternateRowStyles: { fillColor: [255, 255, 255] }, // white
          margin: { top: 20 }
        });

        currentY = (doc as any).lastAutoTable.finalY + 15;
      });

      doc.save(`Laporan_Anggota_${format(new Date(), 'yyyyMMdd')}.pdf`);
      setIsMemberDownloadOpen(false);
      toast.success("File Laporan Anggota berhasil diunduh");
    } catch (error: any) {
      console.error("Error generating PDF", error);
      toast.error("Gagal membuat PDF: Terjadi kesalahan internal");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <Dialog open={!!previewImageUrl} onOpenChange={(open) => !open && setPreviewImageUrl(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl p-1 overflow-hidden bg-transparent border-0 shadow-none [&>button]:hidden">
          <div className="relative flex items-center justify-center">
            <Button
              variant="ghost"
              className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70 rounded-full w-8 h-8 p-0 z-50"
              onClick={() => setPreviewImageUrl(null)}
            >
              <X className="w-5 h-5" color="white" />
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
        <div className="w-full px-3 md:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-1 bg-white/10 hover:bg-white/20 rounded-md transition-colors">
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <h1 className="text-base sm:text-xl md:text-2xl font-bold tracking-tight">Dashboard Admin</h1>
            </div>
            <Button variant="outline" onClick={handleLogout} className="bg-white text-red-800 hover:bg-red-50 border-white text-xs sm:text-sm px-2 py-1 h-8 sm:h-9 sm:px-4">
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 md:hidden flex flex-col ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold text-red-800 text-lg">Menu Admin</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-gray-100 rounded-md">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {[
            { value: "overview", label: "Ringkasan" },
            { value: "members", label: "Anggota" },
            { value: "transactions", label: "Tabungan" },
            { value: "deposits", label: "Setoran", count: depositRequests.filter(r => r.status === 'dikirim').length },
            { value: "withdrawals", label: "Penarikan", count: withdrawRequests.filter(r => r.status === 'diajukan').length },
            { value: "settings", label: "Pengaturan" }
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => { setActiveTab(item.value); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === item.value ? "bg-red-50 text-red-800" : "text-gray-600 hover:bg-gray-50"}`}
            >
              {item.label}
              {!!item.count && <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">{item.count}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full px-3 md:px-4 lg:px-6 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="hidden md:grid w-full grid-cols-6 mb-4 sm:mb-6 font-medium">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Ringkasan</TabsTrigger>
            <TabsTrigger value="members" className="text-xs sm:text-sm">Anggota</TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs sm:text-sm">Tabungan</TabsTrigger>
            <TabsTrigger value="deposits" className="text-xs sm:text-sm">Setoran <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] tracking-tight border border-blue-200 shadow-sm">{depositRequests.filter(r => r.status === 'dikirim').length}</span></TabsTrigger>
            <TabsTrigger value="withdrawals" className="text-xs sm:text-sm">Penarikan <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-800 rounded-full text-[10px] tracking-tight border border-red-200 shadow-sm">{withdrawRequests.filter(r => r.status === 'diajukan').length}</span></TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm">Pengaturan</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 w-full justify-start">
              <Card className="bg-gradient-to-br from-red-50 to-white flex flex-col justify-between h-full p-4 gap-3 border shadow-sm">
                <div className="flex flex-row items-center justify-between">
                  <h3 className="text-sm font-medium leading-tight text-gray-800">Total Anggota</h3>
                  <Users className="h-4 w-4 text-red-800" />
                </div>
                <div className="flex-1 flex items-center justify-start">
                  <p className="text-2xl font-bold text-red-800 text-left">{members.length}</p>
                </div>
                <p className="text-xs text-gray-500 text-left">Anggota terdaftar</p>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-white flex flex-col justify-between h-full p-4 gap-3 border shadow-sm">
                <div className="flex flex-row items-center justify-between">
                  <h3 className="text-sm font-medium leading-tight text-gray-800">Total Saldo</h3>
                  <Wallet className="h-4 w-4 text-red-800" />
                </div>
                <div className="flex-1 flex items-center justify-start">
                  <p className="text-2xl font-bold text-red-800 text-left">Rp {totalSavings.toLocaleString("id-ID")}</p>
                </div>
                <p className="text-xs text-gray-500 text-left">Akumulasi tabungan</p>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-white flex flex-col justify-between h-full p-4 gap-3 border shadow-sm">
                <div className="flex flex-row items-center justify-between">
                  <h3 className="text-sm font-medium leading-tight text-gray-800">Total Transaksi</h3>
                  <TrendingUp className="h-4 w-4 text-red-800" />
                </div>
                <div className="flex-1 flex items-center justify-start">
                  <p className="text-2xl font-bold text-red-800 text-left">{transactions.length}</p>
                </div>
                <p className="text-xs text-gray-500 text-left">Transaksi tercatat</p>
              </Card>
            </div>

            <Card className="bg-white border-red-100/50 shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div>
                  <CardTitle className="text-sm sm:text-base font-semibold text-gray-800">Rekap Saldo Anggota</CardTitle>
                  <CardDescription className="text-xs text-gray-500 mt-1">Total tabungan (net) tiap anggota</CardDescription>
                </div>
                <Dialog open={isDownloadOpen} onOpenChange={setIsDownloadOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 text-xs sm:text-sm shadow-sm w-full sm:w-auto">
                      <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Download Laporan
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-md mx-3">
                    <DialogHeader>
                      <DialogTitle className="text-base sm:text-lg">Download Riwayat Transaksi</DialogTitle>
                      <DialogDescription className="text-xs sm:text-sm">
                        Pilih rentang tanggal untuk mengunduh laporan (maksimal 1 bulan).
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-3">
                      <div className="space-y-2">
                        <Label htmlFor="startDate" className="text-xs sm:text-sm">Tanggal Mulai</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={downloadDateRange.startDate}
                          onChange={(e) => setDownloadDateRange({ ...downloadDateRange, startDate: e.target.value })}
                          className="text-xs sm:text-sm"
                          max={downloadDateRange.endDate || new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate" className="text-xs sm:text-sm">Tanggal Akhir</Label>
                        <Input
                          id="endDate"
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
                        Download PDF
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="flex flex-col sm:flex-row gap-2 pb-3 mb-3 border-b border-gray-100">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                    <Input
                      placeholder="Cari anggota..."
                      value={recapSearch}
                      onChange={(e) => setRecapSearch(e.target.value)}
                      className="pl-8 text-xs h-8"
                    />
                  </div>
                  <select
                    className="flex h-8 w-full sm:w-auto rounded-md border border-input bg-transparent px-3 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={recapCategoryFilter}
                    onChange={(e) => setRecapCategoryFilter(e.target.value)}
                  >
                    <option value="Semua Kategori">Semua Kategori</option>
                    {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                {members.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <p className="text-xs">Belum ada anggota terdaftar</p>
                  </div>
                ) : (
                  <div className="max-h-[160px] sm:max-h-[250px] overflow-y-auto pr-2 space-y-2">
                    {members
                      .filter(m => {
                        const matchCat = recapCategoryFilter === "Semua Kategori" || m.category === recapCategoryFilter;
                        const matchSearch = m.name.toLowerCase().includes(recapSearch.toLowerCase()) || m.phone.includes(recapSearch);
                        return matchCat && matchSearch;
                      })
                      .map((member) => {
                        const memberBalance = transactions
                          .filter((s) => s.member_id === member.id)
                          .reduce((sum, s) => {
                            if (s.type === "withdrawal") return sum - s.amount;
                            return sum + s.amount;
                          }, 0);

                        const recentSavings = transactions
                          .filter((s) => s.member_id === member.id)
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .slice(0, 5);

                        return (
                          <React.Fragment key={member.id}>
                            <div
                              onClick={() => toggleExpandedRecapMember(member.id)}
                              className="flex justify-between items-center p-3 rounded-lg bg-white shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <div className="bg-red-50 w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                                  <User className="w-4 h-4 text-red-800" />
                                </div>
                                <div>
                                  <p className="text-base font-medium text-gray-800 leading-tight">{member.name}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">{member.phone}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-gray-500 whitespace-nowrap ml-2 font-bold text-red-700">
                                  Rp {memberBalance.toLocaleString("id-ID")}
                                </p>
                                {expandedRecapMembers.includes(member.id) ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                              </div>
                            </div>
                            {expandedRecapMembers.includes(member.id) && (
                              <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100 mt-1 mb-2 ml-4">
                                <p className="text-xs font-semibold text-gray-600 mb-2">5 Transaksi Terakhir</p>
                                {recentSavings.length === 0 ? (
                                  <p className="text-[10px] text-gray-400 italic">Belum ada transaksi</p>
                                ) : (
                                  <div className="space-y-2">
                                    {recentSavings.map((trx) => (
                                      <div key={trx.id} className="flex justify-between items-center border-b border-gray-100 pb-1 last:border-0 last:pb-0">
                                        <div>
                                          <p className="text-xs font-medium text-gray-700">{trx.description}</p>
                                          <p className="text-[10px] text-gray-400">{new Date(trx.created_at || trx.date).toLocaleString("id-ID", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <p className={`text-xs font-bold ${trx.type === 'deposit' ? 'text-green-600' : 'text-red-500'}`}>
                                          {trx.type === 'deposit' ? '+' : '-'} Rp {Number(trx.amount).toLocaleString('id-ID')}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>

          </TabsContent>

          <TabsContent value="members" className="space-y-4 sm:space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <div>
                    <CardTitle className="text-base sm:text-lg">Manajemen Anggota</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Tambah atau edit data anggota</CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:mt-0">
                    {/* Add Category Modal */}
                    <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                      <DialogContent className="max-w-[400px] border-none shadow-xl">
                        <DialogHeader>
                          <DialogTitle>Kategori Anggota Baru</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          if (newCategoryName.trim()) {
                            setCustomCategories(prev => [...prev, newCategoryName.trim()]);
                            setNewMember(prev => ({ ...prev, category: newCategoryName.trim() }));
                            setNewSaving(prev => ({ ...prev, category: newCategoryName.trim() })); // If used elsewhere
                            setNewCategoryName("");
                            setIsAddCategoryOpen(false);
                          }
                        }} className="space-y-4 py-2">
                          <Input
                            placeholder="Ketik nama kategori (Contoh: VIP, Bronze...)"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            autoFocus
                            required
                          />
                          <DialogFooter className="flex-col sm:flex-row gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsAddCategoryOpen(false)} className="w-full sm:w-auto text-xs sm:text-sm">Batal</Button>
                            <Button type="submit" className="w-full sm:w-auto text-xs sm:text-sm bg-red-800 text-white hover:bg-red-900">Simpan Kategori</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={isMemberDownloadOpen} onOpenChange={setIsMemberDownloadOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50 text-xs sm:text-sm shadow-sm">
                          <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Download Laporan
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[95vw] sm:max-w-md mx-3">
                        <DialogHeader>
                          <DialogTitle className="text-base sm:text-lg">Download Data Anggota</DialogTitle>
                          <DialogDescription className="text-xs sm:text-sm">
                            Pilih rentang tanggal anggota mendaftar. Kosongkan untuk unduh semua anggota.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-3">
                          <div className="space-y-2">
                            <Label htmlFor="startMember" className="text-xs sm:text-sm">Tanggal Mulai</Label>
                            <Input
                              id="startMember"
                              type="date"
                              value={memberDownloadDateRange.startDate}
                              onChange={(e) => setMemberDownloadDateRange({ ...memberDownloadDateRange, startDate: e.target.value })}
                              className="text-xs sm:text-sm"
                              max={memberDownloadDateRange.endDate || new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="endMember" className="text-xs sm:text-sm">Tanggal Akhir</Label>
                            <Input
                              id="endMember"
                              type="date"
                              value={memberDownloadDateRange.endDate}
                              onChange={(e) => setMemberDownloadDateRange({ ...memberDownloadDateRange, endDate: e.target.value })}
                              className="text-xs sm:text-sm"
                              min={memberDownloadDateRange.startDate}
                              max={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                        </div>
                        <DialogFooter className="flex-col sm:flex-row gap-2">
                          <Button type="button" variant="outline" onClick={() => setIsMemberDownloadOpen(false)} className="text-xs sm:text-sm w-full sm:w-auto">
                            Batal
                          </Button>
                          <Button type="button" onClick={handleDownloadMemberPDF} className="bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 text-xs sm:text-sm w-full sm:w-auto">
                            <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            Download PDF
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 text-xs sm:text-sm shadow-sm">
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Tambah Anggota
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[95vw] md:max-w-2xl mx-3 p-0 max-h-[85vh] flex flex-col overflow-hidden">
                        <div className="p-4 sm:p-6 border-b border-gray-100 flex-shrink-0">
                          <DialogHeader>
                            <DialogTitle className="text-base sm:text-lg">Tambah Anggota Baru</DialogTitle>
                            <DialogDescription className="text-xs sm:text-sm">
                              Masukkan data anggota beserta kategori dan informasi rekening.
                            </DialogDescription>
                          </DialogHeader>
                        </div>
                        <form onSubmit={handleAddMember} className="flex flex-col flex-1 overflow-hidden min-h-0">
                          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">

                              {/* Kiri: Data Anggota */}
                              <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">Data Anggota</h3>
                                <div className="space-y-2">
                                  <Label htmlFor="name" className="text-xs sm:text-sm">Nama Lengkap *</Label>
                                  <Input
                                    id="name"
                                    placeholder="Nama lengkap"
                                    value={newMember.name}
                                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                                    required
                                    className="text-xs sm:text-sm rounded-lg"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="phone" className="text-xs sm:text-sm">Nomor Telepon *</Label>
                                  <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="081234567890"
                                    value={newMember.phone}
                                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value.replace(/\D/g, '') })}
                                    required
                                    maxLength={13}
                                    className="text-xs sm:text-sm rounded-lg"
                                  />
                                  <p className="text-xs text-gray-500">10-13 digit angka</p>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="join_date" className="text-xs sm:text-sm">Tanggal Bergabung *</Label>
                                  <Input
                                    id="join_date"
                                    type="date"
                                    value={newMember.join_date}
                                    onChange={(e) => setNewMember({ ...newMember, join_date: e.target.value })}
                                    required
                                    max={new Date().toISOString().split('T')[0]}
                                    className="text-xs sm:text-sm rounded-lg"
                                  />
                                </div>
                              </div>

                              {/* Kanan: Informasi Rekening */}
                              <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">Informasi Rekening</h3>
                                <div className="space-y-2">
                                  <Label htmlFor="category" className="text-xs sm:text-sm">Kategori</Label>
                                  <div className="flex gap-2">
                                    <select
                                      id="category"
                                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-xs sm:text-sm rounded-lg"
                                      value={newMember.category || ""}
                                      onChange={e => setNewMember({ ...newMember, category: e.target.value })}
                                    >
                                      <option value="">Pilih Kategori... (Opsional)</option>
                                      {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                    <Button type="button" variant="outline" size="icon" className="shrink-0 h-9 rounded-lg" onClick={() => setIsAddCategoryOpen(true)}>
                                      <Plus className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="account_name" className="text-xs sm:text-sm">Nama Pemilik Rekening</Label>
                                  <Input
                                    id="account_name"
                                    placeholder="Contoh: A.n Rekening"
                                    value={newMember.account_name || ""}
                                    onChange={(e) => setNewMember({ ...newMember, account_name: e.target.value })}
                                    className="text-xs sm:text-sm rounded-lg"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="bank_name" className="text-xs sm:text-sm">Nama Bank</Label>
                                  <select
                                    id="bank_name"
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-xs sm:text-sm rounded-lg"
                                    value={(["", "BCA", "BRI", "BNI", "Mandiri", "BTN", "CIMB Niaga", "Danamon", "Permata", "DANA", "OVO", "GoPay", "ShopeePay"].includes(newMember.bank_name || "") ? (newMember.bank_name || "") : "Lainnya")}
                                    onChange={e => {
                                      if (e.target.value === "Lainnya") {
                                        setNewMember({ ...newMember, bank_name: "Lainnya_temp" });
                                      } else {
                                        setNewMember({ ...newMember, bank_name: e.target.value });
                                      }
                                    }}
                                  >
                                    <option value="" disabled>Pilih Bank/e-Wallet... (Opsional)</option>
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
                                  {!(["", "BCA", "BRI", "BNI", "Mandiri", "BTN", "CIMB Niaga", "Danamon", "Permata", "DANA", "OVO", "GoPay", "ShopeePay"].includes(newMember.bank_name || "")) && (
                                    <Input
                                      className="mt-2 text-xs sm:text-sm rounded-lg"
                                      placeholder="Ketik nama bank..."
                                      value={newMember.bank_name === "Lainnya_temp" ? "" : newMember.bank_name}
                                      onChange={e => setNewMember({ ...newMember, bank_name: e.target.value })}
                                    />
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="account_number" className="text-xs sm:text-sm">No. Rekening / No. HP eWallet</Label>
                                  <Input
                                    id="account_number"
                                    placeholder="Contoh: 12345678"
                                    value={newMember.account_number || ""}
                                    onChange={(e) => setNewMember({ ...newMember, account_number: e.target.value })}
                                    className="text-xs sm:text-sm rounded-lg"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 sm:p-5 border-t bg-gray-50 flex flex-col sm:flex-row justify-end gap-2 flex-shrink-0">
                            <Button type="button" variant="outline" onClick={() => setIsAddMemberOpen(false)} className="text-xs sm:text-sm w-full sm:w-auto">
                              Batal
                            </Button>
                            <Button type="submit" className="bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 text-xs sm:text-sm w-full sm:w-auto">
                              Simpan Data
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Cari nama atau nomor telepon..."
                      value={searchMember}
                      onChange={(e) => setSearchMember(e.target.value)}
                      className="pl-10 text-xs sm:text-sm"
                    />
                    {searchMember && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchMember("")}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <select
                    className="flex h-9 w-full sm:w-[180px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="Semua Kategori">Semua Kategori</option>
                    {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                {filteredMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchMember ? (
                      <>
                        <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">Tidak ada anggota ditemukan</p>
                      </>
                    ) : (
                      <>
                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">Belum ada anggota terdaftar</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg md:border bg-white overflow-hidden">
                    {/* View Desktop */}
                    <div className="overflow-x-auto hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50/50">
                            <TableHead className="text-xs sm:text-sm font-semibold">Profil Anggota</TableHead>
                            <TableHead className="text-xs sm:text-sm font-semibold">Kategori</TableHead>
                            <TableHead className="text-xs sm:text-sm font-semibold">Info Rekening</TableHead>
                            <TableHead className="text-xs sm:text-sm font-semibold">Bergabung</TableHead>
                            <TableHead className="text-right text-xs sm:text-sm font-semibold">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredMembers.map((member) => (
                            <TableRow key={member.id} className="hover:bg-gray-50 transition-colors">
                              <TableCell className="py-3">
                                <p className="font-semibold text-sm text-gray-900">{member.name}</p>
                                <p className="text-xs text-gray-500 font-mono mt-0.5">{member.phone}</p>
                              </TableCell>
                              <TableCell className="py-3">
                                {member.category ? (
                                  <span className="bg-gray-200 text-gray-800 rounded-full px-2 py-1 text-[10px] sm:text-xs">
                                    {member.category}
                                  </span>
                                ) : (
                                  <span className="bg-gray-100 text-gray-400 rounded-full px-2 py-1 text-[10px] sm:text-xs italic">
                                    Tidak ada kategori
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="py-3">
                                {member.bank_name || member.account_number ? (
                                  <div className="flex flex-col">
                                    <span className="text-[10px] sm:text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md w-fit mb-1 border border-blue-100 uppercase">
                                      {member.bank_name || "BANK"}
                                    </span>
                                    <span className="text-xs sm:text-sm font-mono text-gray-800">{member.account_number || "Belum ada no rek"}</span>
                                    {member.account_name && (
                                      <span className="text-[10px] sm:text-xs text-gray-500 mt-0.5 flex items-center">
                                        <span className="mr-1">a.n</span> <span className="font-medium text-gray-700">{member.account_name}</span>
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">Belum diatur</span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm py-3 text-gray-600">
                                {new Date(member.join_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                              </TableCell>
                              <TableCell className="text-right py-3">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditMember(member)}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs sm:text-sm px-2 sm:px-3"
                                  >
                                    <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteMember(member.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs sm:text-sm px-2 sm:px-3"
                                  >
                                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* View Mobile (Cards) */}
                    <div className="grid grid-cols-1 gap-3 md:hidden">
                      {filteredMembers.map((member) => (
                        <div key={member.id} className="bg-white border rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:border-red-200 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="bg-gradient-to-br from-red-50 to-red-100 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-red-100">
                              <User className="w-5 h-5 text-red-700" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between flex-wrap gap-1">
                                <p className="font-bold text-gray-900 text-base leading-tight">{member.name}</p>
                                {member.category ? (
                                  <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-semibold border border-blue-100 mt-0.5 leading-none shrink-0 whitespace-nowrap">
                                    {member.category}
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full italic border border-gray-200 mt-0.5 leading-none shrink-0 whitespace-nowrap">
                                    Belum ada kategori
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1 font-medium tracking-wide">{member.phone}</p>
                            </div>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col gap-2">
                            <span className="text-slate-500 text-xs font-semibold">Informasi Rekening</span>
                            {member.bank_name || member.account_number ? (
                              <div className="flex flex-col gap-1 items-start">
                                <div className="flex items-center gap-2">
                                  <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-bold tracking-wide uppercase border border-blue-200">
                                    {member.bank_name || "BANK"}
                                  </span>
                                  <span className="text-gray-800 text-sm font-bold font-mono tracking-wider">{member.account_number}</span>
                                </div>
                                <span className="text-gray-500 text-[10px] font-medium uppercase">{member.account_name || member.name}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic text-xs">Informasi rekening belum diisi</span>
                            )}
                          </div>

                          <div className="flex justify-between items-center mt-1 pt-3 border-t border-gray-100">
                            <span className="text-[11px] text-gray-400 font-medium">Join: <span className="text-gray-600">{new Date(member.join_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</span></span>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 text-blue-600 border-blue-200 hover:bg-blue-50 shadow-sm rounded-lg"
                                onClick={() => handleEditMember(member)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50 shadow-sm rounded-lg"
                                onClick={() => handleDeleteMember(member.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4 sm:space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <div>
                    <CardTitle className="text-base sm:text-lg">Input Tabungan</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Catat transaksi tabungan anggota</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={isAddSavingOpen} onOpenChange={setIsAddSavingOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 text-xs sm:text-sm">
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Tambah Tabungan
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[95vw] md:max-w-2xl mx-3 p-4 sm:p-6 max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-base sm:text-lg">Tambah Transaksi Tabungan</DialogTitle>
                          <DialogDescription className="text-xs sm:text-sm">
                            Input tabungan untuk anggota
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddSaving} className="flex flex-col gap-3 sm:gap-4 mt-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-start">
                            <div className="space-y-2">
                              <Label className="text-xs sm:text-sm">Filter Kategori (Opsional)</Label>
                            <select
                              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-xs sm:text-sm"
                              value={addSavingCategoryFilter}
                              onChange={(e) => {
                                setAddSavingCategoryFilter(e.target.value);
                                setNewSaving({ ...newSaving, member_id: "" });
                              }}
                            >
                              <option value="Semua Kategori">Semua Kategori</option>
                              {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="member_id" className="text-xs sm:text-sm">Pilih Anggota *</Label>
                            <Popover open={memberComboboxOpen} onOpenChange={setMemberComboboxOpen} modal={true}>
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={memberComboboxOpen}
                                  className="w-full justify-between font-normal text-xs sm:text-sm"
                                >
                                  {newSaving.member_id ? (() => {
                                    const m = members.find((member) => member.id === newSaving.member_id);
                                    return m ? (
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        <span className="truncate">{m.name}</span>
                                        {m.category && <span className="text-[10px] text-gray-600 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded-md font-medium whitespace-nowrap">{m.category}</span>}
                                      </div>
                                    ) : "-- Cari & Pilih Anggota --";
                                  })() : "-- Cari & Pilih Anggota --"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[300px] p-0" align="start">
                                <Command>
                                  <CommandInput placeholder="Cari nama atau kategori..." />
                                  <CommandList>
                                    <CommandEmpty>Anggota tidak ditemukan.</CommandEmpty>
                                    <CommandGroup>
                                      {members.filter(m => addSavingCategoryFilter === "Semua Kategori" || m.category === addSavingCategoryFilter).map((member) => (
                                        <CommandItem
                                          key={member.id}
                                          value={`${member.name} ${member.category || ''}`}
                                          onSelect={() => {
                                            setNewSaving({ ...newSaving, member_id: member.id === newSaving.member_id ? "" : member.id })
                                            setMemberComboboxOpen(false)
                                          }}
                                        >
                                          <Check
                                            className={`mr-2 h-4 w-4 ${newSaving.member_id === member.id ? "opacity-100" : "opacity-0"}`}
                                          />
                                          <div className="flex flex-col">
                                            <span>{member.name} ({member.phone})</span>
                                            {member.category && (
                                              <span className="text-[10px] text-gray-600 bg-gray-100 w-fit px-1.5 rounded mt-0.5 border border-gray-200">{member.category}</span>
                                            )}
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="amount" className="text-xs sm:text-sm">Jumlah (Rp) *</Label>
                            <Input
                              id="amount"
                              type="number"
                              placeholder="50000"
                              value={newSaving.amount || ''}
                              onChange={(e) => setNewSaving({ ...newSaving, amount: Number(e.target.value) })}
                              required
                              min="1000"
                              step="1000"
                              className="text-xs sm:text-sm"
                            />
                            <p className="text-xs text-gray-500">Minimal Rp 1.000</p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="date" className="text-xs sm:text-sm">Tanggal *</Label>
                            <Input
                              id="date"
                              type="date"
                              value={newSaving.date}
                              onChange={(e) => setNewSaving({ ...newSaving, date: e.target.value })}
                              required
                              max={new Date().toISOString().split('T')[0]}
                              className="text-xs sm:text-sm"
                            />
                          </div>
                          </div>
                          <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
                            <Button type="button" variant="outline" onClick={() => setIsAddSavingOpen(false)} className="text-xs sm:text-sm w-full sm:w-auto">
                              Batal
                            </Button>
                            <Button type="submit" className="bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 text-xs sm:text-sm w-full sm:w-auto">
                              Simpan
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={isWithdrawalOpen} onOpenChange={setIsWithdrawalOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50 text-xs sm:text-sm">
                          <Minus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Penarikan Dana
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[95vw] md:max-w-2xl mx-3 p-4 sm:p-6 max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-base sm:text-lg">Penarikan Dana Tabungan</DialogTitle>
                          <DialogDescription className="text-xs sm:text-sm">
                            Catat pengambilan dana anggota
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={async (e) => {
                          e.preventDefault();

                          if (!withdrawal.member_id) {
                            toast.error("Pilih anggota terlebih dahulu");
                            return;
                          }
                          if (withdrawal.amount <= 0) {
                            toast.error("Jumlah harus lebih dari 0");
                            return;
                          }

                          const memberBalance = transactions
                            .filter((s) => s.member_id === withdrawal.member_id)
                            .reduce((sum, s) => {
                              if (s.type === "withdrawal") {
                                return sum - s.amount;
                              }
                              return sum + s.amount;
                            }, 0);

                          if (withdrawal.amount > memberBalance) {
                            toast.error(`Saldo tidak cukup! Saldo tersedia: Rp ${memberBalance.toLocaleString("id-ID")}`);
                            return;
                          }

                          try {
                            const withdrawalResult = await adminService.addTransaction({
                                ...withdrawal,
                                amount: Number(withdrawal.amount),
                                description: withdrawal.description || "Penarikan dana",
                                type: "withdrawal"
                              });

                            setSavings([withdrawalResult, ...transactions]);

                            const member = members.find(m => m.id === withdrawal.member_id);
                            toast.success(`Penarikan dana ${member?.name} sebesar Rp ${Number(withdrawal.amount).toLocaleString("id-ID")} berhasil dicatat`);

                            setWithdrawal({
                              id: "",
                              member_id: "",
                              amount: 0,
                              date: new Date().toISOString().split('T')[0],
                              description: "",
                              type: "withdrawal"
                            });
                            setIsWithdrawalOpen(false);
                          } catch (error: any) {
                            toast.error(error.message);
                          }
                        }} className="flex flex-col gap-3 sm:gap-4 mt-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-start">
                            <div className="space-y-2">
                              <Label className="text-xs sm:text-sm">Filter Kategori (Opsional)</Label>
                            <select
                              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-xs sm:text-sm"
                              value={withdrawalCategoryFilter}
                              onChange={(e) => {
                                setWithdrawalCategoryFilter(e.target.value);
                                setWithdrawal({ ...withdrawal, member_id: "" });
                              }}
                            >
                              <option value="Semua Kategori">Semua Kategori</option>
                              {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="withdrawal-member_id" className="text-xs sm:text-sm">Pilih Anggota *</Label>
                            <Popover open={withdrawalComboboxOpen} onOpenChange={setWithdrawalComboboxOpen} modal={true}>
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={withdrawalComboboxOpen}
                                  className="w-full justify-between font-normal text-xs sm:text-sm"
                                >
                                  {withdrawal.member_id ? (() => {
                                    const m = members.find((member) => member.id === withdrawal.member_id);
                                    return m ? (
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        <span className="truncate">{m.name}</span>
                                        {m.category && <span className="text-[10px] text-gray-600 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded-md font-medium whitespace-nowrap">{m.category}</span>}
                                      </div>
                                    ) : "-- Cari & Pilih Anggota --";
                                  })() : "-- Cari & Pilih Anggota --"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[300px] p-0" align="start">
                                <Command>
                                  <CommandInput placeholder="Cari nama atau kategori..." />
                                  <CommandList>
                                    <CommandEmpty>Anggota tidak ditemukan.</CommandEmpty>
                                    <CommandGroup>
                                      {members.filter(m => withdrawalCategoryFilter === "Semua Kategori" || m.category === withdrawalCategoryFilter).map((member) => {
                                        const balance = transactions
                                          .filter((s) => s.member_id === member.id)
                                          .reduce((sum, s) => {
                                            if (s.type === "withdrawal") {
                                              return sum - s.amount;
                                            }
                                            return sum + s.amount;
                                          }, 0);
                                        return (
                                          <CommandItem
                                            key={member.id}
                                            value={`${member.name} ${member.phone} ${member.category || ''}`}
                                            onSelect={() => {
                                              setWithdrawal({ ...withdrawal, member_id: member.id === withdrawal.member_id ? "" : member.id })
                                              setWithdrawalComboboxOpen(false)
                                            }}
                                          >
                                            <Check
                                              className={`mr-2 h-4 w-4 ${withdrawal.member_id === member.id ? "opacity-100" : "opacity-0"}`}
                                            />
                                            <div className="flex flex-col">
                                              <div className="flex items-center gap-2">
                                                <span>{member.name}</span>
                                                {member.category && (
                                                  <span className="text-[10px] text-gray-600 bg-gray-100 px-1.5 rounded border border-gray-200">{member.category}</span>
                                                )}
                                              </div>
                                              <span className="text-xs text-gray-500">Saldo: Rp {balance.toLocaleString("id-ID")}</span>
                                            </div>
                                          </CommandItem>
                                        );
                                      })}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            {withdrawal.member_id && (
                              <p className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                                💰 Saldo tersedia: <span className="font-bold">
                                  Rp {transactions
                                    .filter((s) => s.member_id === withdrawal.member_id)
                                    .reduce((sum, s) => {
                                      if (s.type === "withdrawal") {
                                        return sum - s.amount;
                                      }
                                      return sum + s.amount;
                                    }, 0)
                                    .toLocaleString("id-ID")}
                                </span>
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="withdrawal-amount" className="text-xs sm:text-sm">Jumlah Penarikan (Rp) *</Label>
                            <Input
                              id="withdrawal-amount"
                              type="number"
                              placeholder="50000"
                              value={withdrawal.amount || ''}
                              onChange={(e) => setWithdrawal({ ...withdrawal, amount: Number(e.target.value) })}
                              required
                              min="1000"
                              step="1000"
                              className="text-xs sm:text-sm"
                            />
                            <p className="text-xs text-gray-500">Minimal Rp 1.000</p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="withdrawal-description" className="text-xs sm:text-sm">Keterangan</Label>
                            <Input
                              id="withdrawal-description"
                              placeholder="Keperluan penarikan (opsional)"
                              value={withdrawal.description}
                              onChange={(e) => setWithdrawal({ ...withdrawal, description: e.target.value })}
                              className="text-xs sm:text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="withdrawal-date" className="text-xs sm:text-sm">Tanggal *</Label>
                            <Input
                              id="withdrawal-date"
                              type="date"
                              value={withdrawal.date}
                              onChange={(e) => setWithdrawal({ ...withdrawal, date: e.target.value })}
                              required
                              max={new Date().toISOString().split('T')[0]}
                              className="text-xs sm:text-sm"
                            />
                          </div>
                          </div>
                          <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
                            <Button type="button" variant="outline" onClick={() => setIsWithdrawalOpen(false)} className="text-xs sm:text-sm w-full sm:w-auto">
                              Batal
                            </Button>
                            <Button type="submit" className="bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 text-white text-xs sm:text-sm w-full sm:w-auto">
                              Catat Penarikan
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Cari nama anggota atau keterangan..."
                    value={searchSaving}
                    onChange={(e) => setSearchSaving(e.target.value)}
                    className="pl-10 text-xs sm:text-sm"
                  />
                  {searchSaving && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchSaving("")}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Today's Summary Cards */}
                <div className="mb-2">
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">
                    Ringkasan Hari Ini • {new Date().toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 w-full justify-start">
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 flex flex-col justify-between h-full p-4 gap-3 shadow-sm">
                    <div className="flex flex-row items-center justify-between">
                      <h3 className="text-sm font-medium text-green-800">Uang Masuk Hari Ini</h3>
                      <div className="bg-green-200/50 p-1.5 rounded-full"><Plus className="w-4 h-4 text-green-700" /></div>
                    </div>
                    <div className="flex-1 flex items-center justify-start">
                      <p className="text-2xl font-bold text-green-700 text-left">Rp {todayDeposit.toLocaleString("id-ID")}</p>
                    </div>
                    <p className="text-xs text-green-600 text-left opacity-80">Total pemasukan</p>
                  </Card>

                  <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200 flex flex-col justify-between h-full p-4 gap-3 shadow-sm">
                    <div className="flex flex-row items-center justify-between">
                      <h3 className="text-sm font-medium text-red-800">Uang Keluar Hari Ini</h3>
                      <div className="bg-red-200/50 p-1.5 rounded-full"><Minus className="w-4 h-4 text-red-700" /></div>
                    </div>
                    <div className="flex-1 flex items-center justify-start">
                      <p className="text-2xl font-bold text-red-700 text-left">Rp {todayWithdrawal.toLocaleString("id-ID")}</p>
                    </div>
                    <p className="text-xs text-red-600 text-left opacity-80">Total pengeluaran</p>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 flex flex-col justify-between h-full p-4 gap-3 shadow-sm">
                    <div className="flex flex-row items-center justify-between">
                      <h3 className="text-sm font-medium text-blue-800">Total Keseluruhan (Net)</h3>
                      <div className="bg-blue-200/50 p-1.5 rounded-full"><Wallet className="w-4 h-4 text-blue-700" /></div>
                    </div>
                    <div className="flex-1 flex items-center justify-start">
                      <p className={`text-2xl font-bold text-left ${todayNet >= 0 ? "text-blue-700" : "text-red-700"}`}>
                        {todayNet < 0 && "- "}Rp {Math.abs(todayNet).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <p className="text-xs text-blue-600 text-left opacity-80">Selisih masuk & keluar</p>
                  </Card>
                </div>

                {/* Daily Transaction Summary */}
                {transactions.length > 0 && (
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle className="text-sm sm:text-base">Riwayat Transaksi Harian</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Ringkasan uang masuk, keluar, dan total bersih per tanggal</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {(() => {
                          // Group transactions by date
                          const savingsByDate = transactions.reduce((acc, transaction) => {
                            const date = transaction.date;
                            if (!acc[date]) {
                              acc[date] = [];
                            }
                            acc[date].push(transaction);
                            return acc;
                          }, {} as Record<string, typeof transactions>);

                          // Sort dates descending
                          const sortedDates = Object.keys(savingsByDate).sort((a, b) =>
                            new Date(b).getTime() - new Date(a).getTime()
                          );

                          return sortedDates.map((date) => {
                            const dateSavings = savingsByDate[date];
                            const dateDeposit = dateSavings.filter(s => s.type === "deposit").reduce((sum, s) => sum + s.amount, 0);
                            const dateWithdrawal = dateSavings.filter(s => s.type === "withdrawal").reduce((sum, s) => sum + s.amount, 0);
                            const dateNet = dateDeposit - dateWithdrawal;
                            const dateCount = dateSavings.length;
                            const isToday = date === today;

                            return (
                              <div key={date} className={`border rounded-lg overflow-hidden transition-colors ${isToday ? 'border-green-300' : ''}`}>
                                <div
                                  onClick={() => toggleExpandedDate(date)}
                                  className={`flex items-center justify-between p-3 sm:p-4 cursor-pointer hover:bg-gray-50 transition-colors ${isToday ? 'bg-green-50/50' : 'bg-white'}`}
                                >
                                  <div className="flex-1 flex flex-col justify-center">
                                    <p className="font-semibold text-xs sm:text-sm text-gray-900 leading-tight">
                                      {new Date(date).toLocaleDateString("id-ID", {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                      })}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {dateCount} transaksi
                                    </p>
                                  </div>
                                  <div className="text-right flex items-center gap-2 sm:gap-3">
                                    {isToday && (
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold whitespace-nowrap">
                                        Hari ini
                                      </span>
                                    )}
                                    <p className={`font-bold text-sm sm:text-base ${dateNet >= 0 ? (isToday ? 'text-green-700' : 'text-green-600') : 'text-red-600'
                                      }`}>
                                      {dateNet >= 0 ? "+ " : "- "}
                                      Rp {Math.abs(dateNet).toLocaleString("id-ID")}
                                    </p>
                                    {expandedDates.includes(date) ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />}
                                  </div>
                                </div>

                                {expandedDates.includes(date) && (
                                  <div className="bg-gray-50/50 border-t p-3 sm:p-4">
                                    <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Rincian Hari Ini</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                      <div className="bg-white p-3 rounded-lg border border-green-100 flex items-center justify-between shadow-sm">
                                        <div>
                                          <p className="text-xs font-medium text-green-800 mb-0.5">Uang Masuk</p>
                                          <p className="text-sm font-bold text-green-700">Rp {dateDeposit.toLocaleString("id-ID")}</p>
                                        </div>
                                        <div className="bg-green-100 p-1.5 rounded-full"><Plus className="w-4 h-4 text-green-700" /></div>
                                      </div>

                                      <div className="bg-white p-3 rounded-lg border border-red-100 flex items-center justify-between shadow-sm">
                                        <div>
                                          <p className="text-xs font-medium text-red-800 mb-0.5">Uang Keluar</p>
                                          <p className="text-sm font-bold text-red-700">Rp {dateWithdrawal.toLocaleString("id-ID")}</p>
                                        </div>
                                        <div className="bg-red-100 p-1.5 rounded-full"><Minus className="w-4 h-4 text-red-700" /></div>
                                      </div>

                                      <div className="bg-white p-3 rounded-lg border border-blue-100 flex items-center justify-between shadow-sm">
                                        <div>
                                          <p className="text-xs font-medium text-blue-800 mb-0.5">Total (Net)</p>
                                          <p className={`text-sm font-bold ${dateNet >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                                            {dateNet < 0 && "- "}Rp {Math.abs(dateNet).toLocaleString("id-ID")}
                                          </p>
                                        </div>
                                        <div className="bg-blue-100 p-1.5 rounded-full"><Wallet className="w-4 h-4 text-blue-700" /></div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Table Filters */}
                <div className="flex flex-col xl:flex-row justify-between gap-3 mt-4 sm:mt-6 mb-2">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={transactionFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTransactionFilter("all")}
                      className={`text-xs sm:text-sm ${transactionFilter === "all" ? "bg-gray-800 hover:bg-gray-900" : ""}`}
                    >
                      Semua Transaksi
                    </Button>
                    <Button
                      variant={transactionFilter === "deposit" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTransactionFilter("deposit")}
                      className={`text-xs sm:text-sm ${transactionFilter === "deposit" ? "bg-green-700 hover:bg-green-800" : "text-green-700 border-green-200 hover:bg-green-50"}`}
                    >
                      Uang Masuk
                    </Button>
                    <Button
                      variant={transactionFilter === "withdrawal" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTransactionFilter("withdrawal")}
                      className={`text-xs sm:text-sm ${transactionFilter === "withdrawal" ? "bg-red-600 hover:bg-red-700 text-white" : "text-red-600 border-red-200 hover:bg-red-50"}`}
                    >
                      Uang Keluar
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 bg-white border rounded-md px-2 py-1 shadow-sm h-8 sm:h-9">
                      <Input
                        type="date"
                        value={tableStartDate}
                        onChange={(e) => setTableStartDate(e.target.value)}
                        className="h-full w-[110px] sm:w-[130px] text-xs border-0 p-0 shadow-none focus-visible:ring-0 cursor-pointer bg-transparent"
                      />
                      <span className="text-gray-400 text-xs font-bold">-</span>
                      <Input
                        type="date"
                        value={tableEndDate}
                        onChange={(e) => setTableEndDate(e.target.value)}
                        className="h-full w-[110px] sm:w-[130px] text-xs border-0 p-0 shadow-none focus-visible:ring-0 cursor-pointer bg-transparent"
                        min={tableStartDate}
                      />
                    </div>
                    {(tableStartDate || tableEndDate) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setTableStartDate(""); setTableEndDate(""); }}
                        className="h-8 sm:h-9 px-2 text-gray-500 hover:text-red-600 hover:bg-red-50"
                        title="Reset Tanggal"
                      >
                        <X className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Reset</span>
                      </Button>
                    )}
                  </div>
                </div>

                {filteredSavings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchSaving ? (
                      <>
                        <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">Tidak ada transaksi ditemukan</p>
                      </>
                    ) : (
                      <>
                        <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">Belum ada transaksi tabungan</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg md:border bg-white overflow-hidden">
                    {/* View Desktop */}
                    <div className="overflow-x-auto hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs sm:text-sm">Tanggal</TableHead>
                            <TableHead className="text-xs sm:text-sm">Anggota</TableHead>
                            <TableHead className="text-xs sm:text-sm">Keterangan</TableHead>
                            <TableHead className="text-right text-xs sm:text-sm">Jumlah</TableHead>
                            <TableHead className="text-center text-xs sm:text-sm">Bukti</TableHead>
                            <TableHead className="text-right text-xs sm:text-sm">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSavings
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((transaction) => {
                              const member = members.find((m) => m.id === transaction.member_id);
                              return (
                                <TableRow key={transaction.id}>
                                  <TableCell className="text-xs sm:text-sm">{new Date(transaction.created_at || transaction.date).toLocaleString("id-ID", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</TableCell>
                                  <TableCell className="font-medium text-xs sm:text-sm">{member?.name || 'Unknown'}</TableCell>
                                  <TableCell className="text-xs sm:text-sm">
                                    {transaction.description}
                                  </TableCell>
                                  <TableCell className={`text-right font-medium text-xs sm:text-sm ${transaction.type === "withdrawal" ? "text-red-600" : "text-green-600"
                                    }`}>
                                    {transaction.type === "withdrawal" ? "- " : "+ "}
                                    Rp {transaction.amount.toLocaleString("id-ID")}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {transaction.proof_url ? (
                                      <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] sm:text-xs border-blue-200 text-blue-700 hover:bg-blue-50 flex items-center justify-center gap-1 mx-auto" onClick={() => setPreviewImageUrl(transaction.proof_url!)}>
                                        Lihat Bukti
                                      </Button>
                                    ) : (
                                      <span className="text-[10px] sm:text-xs text-gray-400 italic">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteSaving(transaction.id)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs sm:text-sm px-2 sm:px-3"
                                    >
                                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* View Mobile (Cards) */}
                    <div className="grid grid-cols-1 gap-3 md:hidden p-1">
                      {filteredSavings
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((transaction) => {
                          const member = members.find((m) => m.id === transaction.member_id);
                          return (
                            <div key={transaction.id} className="bg-white border rounded-lg p-3 shadow-sm flex flex-col gap-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-[10px] text-gray-400 font-medium mb-1">
                                    {new Date(transaction.created_at || transaction.date).toLocaleString("id-ID", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                  <p className="font-bold text-gray-900 text-sm leading-tight">{member?.name || 'Unknown'}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">{transaction.description}</p>
                                </div>
                                <div className="text-right flex flex-col items-end gap-2">
                                  <span className={`font-bold text-sm ${transaction.type === "withdrawal" ? "text-red-600" : "text-green-600"}`}>
                                    {transaction.type === "withdrawal" ? "-" : "+"} Rp {transaction.amount.toLocaleString("id-ID")}
                                  </span>
                                  {transaction.proof_url && (
                                    <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => setPreviewImageUrl(transaction.proof_url!)}>
                                      Lihat Bukti
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <div className="flex justify-end border-t border-gray-50 pt-2 mt-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteSaving(transaction.id)}
                                  className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 text-xs shrink-0 flex items-center gap-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Hapus
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deposits" className="space-y-4">
            <Card className="bg-white border-blue-100/50 shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm sm:text-base font-semibold text-gray-800">Setoran Transfer</CardTitle>
                  <CardDescription className="text-xs text-gray-500 mt-1">Daftar setoran masuk transfer anggota</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4 overflow-x-auto">
                {depositRequests.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-4">Belum ada request setoran</p>
                ) : (
                  <div className="rounded-lg md:border bg-white overflow-hidden">
                    {/* View Desktop */}
                    <div className="overflow-x-auto hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nama Anggota</TableHead>
                            <TableHead>Nominal</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead className="text-center">Bukti</TableHead>
                            <TableHead className="text-right truncate">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {depositRequests.map(req => {
                            const memberInfo = req.members || members.find(m => m.id === req.member_id) || { name: 'Unknown', bank_name: '', account_number: '' };
                            return (
                              <TableRow key={req.id}>
                                <TableCell className="font-medium text-sm">
                                  {memberInfo.name}
                                </TableCell>
                                <TableCell className="text-sm font-bold text-blue-800">Rp {Number(req.amount).toLocaleString("id-ID")}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${req.status === 'dikirim' ? 'bg-yellow-100 text-yellow-800' :
                                      req.status === 'diproses' ? 'bg-blue-100 text-blue-800' :
                                        req.status === 'selesai' ? 'bg-green-100 text-green-800' :
                                          'bg-red-100 text-red-800'
                                    }`}>
                                    {req.status === 'dikirim' ? 'DIKIRIM' :
                                      req.status === 'diproses' ? 'DIPROSES' :
                                        req.status === 'selesai' ? 'SELESAI' : 'DITOLAK'}
                                  </span>
                                </TableCell>
                                <TableCell className="text-xs text-gray-500">
                                  {new Date(req.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </TableCell>
                                <TableCell className="text-center">
                                  {req.proof_image ? (
                                    <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] sm:text-xs border-blue-200 text-blue-700 hover:bg-blue-50 flex items-center justify-center gap-1 mx-auto" onClick={() => setPreviewImageUrl(req.proof_image)}>
                                      Lihat Bukti
                                    </Button>
                                  ) : (
                                    <span className="text-[10px] sm:text-xs text-gray-400 italic block text-center">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {req.status === 'dikirim' && (
                                    <div className="flex justify-end gap-2 flex-wrap">
                                      <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] sm:text-xs border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => handleUpdateDepositStatus(req.id, 'diproses', 'Sedang diproses oleh admin')}>Proses</Button>
                                      <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] sm:text-xs border-red-200 text-red-700 hover:bg-red-50" onClick={() => handleUpdateDepositStatus(req.id, 'ditolak', 'Transfer ditolak admin')}>Tolak</Button>
                                    </div>
                                  )}
                                  {req.status === 'diproses' && (
                                    <div className="flex justify-end gap-2 flex-wrap">
                                      <Button size="sm" className="h-7 px-2 text-[10px] sm:text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => handleUpdateDepositStatus(req.id, 'selesai', 'Saldo berhasil masuk via transfer')}>Setujui</Button>
                                      <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] sm:text-xs border-red-200 text-red-700 hover:bg-red-50" onClick={() => handleUpdateDepositStatus(req.id, 'ditolak', 'Transfer ditolak admin')}>Tolak</Button>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* View Mobile (Cards) */}
                    <div className="grid grid-cols-1 gap-3 md:hidden p-1">
                      {depositRequests.map(req => {
                        const memberInfo = req.members || members.find(m => m.id === req.member_id) || { name: 'Unknown', bank_name: '', account_number: '' };
                        return (
                          <div key={req.id} className="bg-white border rounded-lg p-3 shadow-sm flex flex-col gap-2">
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <p className="font-bold text-gray-900 text-sm leading-tight mb-1">{memberInfo.name}</p>
                                <p className="text-sm font-bold text-blue-700">Rp {Number(req.amount).toLocaleString("id-ID")}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-[10px] font-bold shrink-0 ${req.status === 'dikirim' ? 'bg-yellow-100 text-yellow-800' :
                                  req.status === 'diproses' ? 'bg-blue-100 text-blue-800' :
                                    req.status === 'selesai' ? 'bg-green-100 text-green-800' :
                                      'bg-red-100 text-red-800'
                                }`}>
                                {req.status === 'dikirim' ? 'DIKIRIM' :
                                  req.status === 'diproses' ? 'DIPROSES' :
                                    req.status === 'selesai' ? 'SELESAI' : 'DITOLAK'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[10px] text-gray-400 font-medium">
                                {new Date(req.created_at).toLocaleDateString("id-ID", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {req.proof_image && (
                                <button type="button" onClick={() => setPreviewImageUrl(req.proof_image!)} className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer bg-blue-50 px-2 py-1 rounded border border-blue-100">
                                  Lihat Bukti
                                </button>
                              )}
                            </div>

                            {(req.status === 'dikirim' || req.status === 'diproses') && (
                              <div className="flex justify-end gap-2 border-t border-gray-50 pt-2 mt-1">
                                {req.status === 'dikirim' && (
                                  <>
                                    <Button size="sm" variant="outline" className="h-7 px-3 text-xs border-red-200 text-red-700 hover:bg-red-50 flex-1" onClick={() => handleUpdateDepositStatus(req.id, 'ditolak', 'Transfer ditolak admin')}>Tolak</Button>
                                    <Button size="sm" variant="outline" className="h-7 px-3 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 flex-1" onClick={() => handleUpdateDepositStatus(req.id, 'diproses', 'Sedang diproses oleh admin')}>Proses</Button>
                                  </>
                                )}
                                {req.status === 'diproses' && (
                                  <>
                                    <Button size="sm" variant="outline" className="h-7 px-3 text-xs border-red-200 text-red-700 hover:bg-red-50 flex-1" onClick={() => handleUpdateDepositStatus(req.id, 'ditolak', 'Transfer ditolak admin')}>Tolak</Button>
                                    <Button size="sm" className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700 text-white flex-1" onClick={() => handleUpdateDepositStatus(req.id, 'selesai', 'Saldo berhasil masuk via transfer')}>Setujui</Button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals" className="space-y-4">
            <Card className="bg-white border-red-100/50 shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm sm:text-base font-semibold text-gray-800">Request Penarikan</CardTitle>
                  <CardDescription className="text-xs text-gray-500 mt-1">Daftar permintaan pencairan dana anggota</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4 overflow-x-auto">
                {withdrawRequests.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-4">Belum ada request penarikan</p>
                ) : (
                  <div className="rounded-lg md:border bg-white overflow-hidden">
                    {/* View Desktop */}
                    <div className="overflow-x-auto hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nama Anggota</TableHead>
                            <TableHead>Nominal</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead className="text-right truncate">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {withdrawRequests.map(req => {
                            const memberInfo = req.members || members.find(m => m.id === req.member_id) || { name: 'Unknown', bank_name: '', account_number: '' };
                            return (
                              <React.Fragment key={req.id}>
                                <TableRow>
                                  <TableCell className="font-medium text-sm">
                                    {memberInfo.name}
                                    <p className="text-[10px] sm:text-xs font-normal text-gray-500 mt-1">{memberInfo.bank_name || '-'} | {memberInfo.account_number || '-'}</p>
                                  </TableCell>
                                  <TableCell className="text-sm font-bold text-red-800">Rp {Number(req.amount).toLocaleString("id-ID")}</TableCell>
                                  <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${req.status === 'diajukan' ? 'bg-yellow-100 text-yellow-800' :
                                        req.status === 'diproses' ? 'bg-blue-100 text-blue-800' :
                                          req.status === 'disetujui' ? 'bg-green-100 text-green-800' :
                                            'bg-red-100 text-red-800'
                                      }`}>
                                      {req.status === 'diajukan' ? 'DIAJUKAN' :
                                        req.status === 'diproses' ? 'DIPROSES' :
                                          req.status === 'disetujui' ? 'DISETUJUI' : 'DITOLAK'}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-xs text-gray-500">
                                    {new Date(req.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {req.status === 'diajukan' && (
                                      <div className="flex justify-end gap-2 flex-wrap">
                                        <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] sm:text-xs border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => handleUpdateWithdrawStatus(req.id, 'diproses', 'Sedang diproses oleh admin')}>Proses</Button>
                                        <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] sm:text-xs border-red-200 text-red-700 hover:bg-red-50" onClick={() => handleUpdateWithdrawStatus(req.id, 'ditolak', 'Penarikan ditolak')}>Tolak</Button>
                                      </div>
                                    )}
                                    {req.status === 'diproses' && (
                                      <div className="flex justify-end gap-2 flex-wrap">
                                        <Button size="sm" className="h-7 px-2 text-[10px] sm:text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => { setWithdrawToApprove(req); setIsWithdrawApproveOpen(true); }}>Setujui</Button>
                                        <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] sm:text-xs border-red-200 text-red-700 hover:bg-red-50" onClick={() => handleUpdateWithdrawStatus(req.id, 'ditolak', 'Penarikan ditolak')}>Tolak</Button>
                                      </div>
                                    )}
                                    {req.status === 'disetujui' && req.proof_image && (
                                      <div className="flex justify-end">
                                        <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] sm:text-xs border-blue-200 text-blue-700 hover:bg-blue-50 flex items-center justify-center gap-1" onClick={() => setPreviewImageUrl(req.proof_image)}>
                                          Lihat Bukti
                                        </Button>
                                      </div>
                                    )}
                                  </TableCell>
                                </TableRow>
                              </React.Fragment>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* View Mobile (Cards) */}
                    <div className="grid grid-cols-1 gap-3 md:hidden p-1">
                      {withdrawRequests.map(req => {
                        const memberInfo = req.members || members.find(m => m.id === req.member_id) || { name: 'Unknown', bank_name: '', account_number: '' };
                        return (
                          <div key={req.id} className="bg-white border rounded-lg p-3 shadow-sm flex flex-col gap-2">
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <p className="font-bold text-gray-900 text-sm leading-tight">{memberInfo.name}</p>
                                <p className="text-[10px] sm:text-xs font-normal text-gray-500 mt-0.5">{memberInfo.bank_name || '-'} | {memberInfo.account_number || '-'}</p>
                                <p className="text-sm font-bold text-red-700 mt-1.5">Rp {Number(req.amount).toLocaleString("id-ID")}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-[10px] font-bold shrink-0 ${req.status === 'diajukan' ? 'bg-yellow-100 text-yellow-800' :
                                  req.status === 'diproses' ? 'bg-blue-100 text-blue-800' :
                                    req.status === 'disetujui' ? 'bg-green-100 text-green-800' :
                                      'bg-red-100 text-red-800'
                                }`}>
                                {req.status === 'diajukan' ? 'DIAJUKAN' :
                                  req.status === 'diproses' ? 'DIPROSES' :
                                    req.status === 'disetujui' ? 'DISETUJUI' : 'DITOLAK'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[10px] text-gray-400 font-medium">
                                {new Date(req.created_at).toLocaleDateString("id-ID", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {req.status === 'disetujui' && req.proof_image && (
                                <button type="button" onClick={() => setPreviewImageUrl(req.proof_image!)} className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer bg-blue-50 px-2 py-1 rounded border border-blue-100">
                                  Lihat Bukti
                                </button>
                              )}
                            </div>

                            {(req.status === 'diajukan' || req.status === 'diproses') && (
                              <div className="flex justify-end gap-2 border-t border-gray-50 pt-2 mt-1">
                                {req.status === 'diajukan' && (
                                  <>
                                    <Button size="sm" variant="outline" className="h-7 px-3 text-xs border-red-200 text-red-700 hover:bg-red-50 flex-1" onClick={() => handleUpdateWithdrawStatus(req.id, 'ditolak', 'Penarikan ditolak')}>Tolak</Button>
                                    <Button size="sm" variant="outline" className="h-7 px-3 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 flex-1" onClick={() => handleUpdateWithdrawStatus(req.id, 'diproses', 'Sedang diproses oleh admin')}>Proses</Button>
                                  </>
                                )}
                                {req.status === 'diproses' && (
                                  <>
                                    <Button size="sm" variant="outline" className="h-7 px-3 text-xs border-red-200 text-red-700 hover:bg-red-50 flex-1" onClick={() => handleUpdateWithdrawStatus(req.id, 'ditolak', 'Penarikan ditolak')}>Tolak</Button>
                                    <Button size="sm" className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700 text-white flex-1" onClick={() => { setWithdrawToApprove(req); setIsWithdrawApproveOpen(true); }}>Setujui</Button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Dialog open={isWithdrawApproveOpen} onOpenChange={setIsWithdrawApproveOpen}>
              <DialogContent className="sm:max-w-md w-[95vw] p-4 sm:p-6 rounded-xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <DialogHeader className="mb-2 sm:mb-4">
                  <DialogTitle className="text-lg sm:text-xl font-bold text-gray-800">Setujui Pencairan</DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm text-gray-500">
                    Unggah bukti transfer pencairan Anda ke rekening anggota.
                  </DialogDescription>
                </DialogHeader>
                {withdrawToApprove && (
                  <form onSubmit={handleApproveWithdrawRequest} className="space-y-4">
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
                      <h4 className="text-xs font-semibold text-blue-800 mb-1">Informasi Transfer</h4>
                      {(() => {
                        const m = members.find(mbr => mbr.id === withdrawToApprove.member_id);
                        return (
                          <>
                            <p className="text-sm font-bold text-gray-900">{m?.account_name ? `a.n ${m.account_name}` : m?.name}</p>
                            <p className="text-xs text-blue-700 font-mono mt-1">{m?.bank_name} - {m?.account_number}</p>
                            <p className="text-sm font-bold mt-2 text-red-700">Rp {Number(withdrawToApprove.amount).toLocaleString("id-ID")}</p>
                          </>
                        );
                      })()}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm">Bukti Transfer Pencairan (Wajib)</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleWithdrawApproveFileChange}
                        required
                        className="file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      />
                      {withdrawProofPreview && (
                        <div className="mt-2 border rounded-lg p-2 max-w-xs bg-gray-50">
                          <p className="text-xs text-gray-500 mb-2">Preview Gambar:</p>
                          <img src={withdrawProofPreview} alt="Preview Bukti" className="w-full h-auto max-h-48 object-contain rounded" />
                        </div>
                      )}
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                      <Button type="button" variant="outline" onClick={() => setIsWithdrawApproveOpen(false)} className="text-xs sm:text-sm w-full sm:w-auto">
                        Batal
                      </Button>
                      <Button type="submit" disabled={isSubmittingApprove} className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm w-full sm:w-auto">
                        {isSubmittingApprove ? "Menyimpan..." : "Kirim Persetujuan"}
                      </Button>
                    </DialogFooter>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="settings" className="space-y-3 sm:space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Informasi Rekening Admin</h3>
              <p className="text-xs text-gray-500 mt-1">Daftar rekening bank admin untuk menerima setoran tabungan dari anggota.</p>
            </div>

            <Card className="bg-white border-red-100/50 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <form
                  onSubmit={(e) => {
                    const form = e.target as any;
                    handleAddAdminAccount(e, {
                      bank_name: form.bank_name.value,
                      account_number: form.account_number.value,
                      account_name: form.account_name.value
                    });
                    form.reset();
                  }}
                  className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-lg border border-gray-100"
                >
                  <div className="space-y-1">
                    <Label className="text-xs">Nama Bank</Label>
                    <Input name="bank_name" placeholder="BCA / DANA" required className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">No. Rekening</Label>
                    <Input name="account_number" placeholder="0812..." required className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Nama Pemilik</Label>
                    <Input name="account_name" placeholder="A.n Admin" required className="h-8 text-sm" />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" className="w-full h-8 text-xs bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 text-white">Tambah</Button>
                  </div>
                </form>

                <div className="space-y-2">
                  {adminAccounts.map((acc) => (
                    <div key={acc.id} className="p-3 border rounded-lg flex justify-between items-center bg-white">
                      <div>
                        <p className="font-semibold text-sm">{acc.bank_name}</p>
                        <p className="text-xs text-gray-600">{acc.account_number} a.n {acc.account_name}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteAdminAccount(acc.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {adminAccounts.length === 0 && <p className="text-center text-xs text-gray-500 py-4">Belum ada rekening admin ditambahkan</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md mx-3">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              {deleteConfirm?.type === 'member'
                ? 'Menghapus anggota akan menghapus semua transaksi tabungan terkait. Apakah Anda yakin?'
                : 'Apakah Anda yakin ingin menghapus transaksi ini?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="text-xs sm:text-sm w-full sm:w-auto m-0">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 text-white text-xs sm:text-sm w-full sm:w-auto m-0"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MemberFormDialog
        open={memberDialogOpen}
        onOpenChange={setMemberDialogOpen}
        member={editingMember}
        onSave={handleSaveMember}
      />

      <Dialog open={isEditMemberOpen} onOpenChange={setIsEditMemberOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-2xl mx-3 p-0 max-h-[85vh] flex flex-col overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100 flex-shrink-0">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Edit Data Anggota</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Ubah data anggota yang sudah terdaftar
              </DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={handleUpdateMember} className="flex flex-col flex-1 overflow-hidden min-h-0">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

                {/* Kiri: Data Anggota */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">Data Anggota</h3>
                  <div className="space-y-2">
                    <Label htmlFor="edit-name" className="text-xs sm:text-sm">Nama Lengkap *</Label>
                    <Input
                      id="edit-name"
                      placeholder="Nama lengkap"
                      value={memberToEdit.name}
                      onChange={(e) => setMemberToEdit({ ...memberToEdit, name: e.target.value })}
                      required
                      className="text-xs sm:text-sm rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone" className="text-xs sm:text-sm">Nomor Telepon *</Label>
                    <Input
                      id="edit-phone"
                      type="tel"
                      placeholder="081234567890"
                      value={memberToEdit.phone}
                      onChange={(e) => setMemberToEdit({ ...memberToEdit, phone: e.target.value.replace(/\D/g, '') })}
                      required
                      maxLength={13}
                      className="text-xs sm:text-sm rounded-lg"
                    />
                    <p className="text-xs text-gray-500">10-13 digit angka</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-join_date" className="text-xs sm:text-sm">Tanggal Bergabung *</Label>
                    <Input
                      id="edit-join_date"
                      type="date"
                      value={memberToEdit.join_date}
                      onChange={(e) => setMemberToEdit({ ...memberToEdit, join_date: e.target.value })}
                      required
                      max={new Date().toISOString().split('T')[0]}
                      className="text-xs sm:text-sm rounded-lg"
                    />
                  </div>
                </div>

                {/* Kanan: Informasi Rekening */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">Informasi Rekening</h3>
                  <div className="space-y-2">
                    <Label htmlFor="edit-category" className="text-xs sm:text-sm">Kategori</Label>
                    <select
                      id="edit-category"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-xs sm:text-sm rounded-lg"
                      value={(uniqueCategories.includes(memberToEdit.category || "") || !(memberToEdit.category) ? (memberToEdit.category || "") : "Lainnya")}
                      onChange={e => {
                        if (e.target.value === "Lainnya") {
                          setMemberToEdit({ ...memberToEdit, category: "Lainnya_temp" });
                        } else {
                          setMemberToEdit({ ...memberToEdit, category: e.target.value });
                        }
                      }}
                    >
                      <option value="" disabled>Pilih Kategori... (Opsional)</option>
                      {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      <option value="Lainnya">Lainnya...</option>
                    </select>
                    {(!(uniqueCategories.includes(memberToEdit.category || "")) && memberToEdit.category !== "") && (
                      <Input
                        className="mt-2 text-xs sm:text-sm rounded-lg"
                        placeholder="Ketik kategori baru..."
                        value={memberToEdit.category === "Lainnya_temp" ? "" : memberToEdit.category}
                        onChange={e => setMemberToEdit({ ...memberToEdit, category: e.target.value })}
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-account_name" className="text-xs sm:text-sm">Nama Pemilik Rekening</Label>
                    <Input
                      id="edit-account_name"
                      placeholder="Contoh: A.n Rekening"
                      value={memberToEdit.account_name || ""}
                      onChange={(e) => setMemberToEdit({ ...memberToEdit, account_name: e.target.value })}
                      className="text-xs sm:text-sm rounded-lg"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-bank_name" className="text-xs sm:text-sm">Nama Bank</Label>
                    <select
                      id="edit-bank_name"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-xs sm:text-sm rounded-lg"
                      value={(["", "BCA", "BRI", "BNI", "Mandiri", "BTN", "CIMB Niaga", "Danamon", "Permata", "DANA", "OVO", "GoPay", "ShopeePay"].includes(memberToEdit.bank_name || "") ? (memberToEdit.bank_name || "") : "Lainnya")}
                      onChange={e => {
                        if (e.target.value === "Lainnya") {
                          setMemberToEdit({ ...memberToEdit, bank_name: "Lainnya_temp" });
                        } else {
                          setMemberToEdit({ ...memberToEdit, bank_name: e.target.value });
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
                        className="mt-2 text-xs sm:text-sm rounded-lg"
                        placeholder="Ketik nama bank..."
                        value={memberToEdit.bank_name === "Lainnya_temp" ? "" : memberToEdit.bank_name}
                        onChange={e => setMemberToEdit({ ...memberToEdit, bank_name: e.target.value })}
                        required
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-account_number" className="text-xs sm:text-sm">No. Rekening / No. HP eWallet</Label>
                    <Input
                      id="edit-account_number"
                      placeholder="Contoh: 12345678"
                      value={memberToEdit.account_number || ""}
                      onChange={(e) => setMemberToEdit({ ...memberToEdit, account_number: e.target.value })}
                      className="text-xs sm:text-sm rounded-lg"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-5 border-t bg-gray-50 flex flex-col sm:flex-row justify-end gap-2 flex-shrink-0">
              <Button type="button" variant="outline" onClick={() => setIsEditMemberOpen(false)} className="text-xs sm:text-sm w-full sm:w-auto">
                Batal
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 text-xs sm:text-sm w-full sm:w-auto">
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <SavingsFormDialog
        open={savingsDialogOpen}
        onOpenChange={setSavingsDialogOpen}
        transactions={editingSavings}
        members={members}
        onSave={handleSaveSavings}
      />

      {/* Member Detail Dialog */}
      <Dialog open={selectedMemberDetail !== null} onOpenChange={() => setSelectedMemberDetail(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl mx-3 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Riwayat Transaksi Tabungan</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Detail tabungan {selectedMemberDetail?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedMemberDetail && (
            <div className="space-y-4">
              {/* Member Info Card */}
              <Card className="bg-gradient-to-br from-red-50 to-white border-red-100">
                <CardContent className="pt-4 sm:pt-6">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Nama Anggota</p>
                      <p className="text-sm sm:text-base font-semibold text-red-900">{selectedMemberDetail.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Nomor Telepon</p>
                      <p className="text-sm sm:text-base font-medium">{selectedMemberDetail.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Bergabung Sejak</p>
                      <p className="text-sm sm:text-base font-medium">
                        {new Date(selectedMemberDetail.join_date).toLocaleDateString("id-ID", {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Total Tabungan</p>
                      <p className="text-sm sm:text-base font-bold text-red-800">
                        Rp {transactions
                          .filter((s) => s.member_id === selectedMemberDetail.id)
                          .reduce((sum, s) => {
                            if (s.type === "withdrawal") {
                              return sum - s.amount;
                            }
                            return sum + s.amount;
                          }, 0)
                          .toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transaction History */}
              <div className="space-y-3">
                <h3 className="text-sm sm:text-base font-semibold text-gray-700">
                  Riwayat Transaksi ({transactions.filter((s) => s.member_id === selectedMemberDetail.id).length})
                </h3>

                {transactions.filter((s) => s.member_id === selectedMemberDetail.id).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">Belum ada transaksi tabungan</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {transactions
                      .filter((s) => s.member_id === selectedMemberDetail.id)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-xs sm:text-sm text-gray-900">{transaction.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(transaction.created_at || transaction.date).toLocaleString("id-ID", {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="text-right ml-3">
                            <p className={`font-bold text-sm sm:text-base ${transaction.type === "withdrawal" ? "text-red-600" : "text-green-600"
                              }`}>
                              {transaction.type === "withdrawal" ? "- " : "+ "}
                              Rp {transaction.amount.toLocaleString("id-ID")}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setSelectedMemberDetail(null)}
              className="bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 text-xs sm:text-sm w-full sm:w-auto"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
