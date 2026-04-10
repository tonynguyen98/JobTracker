import { Job, JobStats } from "@/types/job";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export interface JobFilters {
  status?: string;
  tag?: string;
  search?: string;
}

export interface UploadResult {
  total_in_csv: number;
  created: number;
  updated: number;
  skipped: number;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export function getJobs(filters: JobFilters = {}): Promise<Job[]> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.search) params.set("search", filters.search);
  const qs = params.toString();
  return apiFetch<Job[]>(`/jobs/${qs ? `?${qs}` : ""}`);
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
    headers: {}, // let browser set multipart boundary, don't pass Content-Type
  });
}
