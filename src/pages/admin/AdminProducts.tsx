import { useEffect, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { resolveProductImage, PRESET_PRODUCT_IMAGES } from "@/lib/resolveImage";
import {
  Plus, Pencil, Trash2, Star, Package, Tag, RefreshCw, Search, X, Save, Loader2,
  Upload, CheckCircle2, FolderOpen, ImageIcon, Eye, Check, ExternalLink,
  Grid3X3, LayoutGrid, List, Copy,
} from "lucide-react";
import { useAdminTheme } from "@/context/AdminThemeContext";
import { toast } from "sonner";
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  ApiPerfume,
  CreateProductPayload,
} from "@/lib/api";
import { perfumes } from "@/data/perfumes";


/* ─────────────── Types ─────────────── */
const CATEGORY_OPTIONS = [
  { value: "signature", label: "Signature" },
  { value: "intense", label: "Intense" },
  { value: "fresh", label: "Frais" },
  { value: "floral", label: "Floral" },
];

const EMPTY_FORM: CreateProductPayload = {
  name: "",
  subtitle: "",
  price: 89,
  category: "signature",
  categoryLabel: "Signature",
  image: "",
  description: "",
  size: "10 ml · Roll-on",
  notes: { head: "", heart: "", base: "" },
  rating: 5,
  badge: "",
  stock: 20,
};

