import { apiClient } from "../api/client";
import type { Paginated } from "../api/types";

/** Fetches every page of a paginated endpoint and concatenates `results`. */
export async function fetchAllPages<T>(path: string, params?: Record<string, unknown>): Promise<T[]> {
  const all: T[] = [];
  let url: string | null = path;
  let isFirst = true;

  while (url) {
    const res: { data: Paginated<T> } = isFirst
      ? await apiClient.get<Paginated<T>>(url, { params })
      : await apiClient.get<Paginated<T>>(url);
    all.push(...res.data.results);
    url = res.data.next;
    isFirst = false;
  }
  return all;
}
