import citrusImg from "@/assets/collection-citrus.jpg";
import santoriniImg from "@/assets/collection-santorini.jpg";
import sunsetImg from "@/assets/collection-sunset.jpg";
import yachtImg from "@/assets/collection-yacht.jpg";
import roseImg from "@/assets/collection-rose.jpg";
import noirImg from "@/assets/collection-noir.png";
import productImg from "@/assets/ishq-product.jpeg";
import coffretImg from "@/assets/ishq-coffret.jpg";

export {
  citrusImg,
  santoriniImg,
  sunsetImg,
  yachtImg,
  roseImg,
  noirImg,
  productImg,
  coffretImg,
};

export interface PresetProductImage {
  id: string;
  name: string;
  url: string;
  thumbnail: string;
  category?: string;
}

export const PRESET_PRODUCT_IMAGES: PresetProductImage[] = [
  { id: "santorini", name: "ISHQ Signature", url: "/assets/collection-santorini.jpg", thumbnail: santoriniImg, category: "signature" },
  { id: "citrus", name: "Soleil d'Oranger", url: "/assets/collection-citrus.jpg", thumbnail: citrusImg, category: "fresh" },
  { id: "sunset", name: "Sunset Club", url: "/assets/collection-sunset.jpg", thumbnail: sunsetImg, category: "intense" },
  { id: "yacht", name: "Yachting Club", url: "/assets/collection-yacht.jpg", thumbnail: yachtImg, category: "fresh" },
  { id: "rose", name: "Bouquet de Soie", url: "/assets/collection-rose.jpg", thumbnail: roseImg, category: "floral" },
  { id: "noir", name: "Collection Noir", url: "/assets/collection-noir.png", thumbnail: noirImg, category: "intense" },
  { id: "product", name: "Flacon ISHQ Prestige", url: "/assets/ishq-product.jpeg", thumbnail: productImg },
  { id: "coffret", name: "Coffret Cadeau", url: "/assets/ishq-coffret.jpg", thumbnail: coffretImg },
];

const LOCAL_ASSET_MAP: Record<string, string> = {
  // Santorini / Signature
  "collection-santorini.jpg": santoriniImg,
  "/assets/collection-santorini.jpg": santoriniImg,
  "assets/collection-santorini.jpg": santoriniImg,
  "/src/assets/collection-santorini.jpg": santoriniImg,
  "ishq-signature": santoriniImg,
  signature: santoriniImg,

  // Citrus / Soleil
  "collection-citrus.jpg": citrusImg,
  "/assets/collection-citrus.jpg": citrusImg,
  "assets/collection-citrus.jpg": citrusImg,
  "/src/assets/collection-citrus.jpg": citrusImg,
  "ishq-soleil": citrusImg,
  citrus: citrusImg,
  fresh: citrusImg,
  frais: citrusImg,

  // Sunset
  "collection-sunset.jpg": sunsetImg,
  "/assets/collection-sunset.jpg": sunsetImg,
  "assets/collection-sunset.jpg": sunsetImg,
  "/src/assets/collection-sunset.jpg": sunsetImg,
  "ishq-sunset": sunsetImg,
  sunset: sunsetImg,
  intense: sunsetImg,

  // Yachting
  "collection-yacht.jpg": yachtImg,
  "/assets/collection-yacht.jpg": yachtImg,
  "assets/collection-yacht.jpg": yachtImg,
  "/src/assets/collection-yacht.jpg": yachtImg,
  "ishq-yachting": yachtImg,
  yacht: yachtImg,

  // Rose / Bouquet
  "collection-rose.jpg": roseImg,
  "/assets/collection-rose.jpg": roseImg,
  "assets/collection-rose.jpg": roseImg,
  "/src/assets/collection-rose.jpg": roseImg,
  "ishq-bouquet": roseImg,
  rose: roseImg,
  floral: roseImg,

  // Noir
  "collection-noir.png": noirImg,
  "/assets/collection-noir.png": noirImg,
  "assets/collection-noir.png": noirImg,
  "/src/assets/collection-noir.png": noirImg,
  "ishq-noir": noirImg,
  noir: noirImg,

  // Product & Coffret
  "ishq-product.jpeg": productImg,
  "/assets/ishq-product.jpeg": productImg,
  "ishq-coffret.jpg": coffretImg,
  "/assets/ishq-coffret.jpg": coffretImg,
};

/**
 * Résout automatiquement les URLs d'images de parfums :
 * - Images locales de la collection ISHQ (@/assets/...)
 * - URLs Vite dev (/src/assets/..., /@fs/..., data:..., blob:...)
 * - Fichiers servis depuis /public/assets/...
 * - Fichiers téléversés sur le backend (/uploads/...)
 * - URLs externes complètes (http/https)
 * - Fallback intelligent selon la catégorie ou l'ID si image manquante
 */
export function resolveProductImage(url?: string | null, fallbackCategoryOrId?: string): string {
  if (!url || typeof url !== "string" || !url.trim()) {
    if (fallbackCategoryOrId) {
      const key = fallbackCategoryOrId.toLowerCase().trim();
      if (LOCAL_ASSET_MAP[key]) return LOCAL_ASSET_MAP[key];
    }
    return santoriniImg;
  }

  const trimmed = url.trim();

  // Data URLs et Blob URLs (fichiers choisis depuis le PC ou prévisualisés)
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  // URLs Vite locales en mode dev (/src/assets/..., /@fs/..., /@id/...)
  if (
    trimmed.startsWith("/src/") ||
    trimmed.startsWith("/@fs/") ||
    trimmed.startsWith("/@id/") ||
    trimmed.startsWith("/@vite/")
  ) {
    return trimmed;
  }

  // Vérification directe dans la table des assets
  if (LOCAL_ASSET_MAP[trimmed]) {
    return LOCAL_ASSET_MAP[trimmed];
  }

  // Nettoyage de l'URL pour extraire le nom du fichier
  const cleanPath = trimmed.split("?")[0].split("#")[0];
  const filename = cleanPath.split("/").pop()?.toLowerCase() || "";

  if (filename && LOCAL_ASSET_MAP[filename]) {
    return LOCAL_ASSET_MAP[filename];
  }

  // Si c'est une URL pointant vers localhost / backend avec un nom d'asset local
  if (trimmed.includes("localhost") || trimmed.includes("127.0.0.1")) {
    if (filename && LOCAL_ASSET_MAP[filename]) {
      return LOCAL_ASSET_MAP[filename];
    }
  }

  // Si c'est une image téléversée sur le serveur distant (/uploads/...)
  if (trimmed.startsWith("/uploads/") || trimmed.startsWith("uploads/")) {
    const apiHost = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace("/api", "");
    const cleanUpload = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return `${apiHost}${cleanUpload}`;
  }

  // Si c'est une URL externe complète HTTP / HTTPS
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // Si c'est un chemin relatif public comme /assets/...
  if (trimmed.startsWith("/assets/") || trimmed.startsWith("assets/")) {
    const publicPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return publicPath;
  }

  // Fallback si rien ne correspond
  if (fallbackCategoryOrId) {
    const key = fallbackCategoryOrId.toLowerCase().trim();
    if (LOCAL_ASSET_MAP[key]) return LOCAL_ASSET_MAP[key];
  }

  return santoriniImg;
}

