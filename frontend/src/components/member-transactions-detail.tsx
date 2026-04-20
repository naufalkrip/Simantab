import { Member, Transaction } from "../pages/admin-dashboard";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { Button } from "./ui/button";
import { Pencil, Trash2, Wallet, TrendingUp, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent } from "./ui/card";

interface MemberSavingsDetailProps {
  member: Member;
  transactions: Transaction[];
  onClose: () => void;
  onEdit: (transactions: Transaction) => void;
  onDelete: (id: string) => void;
}

export default function MemberSavingsDetail({
  member,
  transactions,
  onClose,
  onEdit,
  onDelete,
}: MemberSavingsDetailProps) {
  const totalSavings = transactions.reduce((sum, s) => sum + s.amount, 0);
  const sortedSavings = transactions.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleEdit = (transaction: Transaction) => {
    onEdit(transaction);
    onClose();
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
      onDelete(id);
    }
  };

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{member.name}</SheetTitle>
          <SheetDescription>Riwayat transaksi tabungan</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Member Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Telepon:</span>
                  <span className="font-medium">{member.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Bergabung:</span>
                  <span className="font-medium">
                    {new Date(member.join_date).toLocaleDateString("id-ID")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <Wallet className="w-5 h-5 text-red-800" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Tabungan</p>
                    <p className="text-xl font-bold text-red-800">
                      Rp {totalSavings.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-red-800" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Transaksi</p>
                    <p className="text-xl font-bold">{transactions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction History */}
          <div>
            <h3 className="font-semibold mb-4">Riwayat Transaksi</h3>
            
            {sortedSavings.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-gray-500">Belum ada transaksi tabungan</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {sortedSavings.map((transaction) => (
                  <Card key={transaction.id} className="hover:shadow-md transition-shadow hover:border-red-800">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CalendarIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {new Date(transaction.created_at || transaction.date).toLocaleString("id-ID", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{transaction.description}</p>
                          <p className="text-xl font-bold text-red-800">
                            + Rp {transaction.amount.toLocaleString("id-ID")}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(transaction)}
                            className="hover:bg-red-50"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(transaction.id)}
                            className="hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 text-red-700" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}