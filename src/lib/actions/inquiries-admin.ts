"use server";

import { createClient } from "@/lib/supabase/server";

export type Inquiry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  created_at: string;
};

export async function getInquiries(): Promise<Inquiry[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching inquiries:", error);
    return [];
  }

  return data || [];
}

export async function deleteInquiry(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("inquiries")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: "Failed to delete inquiry" };
  }

  return { success: true };
}
