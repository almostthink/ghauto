import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, queryString } from "./api";
import type {
  AnalyticsOverview, Category, CountryRow, DateRange, Page, Paginated, Product,
  Review, SeriesPoint, Settings, TopProduct
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

export interface RuntimeConfig {
  adminPath: string;
  turnstile: { enabled: boolean; siteKey: string; reviews: boolean; login: boolean };
}

// Server-side switches the client needs before it renders its forms.
export const useConfig = () =>
  useQuery({
    queryKey: ["config"],
    queryFn: () => api<RuntimeConfig>("/config"),
    staleTime: 30 * minute
  });

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

export const useAuditLog = (limit = 20) =>
  useQuery({
    queryKey: ["audit", limit],
    queryFn: () =>
      api<{ items: { id: string; actorName: string; action: string; entity: string; entityId: string; createdAt: string }[] }>(
        `/audit${queryString({ limit })}`
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

export function useSaveSettings() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: Record<string, unknown> }) =>
      api<{ key: string }>(`/settings/${key}`, { method: "PUT", body: { value } }),
    onSuccess: () => invalidate(["settings"])
  });
}

export const useFileLimits = () =>
  useQuery({
    queryKey: ["file-limits"],
    queryFn: () => api<{ maxBytes: number; maxMb: number }>("/products/file/limits"),
    staleTime: 10 * minute
  });

// Installers can be hundreds of megabytes, so the file is streamed as the raw
// request body through XHR, which also gives us upload progress.
export function useUploadProductFile() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, file, onProgress }: { id: string; file: File; onProgress?: (percent: number) => void }) =>
      new Promise<Product>((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("PUT", `/api/products/${id}/file?filename=${encodeURIComponent(file.name)}`);
        request.setRequestHeader("Content-Type", "application/octet-stream");
        const csrf = document.cookie.match(/(?:^|;\s*)th_csrf=([^;]+)/);
        if (csrf) request.setRequestHeader("x-csrf-token", decodeURIComponent(csrf[1]));
        request.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) onProgress(Math.round((event.loaded / event.total) * 100));
        };
        request.onload = () => {
          if (request.status >= 200 && request.status < 300) {
            resolve(JSON.parse(request.responseText) as Product);
          } else {
            let message = `Upload failed (${request.status})`;
            try {
              message = (JSON.parse(request.responseText) as { error?: string }).error ?? message;
            } catch {
              /* keep the status message */
            }
            reject(new Error(message));
          }
        };
        request.onerror = () => reject(new Error("Upload failed: the connection dropped"));
        request.send(file);
      }),
    onSuccess: () => invalidate(["products", "product"])
  });
}

export function useDeleteProductFile() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api<Product>(`/products/${id}/file`, { method: "DELETE" }),
    onSuccess: () => invalidate(["products", "product"])
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
