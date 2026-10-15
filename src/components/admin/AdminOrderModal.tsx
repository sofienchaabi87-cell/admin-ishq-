import { X, Package, Phone, Mail, MapPin, CheckCircle, Circle, Clock, Truck, XCircle } from "lucide-react";
import { useAdminTheme } from "@/context/AdminThemeContext";

interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCity: string;
  grandTotal: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};

export const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  CONFIRMED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  SHIPPED: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  DELIVERED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
};

// Timeline steps in order
const TIMELINE_STEPS = [
  { key: "PENDING",   label: "Commande reçue",   icon: Clock },
  { key: "CONFIRMED", label: "Confirmée",          icon: CheckCircle },
  { key: "SHIPPED",   label: "Expédiée",           icon: Truck },
  { key: "DELIVERED", label: "Livrée",             icon: Package },
];

const STATUS_ORDER = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];

interface AdminOrderModalProps {
  order: Order;
  onClose: () => void;
  onStatusChange?: (orderId: string, status: string) => void;
  updatingId?: string | null;
}

export default function AdminOrderModal({
  order,
  onClose,
  onStatusChange,
  updatingId,
}: AdminOrderModalProps) {
  const { isDark } = useAdminTheme();

  const modalBg = isDark ? "bg-stone-900 border border-stone-700" : "bg-beige-50 border border-beige-300 shadow-2xl";
  const textMain = isDark ? "text-stone-100" : "text-beige-900";
  const textMuted = isDark ? "text-stone-400" : "text-beige-600";
  const divider = isDark ? "border-stone-800" : "border-beige-200";
  const infoRow = isDark ? "bg-stone-800/60" : "bg-beige-200/80";
  const selectBg = isDark ? "bg-stone-800 border-stone-700 text-stone-300" : "bg-beige-50 border-beige-300 text-beige-900";

  const isCancelled = order.status === "CANCELLED";
  const currentIdx = STATUS_ORDER.indexOf(order.status);

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`${modalBg} rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${divider}`}>
          <div>
            <h3 className={`font-serif font-semibold text-lg ${textMain}`}>
              Commande{" "}
              <span className="text-amber-500 font-mono">{order.orderNumber || order.id}</span>
            </h3>
            <p className={`text-xs mt-0.5 ${textMuted}`}>
              {(() => {
                try {
                  const d = new Date(order.createdAt);
                  return isNaN(d.getTime())
                    ? "Récemment"
                    : d.toLocaleDateString("fr-FR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      });
                } catch {
                  return "Récemment";
                }
              })()}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition ${
              isDark ? "hover:bg-stone-800 text-stone-400" : "hover:bg-stone-100 text-stone-500"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto max-h-[75vh] space-y-5">
          {/* Status timeline */}
          {!isCancelled ? (
            <div>
              <p className={`text-xs uppercase tracking-wider font-semibold mb-3 ${textMuted}`}>
                Suivi de la commande
              </p>
              <div className="flex items-start gap-0">
                {TIMELINE_STEPS.map((step, i) => {
                  const done = currentIdx >= i;
                  const active = currentIdx === i;
                  const Icon = step.icon;
                  const isLast = i === TIMELINE_STEPS.length - 1;
                  return (
                    <div key={step.key} className="flex-1 flex flex-col items-center">
                      {/* connector */}
                      <div className="flex items-center w-full">
                        {i > 0 && (
                          <div
                            className={`flex-1 h-0.5 ${done ? "bg-amber-500" : isDark ? "bg-stone-700" : "bg-stone-200"}`}
                          />
                        )}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition ${
                            done
                              ? active
                                ? "bg-amber-500 text-stone-950 ring-4 ring-amber-500/20"
                                : "bg-amber-500/20 text-amber-400"
                              : isDark
                              ? "bg-stone-800 text-stone-600"
                              : "bg-stone-100 text-stone-400"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        {!isLast && (
                          <div
                            className={`flex-1 h-0.5 ${
                              currentIdx > i ? "bg-amber-500" : isDark ? "bg-stone-700" : "bg-stone-200"
                            }`}
                          />
                        )}
                      </div>
                      <p
                        className={`text-[10px] text-center mt-1.5 font-medium ${
                          done ? (isDark ? "text-amber-400" : "text-amber-600") : textMuted
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm font-medium">Commande annulée</p>
            </div>
          )}

          {/* Status update */}
          {onStatusChange && (
            <div className={`flex items-center justify-between p-3 rounded-xl ${infoRow}`}>
              <span className={`text-sm font-medium ${textMain}`}>Changer le statut</span>
              <select
                value={order.status}
                disabled={updatingId === order.id}
                onChange={(e) => onStatusChange(order.id, e.target.value)}
                className={`text-sm border rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition ${selectBg}`}
              >
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Client info */}
          <div className={`rounded-xl p-4 space-y-2.5 ${infoRow}`}>
            <p className={`text-xs uppercase tracking-wider font-semibold mb-3 ${textMuted}`}>
              Informations client
            </p>
            {[
              { icon: Circle, label: order.customerName },
              { icon: Mail, label: order.customerEmail },
              { icon: Phone, label: order.customerPhone },
              { icon: MapPin, label: order.customerCity },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${textMuted}`} />
                <span className={`text-sm ${textMain}`}>{label}</span>
              </div>
            ))}
          </div>

          {/* Items */}
          <div className={`border-t ${divider} pt-4`}>
            <p className={`text-xs uppercase tracking-wider font-semibold mb-3 ${textMuted}`}>
              Articles commandés
            </p>
            <div className="space-y-2">
              {(order.items || []).map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between py-2.5 px-3 rounded-xl ${infoRow}`}
                >
                  <div>
                    <p className={`text-sm font-medium ${textMain}`}>{item.productName}</p>
                    <p className={`text-xs ${textMuted}`}>
                      {item.quantity} × {Number(item.unitPrice || 0).toFixed(2)} DT
                    </p>
                  </div>
                  <span className={`text-sm font-semibold ${textMain}`}>
                    {Number(item.subtotal || 0).toFixed(2)} DT
                  </span>
                </div>
              ))}
            </div>

            <div className={`flex justify-between items-center mt-4 pt-4 border-t ${divider}`}>
              <span className={`font-semibold ${textMain}`}>Total</span>
              <span className="text-lg font-bold text-amber-500">
                {Number(order.grandTotal || 0).toFixed(2)} DT
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
