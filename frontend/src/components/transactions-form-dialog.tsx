import { useEffect, useState } from "react";
import { Member, Transaction } from "../pages/admin-dashboard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface SavingsFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: Transaction | null;
  members: Member[];
  onSave: (transactions: Transaction) => void;
}

export default function SavingsFormDialog({
  open,
  onOpenChange,
  transactions,
  members,
  onSave,
}: SavingsFormDialogProps) {
  const [formData, setFormData] = useState<Transaction>({
    id: "",
    member_id: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  useEffect(() => {
    if (transactions) {
      setFormData(transactions);
    } else {
      setFormData({
        id: "",
        member_id: members.length > 0 ? members[0].id : "",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        description: "",
      });
    }
  }, [transactions, open, members]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {transactions ? "Edit Transaksi Tabungan" : "Tambah Transaksi Tabungan"}
          </DialogTitle>
          <DialogDescription>
            {transactions
              ? "Ubah informasi transaksi di bawah ini"
              : "Masukkan informasi transaksi tabungan baru"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="member_id">Nama Anggota</Label>
              <Select
                value={formData.member_id}
                onValueChange={(value) => setFormData({ ...formData, member_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih anggota" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah (Rp)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="1000"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Tanggal</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Keterangan</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Contoh: Tabungan rutin bulan Maret"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit">Simpan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
