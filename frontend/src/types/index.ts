export type { User } from "./user";
export type { Member } from "./member";
export type { Transaction } from "./transaction";

export interface WithdrawRequest {
  id: string;
  member_id: string;
  amount: number;
  proof_image?: string;
  status: "diajukan" | "diproses" | "selesai" | "ditolak";
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface DepositRequest {
  id: string;
  member_id: string;
  amount: number;
  proof_image?: string;
  status: "dikirim" | "diproses" | "selesai" | "ditolak";
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  created_at: string;
}
