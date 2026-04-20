export interface Transaction {
  id: string;
  member_id: string;
  amount: number;
  date: string;
  description: string;
  type: "deposit" | "withdrawal";
  created_at?: string;
  proof_url?: string;
}
