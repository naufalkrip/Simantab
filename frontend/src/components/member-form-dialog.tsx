import { useEffect, useState } from "react";
import { Member } from "../pages/admin-dashboard";
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

interface MemberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
  onSave: (member: Member) => void;
}

export default function MemberFormDialog({
  open,
  onOpenChange,
  member,
  onSave,
}: MemberFormDialogProps) {
  const [formData, setFormData] = useState<Member>({
    id: "",
    name: "",
    phone: "",
    join_date: new Date().toISOString().split("T")[0],
    account_name: "",
    bank_name: "",
    account_number: "",
  });

  useEffect(() => {
    if (member) {
      setFormData(member);
    } else {
        setFormData({
          id: "",
          name: "",
          phone: "",
          join_date: new Date().toISOString().split("T")[0],
          account_name: "",
          bank_name: "",
          account_number: "",
        });
    }
  }, [member, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{member ? "Edit Anggota" : "Tambah Anggota Baru"}</DialogTitle>
          <DialogDescription>
            {member
              ? "Ubah informasi anggota di bawah ini"
              : "Masukkan informasi anggota baru"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Nomor Telepon</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="join_date">Tanggal Bergabung</Label>
              <Input
                id="join_date"
                type="date"
                value={formData.join_date}
                onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_name">Nama Pemilik Rekening (Opsional)</Label>
              <Input
                id="account_name"
                type="text"
                placeholder="Contoh: A.N Rekening"
                value={formData.account_name || ""}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_name">Nama Bank (Opsional)</Label>
              <Input
                id="bank_name"
                type="text"
                placeholder="Contoh: BCA / DANA"
                value={formData.bank_name || ""}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_number">Nomor Rekening / DANA (Opsional)</Label>
              <Input
                id="account_number"
                type="text"
                placeholder="081234xxx"
                value={formData.account_number || ""}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
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