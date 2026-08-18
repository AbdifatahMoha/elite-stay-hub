import { getSupabase } from "@/lib/supabase";

export type ContactMessage = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  message: string;
  status: "NEW" | "READ" | "REPLIED" | "ARCHIVED";
  created_at: string;
};

export async function submitContactMessage(input: {
  full_name: string;
  email: string;
  phone?: string;
  message: string;
}) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("contact_messages")
    .insert({
      full_name: input.full_name.trim(),
      email: input.email.trim(),
      phone: input.phone?.trim() || null,
      message: input.message.trim(),
    })
    .select()
    .single();
  if (error) throw error;
  return data as ContactMessage;
}

export async function fetchContactMessages(): Promise<ContactMessage[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ContactMessage[];
}
