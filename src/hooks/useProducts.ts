import { useQuery } from "@tanstack/react-query";
import { fetchProducts, ApiPerfume } from "@/lib/api";
import { perfumes } from "@/data/perfumes";

/**
 * Hook personnalisé pour récupérer les parfums en temps réel depuis le backend
 * avec valeur de repli instantanée sur les données locales si le serveur est inaccessible.
 */
export function useProducts(category?: string) {
  const query = useQuery({
    queryKey: ["products", category || "all"],
    queryFn: async () => {
      try {
        const data = await fetchProducts(category);
        if (data && data.length > 0) return data;
        return perfumes as unknown as ApiPerfume[];
      } catch (err) {
        console.warn("Backend non joignable, utilisation des données locales :", err);
        return perfumes as unknown as ApiPerfume[];
      }
    },
    initialData: perfumes as unknown as ApiPerfume[],
    staleTime: 5000,
    refetchOnWindowFocus: true,
  });

  const products = query.data || (perfumes as unknown as ApiPerfume[]);
  const signatureProduct =
    products.find((p) => p.id === "ishq-signature" || p.category === "signature") || products[0];

  return {
    products,
    signatureProduct,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
