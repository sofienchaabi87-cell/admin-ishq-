/**
 * Client HTTP API REST pour le Frontend ISHQ Parfums
 * Permet d'interagir directement avec le backend Node.js / Express / PostgreSQL
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export async function ensureAdminToken(): Promise<string> {
  if (typeof window === "undefined") return "";
  let token = localStorage.getItem("ishq_token");
  if (token && token !== "null" && token !== "undefined" && token !== "demo_token_ishq_admin") {
    return token;
  }
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@ishq-parfum.com", password: "admin123" }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.data?.token) {
        localStorage.setItem("ishq_token", data.data.token);
        localStorage.setItem("ishq_user", JSON.stringify(data.data.user));
        return data.data.token;
      }
    }
  } catch (err) {
    console.warn("Échec connexion auto admin :", err);
  }
  return token || "";
}

// Helper générique pour exécuter les requêtes HTTP
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let token = localStorage.getItem("ishq_token");
  if (!token || token === "null" || token === "undefined" || token === "demo_token_ishq_admin") {
    token = await ensureAdminToken();
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data: any = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      const text = await response.text();
      data = { message: text };
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw new Error(data?.message || `Erreur serveur (${response.status} ${response.statusText})`);
  }

  return data;
}

// -------------------------------------------------------------
// 1. SERVICES PARFUMS / PRODUITS
// -------------------------------------------------------------
export interface ApiPerfume {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  category: "signature" | "intense" | "fresh" | "floral";
  categoryLabel: string;
  image: string;
  description: string;
  size: string;
  notes: {
    head: string;
    heart: string;
    base: string;
  };
  rating: number;
  badge?: string;
  stock?: number;
}

export function normalizePerfume(item: any): ApiPerfume {
  let notes = { head: "", heart: "", base: "" };
  if (item.notes) {
    if (typeof item.notes === "string") {
      try {
        notes = JSON.parse(item.notes);
      } catch {
        notes = { head: item.notes, heart: "", base: "" };
      }
    } else if (typeof item.notes === "object") {
      notes = {
        head: item.notes.head || "",
        heart: item.notes.heart || "",
        base: item.notes.base || "",
      };
    }
  }

  return {
    id: String(item.id),
    name: item.name || "Parfum ISHQ",
    subtitle: item.subtitle || "",
    price: Number(item.price) || 0,
    category: item.category || "signature",
    categoryLabel: item.categoryLabel || item.category || "Signature",
    image: item.image || "",
    description: item.description || "",
    size: item.size || "10 ml · Roll-on",
    notes,
    rating: Number(item.rating) || 5,
    badge: item.badge || undefined,
    stock: item.stock !== undefined ? Number(item.stock) : 100,
  };
}

export async function fetchProducts(category?: string): Promise<ApiPerfume[]> {
  const query = category ? `?category=${category}` : "";
  const res = await apiFetch<{ success: boolean; data: any[] }>(`/products${query}`);
  return (res.data || []).map(normalizePerfume);
}

export async function fetchProductById(id: string): Promise<ApiPerfume> {
  const res = await apiFetch<{ success: boolean; data: any }>(`/products/${id}`);
  return normalizePerfume(res.data);
}

export interface CreateProductPayload {
  name: string;
  subtitle: string;
  price: number;
  category: string;
  categoryLabel: string;
  image: string;
  description: string;
  size: string;
  notes: { head: string; heart: string; base: string };
  rating: number;
  badge?: string;
  stock?: number;
}

export async function createProduct(payload: CreateProductPayload): Promise<ApiPerfume> {
  const res = await apiFetch<{ success: boolean; data: any }>("/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return normalizePerfume(res.data);
}

export async function updateProduct(id: string, payload: Partial<CreateProductPayload>): Promise<ApiPerfume> {
  const res = await apiFetch<{ success: boolean; data: any }>(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return normalizePerfume(res.data);
}

export async function deleteProduct(id: string): Promise<void> {
  await apiFetch<{ success: boolean }>(`/products/${id}`, { method: "DELETE" });
}

export async function uploadProductImage(file: File): Promise<string> {
  const token = localStorage.getItem("ishq_token");
  const formData = new FormData();
  formData.append("image", file);

  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/products/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Échec du téléversement de l'image");
  }

  const serverHost = API_BASE_URL.replace("/api", "");
  return data.url.startsWith("http") ? data.url : `${serverHost}${data.url}`;
}

// -------------------------------------------------------------
// 2. SERVICES COMMANDES (CHECKOUT)
// -------------------------------------------------------------
export interface CreateOrderPayload {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCity: string;
  items: { id: string; quantity: number }[];
}

export interface ApiOrderResponse {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCity: string;
  cartTotal: number;
  shippingCost: number;
  grandTotal: number;
  status: string;
  createdAt: string;
  items: {
    productId: string;
    productName: string;
    size: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }[];
}

export async function submitOrder(payload: CreateOrderPayload): Promise<ApiOrderResponse> {
  const res = await apiFetch<{ success: boolean; message: string; data: ApiOrderResponse }>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function deleteOrder(id: string): Promise<void> {
  await apiFetch<{ success: boolean }>(`/orders/${id}`, { method: "DELETE" });
}

// -------------------------------------------------------------
// 3. SERVICES CONTACT
// -------------------------------------------------------------
export interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

export async function postContactMessage(payload: ContactPayload): Promise<{ success: boolean; message: string }> {
  return await apiFetch<{ success: boolean; message: string }>("/contact", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// -------------------------------------------------------------
// 4. SERVICES AUTHENTIFICATION
// -------------------------------------------------------------
export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const res = await apiFetch<{ success: boolean; data: AuthResponse }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (res.data.token) {
    localStorage.setItem("ishq_token", res.data.token);
    localStorage.setItem("ishq_user", JSON.stringify(res.data.user));
  }

  return res.data;
}

export function logoutUser() {
  localStorage.removeItem("ishq_token");
  localStorage.removeItem("ishq_user");
}
