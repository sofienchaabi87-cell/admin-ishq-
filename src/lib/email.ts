// Configurable EmailJS keys
// Replace these with your actual EmailJS credentials or use VITE_EMAILJS_* environment variables.
const EMAILJS_CONFIG = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || "YOUR_SERVICE_ID",
  contactTemplateId: import.meta.env.VITE_EMAILJS_CONTACT_TEMPLATE_ID || "YOUR_CONTACT_TEMPLATE_ID",
  orderTemplateId: import.meta.env.VITE_EMAILJS_ORDER_TEMPLATE_ID || "YOUR_ORDER_TEMPLATE_ID",
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "YOUR_PUBLIC_KEY",
};

export interface ContactData {
  name: string;
  email: string;
  message: string;
}

export interface OrderItemData {
  name: string;
  quantity: number;
  price: number;
  size: string;
}

export interface OrderData {
  orderNumber: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  items: OrderItemData[];
  cartTotal: number;
  shippingCost: number;
  grandTotal: number;
}

/**
 * Sends a contact form message.
 */
export async function sendContactEmail(data: ContactData): Promise<{ success: boolean; isDemo: boolean }> {
  const isConfigured =
    EMAILJS_CONFIG.serviceId !== "YOUR_SERVICE_ID" &&
    EMAILJS_CONFIG.publicKey !== "YOUR_PUBLIC_KEY";

  if (!isConfigured) {
    console.log("%c[ISHQ EMAIL DEMO - CONTACT MESSAGE]", "color: #d4af37; font-weight: bold;", {
      to: "Contact ISHQ",
      from: `${data.name} <${data.email}>`,
      message: data.message,
    });
    // Simulate slight network delay
    await new Promise((res) => setTimeout(res, 800));
    return { success: true, isDemo: true };
  }

  try {
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS_CONFIG.serviceId,
        template_id: EMAILJS_CONFIG.contactTemplateId,
        user_id: EMAILJS_CONFIG.publicKey,
        template_params: {
          from_name: data.name,
          from_email: data.email,
          message: data.message,
        },
      }),
    });

    return { success: response.ok, isDemo: false };
  } catch (error) {
    console.error("EmailJS Error:", error);
    return { success: false, isDemo: false };
  }
}

/**
 * Sends order confirmation details.
 */
export async function sendOrderEmail(data: OrderData): Promise<{ success: boolean; isDemo: boolean }> {
  const isConfigured =
    EMAILJS_CONFIG.serviceId !== "YOUR_SERVICE_ID" &&
    EMAILJS_CONFIG.publicKey !== "YOUR_PUBLIC_KEY";

  const formattedItems = data.items
    .map((item) => `- ${item.name} (${item.size}) x${item.quantity} : ${item.price * item.quantity} DT`)
    .join("\n");

  if (!isConfigured) {
    console.log("%c[ISHQ EMAIL DEMO - COMMANDE VALIDÉE]", "color: #d4af37; font-weight: bold;", {
      orderNumber: data.orderNumber,
      client: `${data.name} (${data.email}, Tel: ${data.phone}, Ville: ${data.city})`,
      items: formattedItems,
      cartTotal: `${data.cartTotal} DT`,
      shipping: `${data.shippingCost} DT`,
      total: `${data.grandTotal} DT`,
    });
    // Simulate slight network delay
    await new Promise((res) => setTimeout(res, 1000));
    return { success: true, isDemo: true };
  }

  try {
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS_CONFIG.serviceId,
        template_id: EMAILJS_CONFIG.orderTemplateId,
        user_id: EMAILJS_CONFIG.publicKey,
        template_params: {
          order_number: data.orderNumber,
          user_name: data.name,
          user_email: data.email,
          user_phone: data.phone,
          user_city: data.city,
          order_items: formattedItems,
          total_price: `${data.grandTotal} DT`,
        },
      }),
    });

    return { success: response.ok, isDemo: false };
  } catch (error) {
    console.error("EmailJS Error:", error);
    return { success: false, isDemo: false };
  }
}
