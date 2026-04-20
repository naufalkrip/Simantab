import { useState } from "react";
import { Member, Transaction } from "../pages/admin-dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { ChevronRight, Wallet, TrendingUp, Calendar } from "lucide-react";
import MemberSavingsDetail from "./member-transactions-detail";

interface MemberSavingsListProps {
  members: Member[];
  transactions: Transaction[];
  onEdit: (transactions: Transaction) => void;
  onDelete: (id: string) => void;
}

export default function MemberSavingsList({
  members,
  transactions,
  onEdit,
  onDelete,
}: MemberSavingsListProps) {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const getMemberStats = (member_id: string) => {
    const memberSavings = transactions.filter((s) => s.member_id === member_id);
    const total = memberSavings.reduce((sum, s) => sum + s.amount, 0);
    const count = memberSavings.length;
    const lastSaving = memberSavings.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];

    return { total, count, lastSaving };
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Belum ada data anggota. Tambahkan anggota terlebih dahulu.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => {
          const stats = getMemberStats(member.id);
          
          return (
            <Card
              key={member.id}
              className="hover:shadow-lg transition-shadow cursor-pointer bg-white hover:border-red-800"
              onClick={() => setSelectedMember(member)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                    <CardDescription>{member.phone}</CardDescription>
                  </div>
                  <ChevronRight className="w-5 h-5 text-red-800" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Wallet className="w-4 h-4 text-red-800" />
                    <span>Total Tabungan</span>
                  </div>
                  <span className="font-bold text-red-800">
                    Rp {stats.total.toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <TrendingUp className="w-4 h-4 text-red-800" />
                    <span>Jumlah Transaksi</span>
                  </div>
                  <span className="font-semibold">{stats.count}x</span>
                </div>

                {stats.lastSaving && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-red-800" />
                      <span>Terakhir</span>
                    </div>
                    <span className="text-sm font-medium">
                      {new Date(stats.lastSaving.created_at || stats.lastSaving.date).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                )}

                {stats.count === 0 && (
                  <p className="text-sm text-gray-400 text-center py-2">
                    Belum ada transaksi
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedMember && (
        <MemberSavingsDetail
          member={selectedMember}
          transactions={transactions.filter((s) => s.member_id === selectedMember.id)}
          onClose={() => setSelectedMember(null)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </>
  );
}