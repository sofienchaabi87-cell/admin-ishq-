// Supabase client stub (Direct PostgreSQL backend is active)
export const isSupabaseConfigured = false;
export const supabase = null;

export interface SupabaseOrderItem {
  id: string;
  name: string;
  price: number;
  size: string;
  quantity: number;
}

export interface SupabaseOrderPayload {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCity: string;
  cartTotal: number;
  shippingCost: number;
  grandTotal: number;
  items: SupabaseOrderItem[];
}

export async function saveOrderToSupabase(_payload: SupabaseOrderPayload): Promise<{ success: boolean; isDemo: boolean }> {
  return { success: true, isDemo: true };
}