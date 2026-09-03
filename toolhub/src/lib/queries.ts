import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, queryString } from "./api";
import type {
  AnalyticsOverview, Category, CountryRow, DateRange, Page, Paginated, Product,
  Review, SeriesPoint, Settings, StaffUser, TopProduct
} from "./types";

export interface ProductFilters extends Record<string, string | number | boolean | undefined> {
  q?: string;
  category?: string;
  tag?: string;
  status?: string;
  price?: string;
  minRating?: number;
  featured?: string;
  sort?: string;
  page?: number;
  perPage?: number;
}

const minute = 60_000;

export const useProducts = (filters: ProductFilters = {}) =>
  useQuery({
    queryKey: ["products", filters],
    queryFn: () => api<Paginated<Product>>(`/products${queryString(filters)}`),
    staleTime: minute
  });

export const useProduct = (slug: string | undefined) =>
  useQuery({
    queryKey: ["product", slug],
    queryFn: () => api<Product>(`/products/${slug}`),
    enabled: Boolean(slug)
  });

export const useRelatedProducts = (slug: string | undefined) =>
  useQuery({
    queryKey: ["related", slug],
    queryFn: () => api<{ items: Product[] }>(`/products/${slug}/related`),
    enabled: Boolean(slug),
    staleTime: 5 * minute
  });

export const useCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: () => api<{ items: Category[] }>("/categories"),
    staleTime: 5 * minute
  });

export const usePage = (slug: string) =>
  useQuery({
    queryKey: ["page", slug],
    queryFn: () => api<Page>(`/pages/${slug}`),
    staleTime: minute,
    retry: false
  });

export const usePages = () =>
  useQuery({ queryKey: ["pages"], queryFn: () => api<{ items: Page[] }>("/pages") });

export const useSettings = () =>
  useQuery({
    queryKey: ["settings"],
    queryFn: () => api<Settings>("/settings"),
    staleTime: 5 * minute
  });

export const useReviews = (params: { productId?: string; status?: string; limit?: number } = {}) =>
  useQuery({
    queryKey: ["reviews", params],
    queryFn: () =>
      api<{ items: Review[]; counts: Record<string, number> }>(`/reviews${queryString(params)}`)
  });

export const useUsers = () =>
  useQuery({ queryKey: ["users"], queryFn: () => api<{ items: StaffUser[] }>("/users") });

export const useAuditLog = (limit = 20) =>
  useQuery({
    queryKey: ["audit", limit],
    queryFn: () =>
      api<{ items: { id: string; actorEmail: string; action: string; entity: string; entityId: string; createdAt: string }[] }>(
        `/users/audit/log${queryString({ limit })}`
      )
  });

export interface RangeParams {
  range: DateRange;
  from?: string;
  to?: string;
  limit?: number;
}

export const useOverview = (params: RangeParams) =>
  useQuery({
    queryKey: ["analytics", "overview", params],
    queryFn: () => api<AnalyticsOverview>(`/analytics/overview${queryString({ ...params })}`)
  });

export const useDownloadSeries = (params: RangeParams) =>
  useQuery({
    queryKey: ["analytics", "downloads", params],
    queryFn: () =>
      api<{ granularity: "day" | "month"; downloads: SeriesPoint[]; views: SeriesPoint[] }>(
        `/analytics/downloads${queryString({ ...params })}`
      )
  });

export const useCountryStats = (params: RangeParams) =>
  useQuery({
    queryKey: ["analytics", "countries", params],
    queryFn: () => api<{ total: number; items: CountryRow[] }>(`/analytics/countries${queryString({ ...params })}`)
  });

export const useTopProducts = (params: RangeParams) =>
  useQuery({
    queryKey: ["analytics", "products", params],
    queryFn: () =>
      api<{
        items: TopProduct[];
        byCategory: { categoryId: string; name: string; accent: string; downloads: number }[];
        newProducts: number;
        reviewActivity: number;
      }>(`/analytics/products${queryString({ ...params })}`)
  });

export const useTrafficSources = (params: RangeParams) =>
  useQuery({
    queryKey: ["analytics", "sources", params],
    queryFn: () =>
      api<{ total: number; sources: { label: string; value: number }[]; devices: { label: string; value: number }[] }>(
        `/analytics/sources${queryString({ ...params })}`
      )
  });

// --- Mutations ------------------------------------------------------------

export function useInvalidate() {
  const client = useQueryClient();
  return (keys: string[]) => keys.forEach((key) => client.invalidateQueries({ queryKey: [key] }));
}

export function useSaveProduct() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, values }: { id?: string; values: Partial<Product> }) =>
      api<Product>(id ? `/products/${id}` : "/products", { method: id ? "PUT" : "POST", body: values }),
    onSuccess: () => invalidate(["products", "product", "analytics"])
  });
}

export function useDeleteProduct() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/products/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidate(["products", "analytics"])
  });
}

export function useBulkProducts() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (body: { ids: string[]; action: string }) =>
      api<{ affected: number }>("/products/bulk", { method: "POST", body }),
    onSuccess: () => invalidate(["products", "analytics"])
  });
}

export function useSaveCategory() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, values }: { id?: string; values: Partial<Category> }) =>
      api<Category>(id ? `/categories/${id}` : "/categories", { method: id ? "PUT" : "POST", body: values }),
    onSuccess: () => invalidate(["categories"])
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidate(["categories"])
  });
}

export function useSavePage() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ slug, values }: { slug: string; values: Partial<Page> }) =>
      api<Page>(`/pages/${slug}`, { method: "PUT", body: values }),
    onSuccess: () => invalidate(["pages", "page"])
  });
}

export function useSaveReview() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: { status?: string } }) =>
      api<Review>(`/reviews/${id}`, { method: "PUT", body: values }),
    onSuccess: () => invalidate(["reviews", "products", "analytics"])
  });
}

export function useDeleteReview() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/reviews/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidate(["reviews", "products"])
  });
}

export function useSaveUser() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, values }: { id?: string; values: Record<string, unknown> }) =>
      api<StaffUser>(id ? `/users/${id}` : "/users", { method: id ? "PUT" : "POST", body: values }),
    onSuccess: () => invalidate(["users"])
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/users/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidate(["users"])
  });
}

export function useSaveSettings() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: Record<string, unknown> }) =>
      api<{ key: string }>(`/settings/${key}`, { method: "PUT", body: { value } }),
    onSuccess: () => invalidate(["settings"])
  });
}

export function useUploadImage() {
  return useMutation({
    mutationFn: async ({ file, prefix }: { file: File; prefix?: string }) => {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read the file"));
        reader.readAsDataURL(file);
      });
      return api<{ url: string; key: string; size: number }>("/uploads", {
        method: "POST",
        body: { filename: file.name, contentType: file.type, data, prefix: prefix ?? "products" }
      });
    }
  });
}
