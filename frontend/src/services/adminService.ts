import { supabase } from "./supabaseClient";
import { Member, Transaction, WithdrawRequest, DepositRequest, AdminAccount } from "../types";

export const adminService = {
  getMembers: async () => {
    try {
      const { data, error } = await supabase.from("members").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Member[];
    } catch (error: any) {
      throw new Error(`Gagal mengambil data anggota: ${error.message}`);
    }
  },

  getTransactions: async () => {
    try {
      const { data, error } = await supabase.from("transactions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Transaction[];
    } catch (error: any) {
      throw new Error(`Gagal mengambil data transaksi: ${error.message}`);
    }
  },

  getWithdrawRequests: async () => {
    try {
      const { data, error } = await supabase.from("withdraw_requests").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as WithdrawRequest[];
    } catch (error: any) {
      throw new Error(`Gagal mengambil request penarikan: ${error.message}`);
    }
  },

  getDepositRequests: async () => {
    try {
      const { data, error } = await supabase.from("deposit_requests").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as DepositRequest[];
    } catch (error: any) {
      throw new Error(`Gagal mengambil request setoran: ${error.message}`);
    }
  },

  getAdminAccounts: async () => {
    try {
      const { data, error } = await supabase.from("admin_accounts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as AdminAccount[];
    } catch (error: any) {
      throw new Error(`Gagal mengambil akun admin: ${error.message}`);
    }
  },

  /* Update Requests */
  updateWithdrawRequest: async (id: string, status: string, note: string, proof_image?: string) => {
    try {
      const updateData: any = { status, note, updated_at: new Date().toISOString() };
      if (proof_image) updateData.proof_image = proof_image;
      
      const { data, error } = await supabase.from("withdraw_requests").update(updateData).eq("id", id).select();
      if (error) throw error;
      return data[0];
    } catch (error: any) {
      throw new Error(`Gagal update penarikan: ${error.message}`);
    }
  },

  updateDepositRequest: async (id: string, status: string, note: string) => {
    try {
      const { data, error } = await supabase.from("deposit_requests").update({ status, note, updated_at: new Date().toISOString() }).eq("id", id).select();
      if (error) throw error;
      return data[0];
    } catch (error: any) {
      throw new Error(`Gagal update setoran: ${error.message}`);
    }
  },

  /* Admin Accounts CRUD */
  addAdminAccount: async (account: Partial<AdminAccount>) => {
    try {
      const payload = { ...account };
      if (!payload.id) payload.id = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
      
      const { data, error } = await supabase.from("admin_accounts").insert(payload).select();
      if (error) throw error;
      return data[0];
    } catch (error: any) {
      throw new Error(`Gagal menambah akun admin: ${error.message}`);
    }
  },

  deleteAdminAccount: async (id: string) => {
    try {
      const { error } = await supabase.from("admin_accounts").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (error: any) {
      throw new Error(`Gagal menghapus akun admin: ${error.message}`);
    }
  },

  /* Members CRUD */
  addMember: async (member: Partial<Member>) => {
    try {
      const payload = { ...member };
      if (!payload.id) payload.id = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
      
      const { data, error } = await supabase.from("members").insert(payload).select();
      if (error) throw error;
      return data[0];
    } catch (error: any) {
      throw new Error(`Gagal menambah anggota: ${error.message}`);
    }
  },

  updateMember: async (id: string, member: Partial<Member>) => {
    try {
      const { data, error } = await supabase.from("members").update(member).eq("id", id).select();
      if (error) throw error;
      return data[0];
    } catch (error: any) {
      throw new Error(`Gagal update anggota: ${error.message}`);
    }
  },

  deleteMember: async (id: string) => {
    try {
      const { error } = await supabase.from("members").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (error: any) {
      throw new Error(`Gagal menghapus anggota: ${error.message}`);
    }
  },

  /* Transactions CRUD */
  addTransaction: async (transaction: Partial<Transaction>) => {
    try {
      const payload = { ...transaction };
      if (!payload.id) payload.id = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
      
      const { data, error } = await supabase.from("transactions").insert(payload).select();
      if (error) throw error;
      return data[0];
    } catch (error: any) {
      throw new Error(`Gagal menambah transaksi: ${error.message}`);
    }
  },

  deleteTransaction: async (id: string) => {
    try {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (error: any) {
      throw new Error(`Gagal menghapus transaksi: ${error.message}`);
    }
  },

  /* Storage */
  uploadProofImage: async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `withdraws/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('proofs')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: urlData } = supabase.storage
        .from('proofs')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error: any) {
      throw new Error(`Gagal mengunggah bukti: ${error.message}`);
    }
  }
};