/* ─────────────── Stock helper ─────────────── */
function stockBadge(qty?: number) {
  if (qty === undefined || qty === null) return null;
  if (qty === 0) return { label: "Rupture", color: "bg-red-500/20 text-red-400 border-red-500/30" };
  if (qty <= 5) return { label: `Faible (${qty})`, color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
  return { label: `En stock (${qty})`, color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
}

/* ─────────────── Persistence locale ─────────────── */
function generateSlug(name: string): string {
  const clean = name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return clean ? `ishq-${clean}-${Date.now().toString().slice(-4)}` : `ishq-${Date.now()}`;
}

const STORAGE_CUSTOM_KEY = "ishq_custom_products";

function getLocalCustomProducts(): ApiPerfume[] {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalCustomProduct(product: ApiPerfume) {
  try {
    const current = getLocalCustomProducts().filter((p) => p.id !== product.id);
    localStorage.setItem(STORAGE_CUSTOM_KEY, JSON.stringify([product, ...current]));
  } catch {
    // Si quota localStorage atteint, ignore silencieusement
  }
}

function removeLocalCustomProduct(id: string) {
  try {
    const current = getLocalCustomProducts().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_CUSTOM_KEY, JSON.stringify(current));
  } catch {
    // Ignore
  }
}

/* ─────────────── Component ─────────────── */
export default function AdminProducts() {
  const queryClient = useQueryClient();
  const { isDark } = useAdminTheme();
  const [products, setProducts] = useState<ApiPerfume[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ApiPerfume | null>(null);
  const [form, setForm] = useState<CreateProductPayload>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [viewMode, setViewMode] = useState<"compact" | "grid" | "table">(() => {
    return (localStorage.getItem("ishq_products_view") as "compact" | "grid" | "table") || "compact";
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [keepOpenAfterAdd, setKeepOpenAfterAdd] = useState(false);

  function handleViewModeChange(mode: "compact" | "grid" | "table") {
    setViewMode(mode);
    localStorage.setItem("ishq_products_view", mode);
  }

  /* ── Image Upload state ── */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [imageFileName, setImageFileName] = useState<string>("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  /* ── Image compression utility ── */
  function compressImage(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.85): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", quality));
          } else {
            resolve((e.target?.result as string) || "");
          }
        };
        img.onerror = () => resolve((e.target?.result as string) || "");
        img.src = (e.target?.result as string) || "";
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  }

  /* ── Image upload handler ── */
  async function handleFileSelect(file: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFormError("Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setFormError("La taille de l'image ne doit pas dépasser 15 Mo.");
      return;
    }

    setUploadingImage(true);
    setFormError("");
    setImageFileName(file.name);

    try {
      const compressedDataUrl = await compressImage(file, 1200, 1200, 0.85);
      if (compressedDataUrl) {
        setForm((f) => ({ ...f, image: compressedDataUrl }));
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 4000);
      }

      try {
        const uploadedUrl = await uploadProductImage(file);
        if (uploadedUrl) {
          setForm((f) => ({ ...f, image: uploadedUrl }));
        }
      } catch {
        // En cas de non-disponibilité du serveur d'upload, la base64 compressée reste active
      }
    } catch {
      // Erreur silencieuse
    } finally {
      setUploadingImage(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }

  /* ── Styles ── */
  const cardBg = isDark ? "bg-stone-900 border-stone-800" : "bg-beige-50 border-beige-300 shadow-sm";
  const textMain = isDark ? "text-stone-100" : "text-beige-900";
  const textMuted = isDark ? "text-stone-500" : "text-beige-600";
  const inputBg = isDark
    ? "bg-stone-800 border-stone-700 text-stone-200 placeholder-stone-600 focus:border-amber-500"
    : "bg-beige-200/80 border-beige-300 text-beige-900 placeholder-beige-500 focus:border-amber-500 focus:bg-beige-50";
  const labelColor = isDark ? "text-stone-400" : "text-beige-800 font-semibold";
  const modalBg = isDark ? "bg-stone-900 border-stone-700" : "bg-beige-50 border-beige-300 shadow-2xl";
  const divider = isDark ? "border-stone-800" : "border-beige-300";

  /* ── Fetch products from API, fallback to local ── */
  async function loadProducts() {
    setLoading(true);
    const localCustom = getLocalCustomProducts();
    try {
      const data = await fetchProducts();
      // Fusionner avec les produits personnalisés sauvegardés localement
      const existingIds = new Set(data.map((p) => p.id));
      const merged = [...localCustom.filter((p) => !existingIds.has(p.id)), ...data];
      setProducts(merged);
    } catch {
      // Fallback vers les parfums locaux + personnalisés
      const defaultPerfumes = perfumes as unknown as ApiPerfume[];
      const defaultIds = new Set(defaultPerfumes.map((p) => p.id));
      setProducts([...localCustom.filter((p) => !defaultIds.has(p.id)), ...defaultPerfumes]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProducts(); }, []);

  /* ── Open add modal ── */
  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setImageFileName("");
    setUploadSuccess(false);
    setShowUrlInput(false);
    setModalOpen(true);
  }

  /* ── Duplicate product for rapid addition ── */
  function duplicateProduct(product: ApiPerfume) {
    setEditTarget(null);
    setForm({
      name: `${product.name} (Nouveau)`,
      subtitle: product.subtitle,
      price: product.price,
      category: product.category,
      categoryLabel: product.categoryLabel,
      image: product.image,
      description: product.description,
      size: product.size,
      notes: { ...product.notes },
      rating: product.rating,
      badge: product.badge || "",
      stock: product.stock ?? 20,
    });
    setFormError("");
    setImageFileName("");
    setUploadSuccess(false);
    setShowUrlInput(Boolean(product.image && !product.image.startsWith("data:") && !product.image.startsWith("/uploads/")));
    setModalOpen(true);
  }

  /* ── Open edit modal ── */
  function openEdit(product: ApiPerfume) {
    setEditTarget(product);
    setForm({
      name: product.name,
      subtitle: product.subtitle,
      price: product.price,
      category: product.category,
      categoryLabel: product.categoryLabel,
      image: product.image,
      description: product.description,
      size: product.size,
      notes: { ...product.notes },
      rating: product.rating,
      badge: product.badge || "",
      stock: product.stock ?? 0,
    });
    setFormError("");
    setImageFileName("");
    setUploadSuccess(false);
    setShowUrlInput(Boolean(product.image && !product.image.startsWith("data:") && !product.image.startsWith("/uploads/")));
    setModalOpen(true);
  }

  /* ── Save (create or update) ── */
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.name.trim()) { setFormError("Le nom est requis."); return; }
    if (!form.price || form.price <= 0) { setFormError("Le prix doit être positif."); return; }

    setSaving(true);
    try {
      const generatedId = editTarget ? editTarget.id : generateSlug(form.name);
      const payload: CreateProductPayload & { id?: string } = {
        ...form,
        id: generatedId,
        subtitle: form.subtitle?.trim() || "Huile de Parfum Originelle",
        description: form.description?.trim() || "Une composition olfactive délicate et raffinée signée ISHQ Parfums.",
        categoryLabel: CATEGORY_OPTIONS.find((c) => c.value === form.category)?.label || form.category,
        badge: form.badge?.trim() || undefined,
        image: form.image || "/assets/collection-santorini.jpg",
        notes: {
          head: form.notes?.head?.trim() || "Agrumes, Bergamote",
          heart: form.notes?.heart?.trim() || "Jasmin, Rose",
          base: form.notes?.base?.trim() || "Ambre chaud, Musc Blanc",
        },
        stock: Number(form.stock) || 20,
        rating: Number(form.rating) || 5,
      };

      if (editTarget) {
        let updated: ApiPerfume;
        try {
          updated = await updateProduct(editTarget.id, payload);
        } catch {
          // En cas d'erreur ou backend hors-ligne, mise à jour locale
          updated = {
            ...editTarget,
            ...payload,
            id: editTarget.id,
          };
        }
        saveLocalCustomProduct(updated);
        setProducts((prev) => prev.map((p) => (p.id === editTarget.id ? updated : p)));
        setModalOpen(false);
        toast.success("Produit mis à jour avec succès !");
      } else {
        let created: ApiPerfume;
        try {
          created = await createProduct(payload);
        } catch {
          // En cas d'erreur ou backend hors-ligne, enregistrement local instantané
          created = {
            id: generatedId,
            name: payload.name,
            subtitle: payload.subtitle,
            price: payload.price,
            category: payload.category as any,
            categoryLabel: payload.categoryLabel,
            image: payload.image,
            description: payload.description,
            size: payload.size,
            notes: payload.notes,
            rating: payload.rating,
            badge: payload.badge,
            stock: payload.stock,
          };
        }
        saveLocalCustomProduct(created);
        setProducts((prev) => [created, ...prev]);
        toast.success("Produit créé avec succès !");

        if (keepOpenAfterAdd) {
          setForm({
            ...EMPTY_FORM,
            category: form.category,
            categoryLabel: form.categoryLabel,
          });
          setImageFileName("");
          setUploadSuccess(false);
        } else {
          setModalOpen(false);
        }
      }
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  /* ── Delete ── */
  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      try {
        await deleteProduct(id);
      } catch {
        // En cas d'absence de backend, suppression locale
      }
      removeLocalCustomProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produit supprimé.");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur lors de la suppression.");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  /* ── Filter ── */
  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.subtitle && p.subtitle.toLowerCase().includes(q));
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  /* ─── Render ─── */
  return (
    <div className="space-y-4">
      {/* Toolbar & Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, senteur, catégorie…"
              className={`w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition ${inputBg}`}
            />
          </div>

          {/* Right actions: View modes, Refresh, Add */}
          <div className="flex items-center gap-2 ml-auto">
            {/* View mode toggle */}
            <div className={`flex items-center p-0.5 rounded-xl border ${isDark ? "bg-stone-800/80 border-stone-700" : "bg-beige-200/90 border-beige-300"}`}>
              <button
                type="button"
                onClick={() => handleViewModeChange("compact")}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  viewMode === "compact"
                    ? "bg-amber-500 text-stone-950 font-semibold shadow-sm"
                    : isDark
                    ? "text-stone-400 hover:text-stone-200"
                    : "text-beige-800 hover:text-beige-950"
                }`}
                title="Vue compacte : icônes réduites pour afficher un maximum de produits"
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                <span className="hidden md:inline text-[11px]">Compact</span>
              </button>

              <button
                type="button"
                onClick={() => handleViewModeChange("grid")}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-amber-500 text-stone-950 font-semibold shadow-sm"
                    : isDark
                    ? "text-stone-400 hover:text-stone-200"
                    : "text-beige-800 hover:text-beige-950"
                }`}
                title="Vue grille classique"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden md:inline text-[11px]">Grille</span>
              </button>

              <button
                type="button"
                onClick={() => handleViewModeChange("table")}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  viewMode === "table"
                    ? "bg-amber-500 text-stone-950 font-semibold shadow-sm"
                    : isDark
                    ? "text-stone-400 hover:text-stone-200"
                    : "text-beige-800 hover:text-beige-950"
                }`}
                title="Vue tableau haute densité"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden md:inline text-[11px]">Tableau</span>
              </button>
            </div>

            <button
              onClick={loadProducts}
              disabled={loading}
              className={`p-2 rounded-xl border transition ${
                isDark ? "border-stone-700 text-stone-400 hover:text-amber-400" : "border-beige-300 text-beige-700 hover:text-amber-600 bg-beige-50"
              } disabled:opacity-50 cursor-pointer`}
              title="Actualiser la liste"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-xl transition active:scale-[0.98] shadow-sm cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nouveau produit</span>
            </button>
          </div>
        </div>

        {/* Category Pills & Count */}
        <div className={`flex flex-wrap items-center justify-between gap-2 pt-1 border-t ${isDark ? "border-stone-800/40" : "border-beige-300"}`}>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "all", label: "Tous" },
              { id: "signature", label: "Signature" },
              { id: "intense", label: "Intense" },
              { id: "fresh", label: "Frais" },
              { id: "floral", label: "Floral" },
            ].map((cat) => {
              const count = cat.id === "all" ? products.length : products.filter((p) => p.category === cat.id).length;
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? "bg-amber-500 text-stone-950 font-semibold shadow-xs"
                      : isDark
                      ? "bg-stone-800/60 text-stone-400 hover:text-stone-200 hover:bg-stone-800"
                      : "bg-beige-200/90 text-beige-800 hover:text-beige-950 hover:bg-beige-300"
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    active ? "bg-stone-950/20 text-stone-950 font-bold" : isDark ? "bg-stone-700/80 text-stone-400" : "bg-beige-300 text-beige-900"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <p className={`text-[11px] ${textMuted} ml-auto`}>
            {filtered.length} produit{filtered.length !== 1 ? "s" : ""} affiché{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="inline-block w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className={`text-sm ${textMuted}`}>Chargement des produits…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={`py-12 text-center rounded-2xl border ${cardBg}`}>
          <Package className="w-10 h-10 text-stone-500 mx-auto mb-2 opacity-60" />
          <p className={`text-sm font-medium ${textMain}`}>Aucun produit ne correspond à votre recherche</p>
          <p className={`text-xs ${textMuted} mt-1`}>Essayez de changer de catégorie ou de réinitialiser la recherche.</p>
          <button
            onClick={() => { setSearch(""); setSelectedCategory("all"); }}
            className="mt-3 text-xs text-amber-500 hover:underline"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : viewMode === "table" ? (
        /* ─── VUE TABLEAU (Haute Densité) ─── */
        <div className={`rounded-2xl border overflow-hidden shadow-sm ${cardBg}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b ${isDark ? "bg-stone-800/60 border-stone-800 text-stone-400" : "bg-stone-50 border-stone-200 text-stone-500"}`}>
                  <th className="py-2.5 px-3 font-semibold">Image</th>
                  <th className="py-2.5 px-3 font-semibold">Produit</th>
                  <th className="py-2.5 px-3 font-semibold">Catégorie</th>
                  <th className="py-2.5 px-3 font-semibold">Format</th>
                  <th className="py-2.5 px-3 font-semibold">Prix</th>
                  <th className="py-2.5 px-3 font-semibold">Stock</th>
                  <th className="py-2.5 px-3 font-semibold">Note</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${divider}`}>
                {filtered.map((product) => {
                  const stock = stockBadge(product.stock);
                  const imgUrl = resolveProductImage(product.image, product.category);
                  return (
                    <tr key={product.id} className={`transition ${isDark ? "hover:bg-stone-800/40" : "hover:bg-stone-50"}`}>
                      {/* Image Thumbnail */}
                      <td className="py-2 px-3">
                        <div
                          onClick={() => setPreviewImage({ url: imgUrl, title: product.name })}
                          className="w-11 h-11 rounded-lg overflow-hidden border border-stone-700 bg-stone-950 shrink-0 relative group cursor-pointer"
                          title="Cliquer pour agrandir"
                        >
                          <img
                            src={imgUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            onError={(e) => {
                              const target = e.currentTarget;
                              const fallback = resolveProductImage("", product.category);
                              if (target.src !== fallback) target.src = fallback;
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Eye className="w-3.5 h-3.5 text-amber-400" />
                          </div>
                        </div>
                      </td>

                      {/* Name & Subtitle */}
                      <td className="py-2 px-3 min-w-[180px]">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-semibold text-xs ${textMain}`}>{product.name}</span>
                          {product.badge && (
                            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full">
                              {product.badge}
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] truncate ${textMuted}`}>{product.subtitle}</p>
                      </td>

                      {/* Category */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${isDark ? "bg-stone-800 text-stone-300 border border-stone-700" : "bg-stone-100 text-stone-700 border border-stone-200"}`}>
                          <Tag className="w-2.5 h-2.5 text-amber-500" />
                          {product.categoryLabel}
                        </span>
                      </td>

                      {/* Size */}
                      <td className="py-2 px-3 whitespace-nowrap text-[11px] text-stone-400">
                        {product.size}
                      </td>

                      {/* Price */}
                      <td className="py-2 px-3 whitespace-nowrap font-bold text-amber-500 text-xs">
                        {product.price} DT
                      </td>

                      {/* Stock */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        {stock && (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${stock.color}`}>
                            {stock.label}
                          </span>
                        )}
                      </td>

                      {/* Rating */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs text-stone-300">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {product.rating}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(product)}
                            className="p-1.5 rounded-lg border border-stone-700 text-stone-300 hover:text-amber-400 hover:border-amber-500/50 hover:bg-amber-500/10 transition cursor-pointer"
                            title="Modifier ce produit"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => duplicateProduct(product)}
                            className="p-1.5 rounded-lg border border-stone-700 text-stone-300 hover:text-amber-400 hover:border-amber-500/50 hover:bg-amber-500/10 transition cursor-pointer"
                            title="Dupliquer pour créer un nouveau produit rapidement"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          {confirmDeleteId === product.id ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleDelete(product.id)}
                                disabled={deletingId === product.id}
                                className="text-[10px] bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-600 disabled:opacity-50 transition font-medium"
                              >
                                {deletingId === product.id ? "…" : "Oui"}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-[10px] bg-stone-800 text-stone-300 px-1.5 py-1 rounded-md"
                              >
                                Non
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(product.id)}
                              className="p-1.5 rounded-lg border border-stone-700 text-stone-400 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === "compact" ? (
        /* ─── VUE GRILLE COMPACTE (Icônes réduites : 4 à 6 par ligne) ─── */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3">
          {filtered.map((product) => {
            const stock = stockBadge(product.stock);
            const imgUrl = resolveProductImage(product.image, product.category);
            return (
              <div
                key={product.id}
                className={`rounded-xl border overflow-hidden group transition-all duration-200 hover:shadow-md hover:border-amber-500/40 flex flex-col ${cardBg}`}
              >
                {/* Image miniature compacte (h-32) */}
                <div className="relative h-32 overflow-hidden bg-stone-900 flex items-center justify-center shrink-0">
                  <img
                    src={imgUrl}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                    onError={(e) => {
                      const target = e.currentTarget;
                      const fallback = resolveProductImage("", product.category);
                      if (target.src !== fallback) target.src = fallback;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent pointer-events-none" />

                  {/* Badge en haut à droite */}
                  {product.badge && (
                    <span className="absolute top-1.5 right-1.5 z-10 bg-amber-500 text-stone-950 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full shadow">
                      {product.badge}
                    </span>
                  )}

                  {/* Stock en bas à gauche */}
                  {stock && (
                    <span className={`absolute bottom-1.5 left-1.5 z-10 inline-flex px-1.5 py-0.2 rounded-full text-[9px] font-semibold border backdrop-blur-md ${stock.color}`}>
                      {stock.label}
                    </span>
                  )}

                  {/* Actions rapides au survol */}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 z-20">
                    <button
                      onClick={() => setPreviewImage({ url: imgUrl, title: product.name })}
                      className="w-7 h-7 rounded-lg bg-stone-900/90 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow hover:scale-110 transition cursor-pointer"
                      title="Agrandir l'image"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEdit(product)}
                      className="w-7 h-7 rounded-lg bg-stone-900/90 text-stone-200 border border-stone-700 flex items-center justify-center shadow hover:bg-amber-500 hover:text-stone-950 hover:scale-110 transition cursor-pointer"
                      title="Modifier"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => duplicateProduct(product)}
                      className="w-7 h-7 rounded-lg bg-stone-900/90 text-stone-200 border border-stone-700 flex items-center justify-center shadow hover:bg-amber-500 hover:text-stone-950 hover:scale-110 transition cursor-pointer"
                      title="Dupliquer pour créer un nouveau produit"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(product.id)}
                      className="w-7 h-7 rounded-lg bg-stone-900/90 text-stone-300 border border-stone-700 flex items-center justify-center shadow hover:bg-red-500 hover:text-white hover:scale-110 transition cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Info compacte */}
                <div className="p-2 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <h3 className={`font-semibold text-xs truncate ${textMain}`} title={product.name}>
                        {product.name}
                      </h3>
                      <span className="text-amber-500 font-bold text-xs shrink-0">{product.price} DT</span>
                    </div>
                    <p className={`text-[10px] truncate ${textMuted} mt-0.5`}>{product.subtitle}</p>
                  </div>

                  {/* Catégorie & Note */}
                  <div className={`flex items-center justify-between gap-1 pt-1.5 mt-1 border-t text-[10px] ${isDark ? "border-stone-800/40 text-stone-400" : "border-beige-200 text-beige-700"}`}>
                    <span className="truncate">{product.categoryLabel}</span>
                    <span className={`inline-flex items-center gap-0.5 shrink-0 ${isDark ? "text-stone-300" : "text-beige-900 font-medium"}`}>
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      {product.rating}
                    </span>
                  </div>

                  {/* Confirmation de suppression compacte */}
                  {confirmDeleteId === product.id && (
                    <div className="mt-1.5 p-1 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-1">
                      <span className="text-[10px] text-red-400 font-medium">Supprimer ?</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={deletingId === product.id}
                          className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold hover:bg-red-600"
                        >
                          Oui
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-[9px] bg-stone-700 text-stone-200 px-1.5 py-0.5 rounded"
                        >
                          Non
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ─── VUE GRILLE STANDARD (3 à 4 par ligne) ─── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => {
            const stock = stockBadge(product.stock);
            const imgUrl = resolveProductImage(product.image, product.category);
            return (
              <div key={product.id} className={`rounded-2xl border overflow-hidden group transition-all duration-300 hover:shadow-xl hover:border-amber-500/30 ${cardBg}`}>
                {/* Image */}
                <div className="relative h-44 overflow-hidden bg-stone-900/90 flex items-center justify-center">
                  <img
                    src={imgUrl}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    onError={(e) => {
                      const target = e.currentTarget;
                      const fallback = resolveProductImage("", product.category);
                      if (target.src !== fallback) target.src = fallback;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                  {/* Bouton Agrandir l'image */}
                  <button
                    onClick={() => setPreviewImage({ url: imgUrl, title: product.name })}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                    title="Agrandir l'image"
                  >
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900/90 text-amber-400 text-xs font-medium border border-amber-500/30 shadow-lg backdrop-blur-sm transform translate-y-2 group-hover:translate-y-0 transition-transform">
                      <Eye className="w-3.5 h-3.5" />
                      Aperçu
                    </span>
                  </button>

                  {product.badge && (
                    <span className="absolute top-3 right-3 z-10 bg-amber-500 text-stone-950 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow">
                      {product.badge}
                    </span>
                  )}
                  {stock && (
                    <span className={`absolute bottom-3 left-3 z-10 inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold border backdrop-blur-md ${stock.color}`}>
                      {stock.label}
                    </span>
                  )}

                  {/* Actions au survol */}
                  <div className="absolute top-3 left-3 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={() => openEdit(product)}
                      className="w-8 h-8 rounded-xl bg-stone-900/85 backdrop-blur-sm text-stone-200 border border-stone-700 flex items-center justify-center shadow-lg hover:bg-amber-500 hover:text-stone-950 hover:border-amber-500 transition cursor-pointer"
                      title="Modifier"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => duplicateProduct(product)}
                      className="w-8 h-8 rounded-xl bg-stone-900/85 backdrop-blur-sm text-stone-200 border border-stone-700 flex items-center justify-center shadow-lg hover:bg-amber-500 hover:text-stone-950 hover:border-amber-500 transition cursor-pointer"
                      title="Dupliquer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {confirmDeleteId === product.id ? (
                      <div className="flex gap-1 bg-stone-900/90 backdrop-blur-sm p-0.5 rounded-xl border border-stone-700">
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={deletingId === product.id}
                          className="text-[10px] bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600 disabled:opacity-50 transition font-medium"
                        >
                          {deletingId === product.id ? "…" : "Confirmer"}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-[10px] bg-stone-800 text-stone-300 px-2 py-1 rounded-lg hover:bg-stone-700 transition"
                        >
                          Non
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(product.id)}
                        className="w-8 h-8 rounded-xl bg-stone-900/85 backdrop-blur-sm text-stone-200 border border-stone-700 flex items-center justify-center shadow-lg hover:bg-red-500 hover:text-white hover:border-red-500 transition cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3.5">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0">
                      <h3 className={`font-semibold text-sm truncate ${textMain}`}>{product.name}</h3>
                      <p className={`text-xs truncate ${textMuted}`}>{product.subtitle}</p>
                    </div>
                    <span className="text-amber-500 font-bold text-sm flex-shrink-0">{product.price} DT</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${isDark ? "bg-stone-800 text-stone-400" : "bg-stone-100 text-stone-600"}`}>
                      <Tag className="w-2.5 h-2.5" />{product.categoryLabel}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${isDark ? "bg-stone-800 text-stone-400" : "bg-stone-100 text-stone-600"}`}>
                      <Package className="w-2.5 h-2.5" />{product.size}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[10px] ml-auto ${textMuted}`}>
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />{product.rating}
                    </span>
                  </div>
                  {/* Actions row */}
                  <div className={`flex gap-1.5 mt-3 pt-2.5 border-t ${divider}`}>
                    <button
                      onClick={() => openEdit(product)}
                      className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-xl transition cursor-pointer ${
                        isDark ? "bg-stone-800 hover:bg-amber-500/10 text-stone-300 hover:text-amber-400" : "bg-stone-100 hover:bg-amber-50 text-stone-600 hover:text-amber-600"
                      }`}
                    >
                      <Pencil className="w-3 h-3" /> Modifier
                    </button>
                    <button
                      onClick={() => duplicateProduct(product)}
                      className={`p-1.5 rounded-xl transition cursor-pointer ${
                        isDark ? "bg-stone-800 hover:bg-amber-500/10 text-stone-300 hover:text-amber-400" : "bg-stone-100 hover:bg-amber-50 text-stone-600 hover:text-amber-600"
                      }`}
                      title="Dupliquer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(product.id)}
                      className={`p-1.5 rounded-xl text-xs transition cursor-pointer ${
                        isDark ? "bg-stone-800 hover:bg-red-500/10 text-stone-500 hover:text-red-400" : "bg-stone-100 hover:bg-red-50 text-stone-400 hover:text-red-500"
                      }`}
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Add / Edit Modal ─── */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div className={`${modalBg} rounded-2xl w-full max-w-2xl shadow-2xl border overflow-hidden`}>
            {/* Modal header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${divider}`}>
              <h3 className={`font-serif font-semibold text-lg ${textMain}`}>
                {editTarget ? "Modifier le produit" : "Ajouter un produit"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition ${
                  isDark ? "hover:bg-stone-800 text-stone-400" : "hover:bg-stone-100 text-stone-500"
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="px-6 py-5 overflow-y-auto max-h-[70vh] space-y-4">
                {/* Name + Subtitle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-medium uppercase tracking-wider mb-1.5 ${labelColor}`}>
                      Nom *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      required
                      placeholder="ISHQ Signature"
                      className={`w-full px-4 py-2.5 text-sm rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium uppercase tracking-wider mb-1.5 ${labelColor}`}>
                      Sous-titre
                    </label>
                    <input
                      type="text"
                      value={form.subtitle}
                      onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                      placeholder="Huile de Parfum Originelle"
                      className={`w-full px-4 py-2.5 text-sm rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${inputBg}`}
                    />
                  </div>
                </div>

                {/* Price + Category + Stock */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-xs font-medium uppercase tracking-wider mb-1.5 ${labelColor}`}>
                      Prix (DT) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                      required
                      className={`w-full px-4 py-2.5 text-sm rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium uppercase tracking-wider mb-1.5 ${labelColor}`}>
                      Catégorie
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ApiPerfume["category"] }))}
                      className={`w-full px-4 py-2.5 text-sm rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${inputBg}`}
                    >
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium uppercase tracking-wider mb-1.5 ${labelColor}`}>
                      Stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.stock ?? 0}
                      onChange={(e) => setForm((f) => ({ ...f, stock: parseInt(e.target.value) || 0 }))}
                      className={`w-full px-4 py-2.5 text-sm rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${inputBg}`}
                    />
                  </div>
                </div>

                {/* Image Section avec Presets & Téléchargement */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <label className={`block text-xs font-medium uppercase tracking-wider ${labelColor}`}>
                      Image du parfum
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="text-xs text-amber-500 hover:text-amber-400 underline transition cursor-pointer"
                    >
                      {showUrlInput ? "Masquer le lien URL" : "Ou saisir une URL externe"}
                    </button>
                  </div>

                  {/* 1. Sélection rapide parmi les images de la collection ISHQ */}
                  <div>
                    <span className={`block text-[11px] font-medium mb-1.5 ${textMuted}`}>
                      Choisir une image de la collection ISHQ :
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {PRESET_PRODUCT_IMAGES.map((preset) => {
                        const isSelected = form.image === preset.url || form.image === preset.thumbnail;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              setForm((f) => ({ ...f, image: preset.url }));
                              setImageFileName(preset.name);
                            }}
                            className={`group relative rounded-xl overflow-hidden aspect-square border-2 transition-all cursor-pointer ${
                              isSelected
                                ? "border-amber-500 ring-2 ring-amber-500/40 scale-105"
                                : isDark
                                ? "border-stone-700 hover:border-stone-500 opacity-75 hover:opacity-100"
                                : "border-stone-300 hover:border-stone-400 opacity-80 hover:opacity-100"
                            }`}
                            title={preset.name}
                          >
                            <img
                              src={preset.thumbnail}
                              alt={preset.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            {isSelected && (
                              <span className="absolute inset-0 bg-amber-500/30 flex items-center justify-center">
                                <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center shadow">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </span>
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Input fichier caché relié au bouton */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    className="hidden"
                  />

                  {/* 2. Zone de téléversement et bouton PC */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`relative rounded-2xl border-2 border-dashed p-3.5 transition-all flex flex-col sm:flex-row items-center gap-3 ${
                      isDragging
                        ? "border-amber-500 bg-amber-500/10"
                        : isDark
                        ? "border-stone-700 hover:border-amber-500/60 bg-stone-800/40"
                        : "border-stone-300 hover:border-amber-500/60 bg-stone-50"
                    }`}
                  >
                    {/* Bouton Télécharger depuis le PC */}
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-semibold text-xs uppercase tracking-wider shadow hover:shadow-md transition-all active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                          <span>Téléversement...</span>
                        </>
                      ) : (
                        <>
                          <FolderOpen className="w-4 h-4 text-stone-950" />
                          <span>Importer depuis le PC</span>
                        </>
                      )}
                    </button>

                    {/* Instruction Glisser-déposer */}
                    <div className="flex-1 text-center sm:text-left">
                      <p className={`text-xs font-medium ${textMain}`}>
                        Glissez une image ici ou cliquez sur Importer
                      </p>
                      <p className={`text-[11px] mt-0.5 ${textMuted}`}>
                        JPG, PNG, WebP (Max 10 Mo)
                      </p>
                    </div>

                    {uploadSuccess && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium shrink-0 animate-pulse">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Image prête !</span>
                      </div>
                    )}
                  </div>

                  {/* 3. Carte d'Aperçu de l'image sélectionnée */}
                  {form.image && (
                    <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${isDark ? "bg-stone-800/80 border-stone-700" : "bg-stone-100 border-stone-200"}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-amber-500/30 shrink-0 bg-stone-950 shadow-inner">
                          <img
                            src={resolveProductImage(form.image, form.category)}
                            alt="Aperçu parfum"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget;
                              const fallback = resolveProductImage("", form.category);
                              if (target.src !== fallback) {
                                target.src = fallback;
                              }
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-semibold truncate ${textMain}`}>
                            {imageFileName || (form.image.startsWith("data:") ? "Image sélectionnée depuis le PC" : form.image.split("/").pop())}
                          </p>
                          <span className="inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            {form.image.startsWith("data:") ? "Fichier PC local" : form.image.startsWith("http") ? "Lien externe Web" : "Collection ISHQ"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className={`p-2 rounded-lg border text-xs transition cursor-pointer ${isDark ? "border-stone-600 hover:bg-stone-700 text-stone-300" : "border-stone-300 hover:bg-stone-200 text-stone-700"}`}
                          title="Remplacer l'image"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setForm((f) => ({ ...f, image: "" })); setImageFileName(""); }}
                          className="p-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs transition cursor-pointer"
                          title="Supprimer l'image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 4. Input manuel URL */}
                  {showUrlInput && (
                    <div className="pt-1">
                      <label className={`block text-[11px] font-medium mb-1 ${textMuted}`}>
                        Lien direct vers l'image (URL externe)
                      </label>
                      <input
                        type="text"
                        value={form.image}
                        onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                        placeholder="https://images.unsplash.com/... ou /assets/collection-santorini.jpg"
                        className={`w-full px-4 py-2.5 text-xs rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${inputBg}`}
                      />
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className={`block text-xs font-medium uppercase tracking-wider mb-1.5 ${labelColor}`}>
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    placeholder="Description du parfum…"
                    className={`w-full px-4 py-2.5 text-sm rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none ${inputBg}`}
                  />
                </div>

                {/* Size + Badge + Rating */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-xs font-medium uppercase tracking-wider mb-1.5 ${labelColor}`}>
                      Contenance
                    </label>
                    <input
                      type="text"
                      value={form.size}
                      onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
                      placeholder="10 ml · Roll-on"
                      className={`w-full px-4 py-2.5 text-sm rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium uppercase tracking-wider mb-1.5 ${labelColor}`}>
                      Badge
                    </label>
                    <input
                      type="text"
                      value={form.badge}
                      onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
                      placeholder="Bestseller"
                      className={`w-full px-4 py-2.5 text-sm rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium uppercase tracking-wider mb-1.5 ${labelColor}`}>
                      Note (0-5)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={form.rating}
                      onChange={(e) => setForm((f) => ({ ...f, rating: parseFloat(e.target.value) || 5 }))}
                      className={`w-full px-4 py-2.5 text-sm rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${inputBg}`}
                    />
                  </div>
                </div>

                {/* Olfactory notes */}
                <div>
                  <p className={`text-xs font-medium uppercase tracking-wider mb-2 ${labelColor}`}>Notes olfactives</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(["head", "heart", "base"] as const).map((key) => (
                      <div key={key}>
                        <label className={`block text-xs mb-1 ${textMuted}`}>
                          {key === "head" ? "Tête" : key === "heart" ? "Cœur" : "Fond"}
                        </label>
                        <input
                          type="text"
                          value={form.notes[key]}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, notes: { ...f.notes, [key]: e.target.value } }))
                          }
                          placeholder={key === "head" ? "Bergamote, Néroli" : key === "heart" ? "Jasmin, Rose" : "Oud, Ambre"}
                          className={`w-full px-3 py-2 text-sm rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${inputBg}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {formError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5">
                    <p className="text-red-400 text-sm">{formError}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t ${divider}`}>
                {!editTarget ? (
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={keepOpenAfterAdd}
                      onChange={(e) => setKeepOpenAfterAdd(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500/30 border-stone-600 accent-amber-500 cursor-pointer"
                    />
                    <span className={`text-xs ${textMuted}`}>Enregistrer et ajouter un autre produit</span>
                  </label>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm transition cursor-pointer ${
                      isDark ? "bg-stone-800 hover:bg-stone-700 text-stone-300" : "bg-stone-100 hover:bg-stone-200 text-stone-600"
                    }`}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-950 font-semibold text-xs sm:text-sm px-4 py-2 rounded-xl transition active:scale-[0.98] cursor-pointer shadow-sm"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? "Enregistrement…" : editTarget ? "Mettre à jour" : "Créer le produit"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Lightbox Modal pour voir l'image en grand format ─── */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-800 bg-stone-900/90">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-medium text-stone-200">{previewImage.title}</h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative aspect-square sm:aspect-[4/3] max-h-[70vh] bg-stone-950 flex items-center justify-center overflow-hidden p-2">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="w-full h-full object-contain rounded-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

