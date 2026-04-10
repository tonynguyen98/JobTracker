import { Job, PaginatedJobs, JobStats, UploadResult } from "@/types/job";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export interface JobFilters {
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  if (options?.method === "DELETE") return undefined as T;
  return res.json();
}

export function getJobs(filters: JobFilters = {}): Promise<PaginatedJobs> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.page_size) params.set("page_size", String(filters.page_size));
  const qs = params.toString();
  return apiFetch<PaginatedJobs>(`/jobs/${qs ? `?${qs}` : ""}`);
}

export function getStats(): Promise<JobStats> {
  return apiFetch<JobStats>("/jobs/stats/");
}

export function createJob(data: Partial<Job>): Promise<Job> {
  return apiFetch<Job>("/jobs/create/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateJob(id: number, data: Partial<Job>): Promise<Job> {
  return apiFetch<Job>(`/jobs/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteJob(id: number): Promise<void> {
  return apiFetch<void>(`/jobs/${id}/`, { method: "DELETE" });
}

export function uploadCsv(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<UploadResult>("/jobs/upload-csv/", {
    method: "POST",
    body: form,
    headers: {},
  });
}
