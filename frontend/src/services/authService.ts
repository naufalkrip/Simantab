import { supabase } from "./supabaseClient";

export const authService = {
  /**
   * Login as Admin
   */
  loginAdmin: async (username: string, password: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .single();

      if (error || !data) {
        throw new Error("Username atau password salah");
      }

      // Mark admin as logged in locally
      localStorage.setItem("adminLoggedIn", "true");
      return data;
    } catch (error: any) {
      console.error("Admin Login Error:", error);
      throw new Error(error.message || "Terjadi kesalahan saat login");
    }
  },

  /**
   * Logout Admin
   */
  logoutAdmin: () => {
    localStorage.removeItem("adminLoggedIn");
  },

  /**
   * Check if admin is logged in
   */
  isAdminLoggedIn: () => {
    return localStorage.getItem("adminLoggedIn") === "true";
  },

  /**
   * Login as Member
   */
  memberLogin: async (phone: string) => {
    try {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("phone", phone)
        .single();

      if (error || !data) {
        throw new Error("Nomor telepon tidak ditemukan");
      }

      return data;
    } catch (error: any) {
      console.error("Member Login Error:", error);
      throw new Error(error.message || "Terjadi kesalahan saat login");
    }
  }
};
