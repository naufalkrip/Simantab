import { useState } from "react";
import { Member, Transaction } from "../pages/admin-dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Calendar, CheckCircle2, Save } from "lucide-react";
import { toast } from "sonner";

interface DailySavingsInputProps {
  members: Member[];
  transactions: Transaction[];
  onSave: (newSavings: Transaction[]) => void;
}

interface DailyInput {
  member_id: string;
  amount: string;
  saved: boolean;
}

export default function DailySavingsInput({ members, transactions, onSave }: DailySavingsInputProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [dailyInputs, setDailyInputs] = useState<Record<string, DailyInput>>(
    members.reduce((acc, member) => {
      acc[member.id] = { member_id: member.id, amount: "", saved: false };
      return acc;
    }, {} as Record<string, DailyInput>)
  );

  // Check if member already has transactions for selected date
  const hasSavingsForDate = (member_id: string, date: string) => {
    return transactions.some(
      (s) => s.member_id === member_id && s.date === date
    );
  };

  const handleAmountChange = (member_id: string, value: string) => {
    setDailyInputs({
      ...dailyInputs,
      [member_id]: { ...dailyInputs[member_id], amount: value },
    });
  };

  const handleSaveSingle = (member_id: string) => {
    const input = dailyInputs[member_id];
    const amount = parseInt(input.amount);

    if (!amount || amount <= 0) {
      toast.error("Masukkan nominal yang valid");
      return;
    }

    if (hasSavingsForDate(member_id, selectedDate)) {
      toast.error("Anggota ini sudah memiliki catatan tabungan untuk tanggal ini");
      return;
    }

    const member = members.find((m) => m.id === member_id);
    const newSaving: Transaction = {
      id: Date.now().toString() + member_id,
      member_id,
      amount,
      date: selectedDate,
      description: `Tabungan harian - ${new Date(selectedDate).toLocaleDateString("id-ID")}`,
    };

    onSave([newSaving]);

    setDailyInputs({
      ...dailyInputs,
      [member_id]: { member_id, amount: "", saved: true },
    });

    toast.success(`Tabungan ${member?.name} berhasil disimpan`);
  };

  const handleSaveAll = () => {
    const newSavingsList: Transaction[] = [];
    let savedCount = 0;
    let errorCount = 0;

    members.forEach((member) => {
      const input = dailyInputs[member.id];
      const amount = parseInt(input.amount);

      if (amount && amount > 0 && !hasSavingsForDate(member.id, selectedDate)) {
        newSavingsList.push({
          id: Date.now().toString() + member.id + Math.random(),
          member_id: member.id,
          amount,
          date: selectedDate,
          description: `Tabungan harian - ${new Date(selectedDate).toLocaleDateString("id-ID")}`,
        });
        savedCount++;
      } else if (amount && amount > 0 && hasSavingsForDate(member.id, selectedDate)) {
        errorCount++;
      }
    });

    if (newSavingsList.length === 0) {
      toast.error("Tidak ada data yang valid untuk disimpan");
      return;
    }

    onSave(newSavingsList);

    // Reset inputs for saved members
    const updatedInputs = { ...dailyInputs };
    newSavingsList.forEach((transaction) => {
      updatedInputs[transaction.member_id] = {
        member_id: transaction.member_id,
        amount: "",
        saved: true,
      };
    });
    setDailyInputs(updatedInputs);

    toast.success(`${savedCount} tabungan berhasil disimpan${errorCount > 0 ? `, ${errorCount} duplikat dilewati` : ""}`);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    // Reset saved status when date changes
    const resetInputs = { ...dailyInputs };
    Object.keys(resetInputs).forEach((key) => {
      resetInputs[key].saved = false;
    });
    setDailyInputs(resetInputs);
  };

  const getTotalForDate = () => {
    return Object.values(dailyInputs).reduce((sum, input) => {
      const amount = parseInt(input.amount) || 0;
      return sum + amount;
    }, 0);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pilih Tanggal</CardTitle>
              <CardDescription>Tentukan tanggal untuk input tabungan</CardDescription>
            </div>
            <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
              <Calendar className="w-5 h-5 text-red-800" />
              <span className="font-semibold text-red-900">
                {new Date(selectedDate).toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            <Button onClick={handleSaveAll} size="lg" className="gap-2 bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950">
              <Save className="w-4 h-4" />
              Simpan Semua
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Input Tabungan Harian</CardTitle>
              <CardDescription>
                Masukkan nominal tabungan untuk setiap anggota
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Hari Ini</p>
              <p className="text-2xl font-bold text-red-800">
                Rp {getTotalForDate().toLocaleString("id-ID")}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Belum ada data anggota. Tambahkan anggota terlebih dahulu.
              </p>
            ) : (
              members.map((member) => {
                const alreadySaved = hasSavingsForDate(member.id, selectedDate);
                const justSaved = dailyInputs[member.id]?.saved;

                return (
                  <div
                    key={member.id}
                    className={`flex items-center gap-4 p-4 border rounded-lg ${alreadySaved
                        ? "bg-red-50 border-red-300"
                        : justSaved
                          ? "bg-red-50 border-red-200"
                          : "bg-white"
                      }`}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.phone}</p>
                    </div>

                    {alreadySaved ? (
                      <div className="flex items-center gap-2 text-red-800">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">Sudah Menabung</span>
                      </div>
                    ) : justSaved ? (
                      <div className="flex items-center gap-2 text-red-800">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">Tersimpan</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-64">
                          <Input
                            type="number"
                            placeholder="Masukkan nominal"
                            value={dailyInputs[member.id]?.amount || ""}
                            onChange={(e) => handleAmountChange(member.id, e.target.value)}
                            min="0"
                            step="1000"
                          />
                        </div>
                        <Button
                          onClick={() => handleSaveSingle(member.id)}
                          disabled={
                            !dailyInputs[member.id]?.amount ||
                            parseInt(dailyInputs[member.id]?.amount) <= 0
                          }
                          className="bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950"
                        >
                          Simpan
                        </Button>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Tips Input Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-red-800">•</span>
              <span>Gunakan tombol <strong>"Simpan Semua"</strong> untuk menyimpan semua nominal sekaligus</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-800">•</span>
              <span>Atau simpan satu per satu dengan tombol <strong>"Simpan"</strong> di setiap baris</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-800">•</span>
              <span>Anggota yang sudah menabung di tanggal yang dipilih akan ditandai dengan warna merah muda</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-800">•</span>
              <span>Sistem akan mencegah duplikasi data untuk tanggal yang sama</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}