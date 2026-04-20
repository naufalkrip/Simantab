import { supabase } from "./supabaseClient";
import { Member, Transaction, WithdrawRequest, DepositRequest, AdminAccount } from "../types";

export const memberService = {
  getMemberTransactions: async (member_id: string) => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("member_id", member_id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Transaction[];
    } catch (error: any) {
      throw new Error(`Gagal mengambil transaksi: ${error.message}`);
    }
  },

  getAllTransactions: async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Transaction[];
    } catch (error: any) {
      throw new Error(`Gagal mengambil semua transaksi: ${error.message}`);
    }
  },

  getAllMembers: async () => {
    try {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Member[];
    } catch (error: any) {
      throw new Error(`Gagal mengambil data member: ${error.message}`);
    }
  },

  getWithdrawRequests: async (member_id: string) => {
    try {
      const { data, error } = await supabase
        .from("withdraw_requests")
        .select("*")
        .eq("member_id", member_id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as WithdrawRequest[];
    } catch (error: any) {
      throw new Error(`Gagal mengambil riwayat penarikan: ${error.message}`);
    }
  },

  getDepositRequests: async (member_id: string) => {
    try {
      const { data, error } = await supabase
        .from("deposit_requests")
        .select("*")
        .eq("member_id", member_id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as DepositRequest[];
    } catch (error: any) {
      throw new Error(`Gagal mengambil riwayat setoran: ${error.message}`);
    }
  },

  getAdminAccounts: async () => {
    try {
      const { data, error } = await supabase
        .from("admin_accounts")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as AdminAccount[];
    } catch (error: any) {
      throw new Error(`Gagal mengambil informasi rekening admin: ${error.message}`);
    }
  },

  updateProfile: async (member_id: string, memberData: Partial<Member>) => {
    try {
      const { data, error } = await supabase
        .from("members")
        .update(memberData)
        .eq("id", member_id)
        .select();
      
      if (error) throw error;
      return data[0] as Member;
    } catch (error: any) {
      throw new Error(`Gagal memperbarui profil: ${error.message}`);
    }
  },

  createWithdrawRequest: async (member_id: string, amount: number) => {
    try {
      const { data, error } = await supabase
        .from("withdraw_requests")
        .insert({ member_id: member_id, amount, status: "diajukan" })
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error: any) {
      throw new Error(`Gagal membuat request penarikan: ${error.message}`);
    }
  },

  cancelWithdrawRequest: async (id: string) => {
    try {
      const { error } = await supabase
        .from("withdraw_requests")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      return true;
    } catch (error: any) {
      throw new Error(`Gagal membatalkan request: ${error.message}`);
    }
  },

  createDepositRequest: async (member_id: string, amount: number, proofFile: File) => {
    try {
      // 1. Upload proof to Supabase Storage
      const fileExt = proofFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${member_id}/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('proofs')
        .upload(filePath, proofFile);
        
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
      
      // 2. Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from('proofs')
        .getPublicUrl(filePath);
        
      // 3. Create Deposit Request record
      const { data, error } = await supabase
        .from("deposit_requests")
        .insert({ 
          member_id: member_id, 
          amount, 
          proof_image: publicUrlData.publicUrl,
          status: "dikirim" 
        })
        .select();
        
      if (error) throw error;
      return data[0];
    } catch (e: any) {
      throw new Error(e.message || "Gagal mengirim bukti transfer");
    }
  }
};
