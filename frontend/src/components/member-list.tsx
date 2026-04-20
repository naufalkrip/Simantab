import { Member } from "../pages/admin-dashboard";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Pencil, Trash2, User } from "lucide-react";

interface MemberListProps {
  members: Member[];
  onEdit: (member: Member) => void;
  onDelete: (id: string) => void;
}

export default function MemberList({ members, onEdit, onDelete }: MemberListProps) {
  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Belum ada data anggota. Klik tombol "Tambah Anggota" untuk memulai.
      </div>
    );
  }

  const formatRekening = (member: Member) => {
    if (!member.bank_name || !member.account_number) return <span className="text-gray-500 italic">Belum diisi</span>;
    
    return (
      <div className="flex flex-col gap-1.5 items-start py-1 min-w-[160px]">
        <span className="font-semibold text-gray-900 text-sm tracking-wide uppercase">{member.account_name || member.name}</span>
        <span className="bg-slate-100 text-slate-700 border border-slate-200 text-xs px-2 py-0.5 rounded-md font-medium tracking-wide">
          {member.bank_name}
        </span>
        <span className="text-gray-800 text-sm font-medium tracking-wider">{member.account_number}</span>
      </div>
    );
  };

  const formatRekeningMobile = (member: Member) => {
    if (!member.bank_name || !member.account_number) return <span className="text-gray-500 italic text-xs">Belum diisi</span>;
    
    return (
      <div className="flex flex-col gap-1 items-end">
        <div className="flex items-center gap-1.5">
          <span className="bg-slate-200 text-slate-800 text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wide">
            {member.bank_name}
          </span>
          <span className="text-gray-800 text-xs font-bold font-mono tracking-wider">{member.account_number}</span>
        </div>
        <span className="text-gray-500 text-[10px] font-medium uppercase truncate max-w-[150px]">{member.account_name || member.name}</span>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="rounded-lg md:border bg-white overflow-hidden">
      {/* View Desktop */}
      <div className="overflow-x-auto hidden md:block">
        <Table>
          <TableHeader className="bg-gray-100/80">
            <TableRow>
              <TableHead className="font-semibold text-gray-700">Nama</TableHead>
              <TableHead className="font-semibold text-gray-700">No HP</TableHead>
              <TableHead className="font-semibold text-gray-700">Rekening / DANA</TableHead>
              <TableHead className="font-semibold text-gray-700">Tanggal Bergabung</TableHead>
              <TableHead className="text-right font-semibold text-gray-700">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id} className="hover:bg-gray-50 transition-colors">
                <TableCell className="font-bold text-gray-900">
                  <div className="flex items-center gap-2">
                    {member.name}
                    {member.category && (
                      <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-semibold border border-blue-100">
                        {member.category}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-gray-600">{member.phone}</TableCell>
                <TableCell>{formatRekening(member)}</TableCell>
                <TableCell className="text-gray-600">
                  {formatDate(member.join_date)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 hover:bg-blue-50 hover:text-blue-700 border-blue-200 text-blue-600 shadow-sm"
                      onClick={() => onEdit(member)}
                    >
                      <Pencil className="w-4 h-4" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 hover:bg-red-50 hover:text-red-700 border-red-200 text-red-600 shadow-sm"
                      onClick={() => onDelete(member.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Hapus</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* View Mobile */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {members.map((member) => (
          <div key={member.id} className="bg-white border rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:border-red-200 transition-colors">
            <div className="flex items-start gap-3">
              <div className="bg-gradient-to-br from-red-50 to-red-100 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-red-100">
                <User className="w-5 h-5 text-red-700" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between flex-wrap gap-1">
                  <p className="font-bold text-gray-900 text-base leading-tight">{member.name}</p>
                  {member.category && (
                    <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-semibold border border-blue-100 mt-0.5 leading-none shrink-0 whitespace-nowrap">
                      {member.category}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1 font-medium tracking-wide">{member.phone}</p>
              </div>
            </div>
            
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center">
              <span className="text-slate-500 text-xs font-medium">Rekening:</span>
              <div className="text-right">
                {formatRekeningMobile(member)}
              </div>
            </div>

            <div className="flex justify-between items-center mt-1 pt-3 border-t border-gray-100">
              <span className="text-[11px] text-gray-400 font-medium">Join: <span className="text-gray-600">{formatDate(member.join_date)}</span></span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-blue-600 border-blue-200 hover:bg-blue-50 shadow-sm rounded-lg"
                  onClick={() => onEdit(member)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50 shadow-sm rounded-lg"
                  onClick={() => onDelete(member.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}