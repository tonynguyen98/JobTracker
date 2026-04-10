export interface Job {
  id: number;
  company_name: string;
  job_link: string;
  job_title: string;
  date_applied: string | undefined;
  type_of_job: string;
  salary_annual: string;
  application_status: string;
  notes: string;
  created_at: string;
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
