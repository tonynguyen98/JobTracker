export interface Job {
  id: number;
  company_name: string;
  job_link: string;
  job_title: string;
  date_applied: string | null;
  type_of_job: string;
  salary_annual: string;
  application_status: string;
  notes: string;
  created_at: string;
}

export interface PaginatedJobs {
  results: Job[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface JobStats {
  total: number;
  by_status: Record<string, number>;
}

export interface SyncResult {
  synced: number;
  created: number;
  updated: number;
}

export interface UploadResult {
  total_in_csv: number;
  created: number;
  updated: number;
  skipped: number;
}
