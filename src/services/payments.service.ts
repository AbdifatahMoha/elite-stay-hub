import { getSupabase } from "@/lib/supabase";
import type { Payment, PaymentMethod, PaymentStatus } from "@/types/database";

export async function fetchPayments(): Promise<Payment[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("payments")
    .select("*, booking:bookings(*, guest:guests(*))")
    .order("payment_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Payment[];
}

export async function createPayment(input: {
  booking_id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  reference_number?: string | null;
  payment_date?: string;
  notes?: string | null;
}) {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("payments").insert(input).select().single();
  if (error) throw error;
  return data as Payment;
}

export async function updatePayment(id: string, patch: Partial<Omit<Payment, "id" | "created_at">>) {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("payments").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as Payment;
}
