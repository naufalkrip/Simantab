import { Member, Transaction } from "../pages/admin-dashboard";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Pencil, Trash2 } from "lucide-react";

interface SavingsListProps {
  transactions: Transaction[];
  members: Member[];
  onEdit: (transactions: Transaction) => void;
  onDelete: (id: string) => void;
}

export default function SavingsList({ transactions, members, onEdit, onDelete }: SavingsListProps) {
  const getMemberName = (member_id: string) => {
    const member = members.find((m) => m.id === member_id);
    return member ? member.name : "Unknown";
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Belum ada data tabungan. Klik tombol "Tambah Tabungan" untuk memulai.
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Anggota</TableHead>
            <TableHead>Jumlah</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Keterangan</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">{getMemberName(transaction.member_id)}</TableCell>
                <TableCell className="text-green-600 font-semibold">
                  Rp {transaction.amount.toLocaleString("id-ID")}
                </TableCell>
                <TableCell>
                  {new Date(transaction.created_at || transaction.date).toLocaleString("id-ID", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(transaction)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(transaction.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}
