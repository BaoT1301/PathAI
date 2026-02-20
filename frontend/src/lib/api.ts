const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function authedFetch(url: string, token: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  return res;
}

export interface Job {
  id: string;
  title: string;
  company: string | null;
  description: string;
  location: string;
  department: string;
  seniority: string;
  salary_range: string;
  posted_date: string;
  match_score: number | null;
  external_url: string | null;
  source: string;
  applicant_count: number;
}

export async function fetchJob(id: string): Promise<Job> {
  const res = await fetch(`${API_URL}/api/jobs/${id}`);
  if (!res.ok) throw new Error("Job not found");
  return res.json();
}

export interface JobSummary {
  required_skills: string[];
  nice_to_have: string[];
  highlights: string[];
  experience_level: string;
  role_type: string;
  one_liner: string;
}

export async function fetchJobSummary(id: string): Promise<JobSummary> {
  const res = await fetch(`${API_URL}/api/jobs/${id}/summary`);
  if (!res.ok) throw new Error("Failed to fetch summary");
  return res.json();
}

export interface JobListResponse {
  jobs: Job[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface ResumeProfile {
  seniority: string;
  domain: string;
  skills: string[];
  years_experience: number;
  summary: string;
}

export interface SkillGap {
  matching_skills: string[];
  missing_skills: string[];
  gap_score: number;
}

export interface ResumeUploadResponse {
  profile: ResumeProfile;
  matched_jobs: Job[];
  skill_gaps: Record<string, SkillGap>;
}

export interface Application {
  id: string;
  job: Job;
  status: string;
  notes: string | null;
  applied_at: string;
  updated_at: string;
}

export async function fetchJobs(params: {
  page?: number;
  page_size?: number;
  department?: string;
  seniority?: string;
  location?: string;
  search?: string;
}): Promise<JobListResponse> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const res = await fetch(`${API_URL}/api/jobs?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch jobs");
  return res.json();
}

export async function fetchDepartments(): Promise<string[]> {
  const res = await fetch(`${API_URL}/api/departments`);
  if (!res.ok) throw new Error("Failed to fetch departments");
  return res.json();
}

// --- Application / ATS API ---

export async function applyToJob(jobId: string, token: string): Promise<Application> {
  const res = await authedFetch(`${API_URL}/api/applications`, token, {
    method: "POST",
    body: JSON.stringify({ job_id: jobId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to apply" }));
    throw new Error(err.detail || "Failed to apply");
  }
  return res.json();
}

export async function fetchApplications(token: string): Promise<Application[]> {
  const res = await authedFetch(`${API_URL}/api/applications`, token);
  if (!res.ok) throw new Error("Failed to fetch applications");
  return res.json();
}

export async function updateApplication(
  id: string,
  data: { status?: string; notes?: string },
  token: string
): Promise<Application> {
  const res = await authedFetch(`${API_URL}/api/applications/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update application");
  return res.json();
}

export async function deleteApplication(id: string, token: string): Promise<void> {
  await authedFetch(`${API_URL}/api/applications/${id}`, token, { method: "DELETE" });
}

export async function getApplicationStatus(
  jobId: string,
  token?: string
): Promise<{ status: string | null; application_id: string | null }> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}/api/applications/${jobId}/status`, { headers });
  if (!res.ok) return { status: null, application_id: null };
  return res.json();
}

// --- Job Alerts API ---

export interface JobAlertData {
  id: string;
  departments: string[];
  seniorities: string[];
  keywords: string | null;
  created_at: string;
}

export async function createAlert(
  data: { departments: string[]; seniorities: string[]; keywords?: string },
  token: string
): Promise<JobAlertData> {
  const res = await authedFetch(`${API_URL}/api/alerts`, token, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create alert");
  return res.json();
}

export async function fetchAlerts(token: string): Promise<JobAlertData[]> {
  const res = await authedFetch(`${API_URL}/api/alerts`, token);
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return res.json();
}

export async function deleteAlert(id: string, token: string): Promise<void> {
  await authedFetch(`${API_URL}/api/alerts/${id}`, token, { method: "DELETE" });
}

// --- Cover Letter API ---

export async function generateCoverLetter(
  jobId: string,
  resumeSummary: string,
  token: string
): Promise<{ cover_letter: string }> {
  const res = await authedFetch(`${API_URL}/api/jobs/${jobId}/cover-letter`, token, {
    method: "POST",
    body: JSON.stringify({ resume_summary: resumeSummary }),
  });
  if (!res.ok) throw new Error("Failed to generate cover letter");
  return res.json();
}

// --- Saved Jobs API ---

export interface SavedJob {
  id: string;
  job: Job;
  saved_at: string;
}

export async function saveJob(jobId: string, token: string): Promise<SavedJob> {
  const res = await authedFetch(`${API_URL}/api/saved-jobs`, token, {
    method: "POST",
    body: JSON.stringify({ job_id: jobId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to save job" }));
    throw new Error(err.detail || "Failed to save job");
  }
  return res.json();
}

export async function unsaveJob(jobId: string, token: string): Promise<void> {
  await authedFetch(`${API_URL}/api/saved-jobs/${jobId}`, token, { method: "DELETE" });
}

export async function fetchSavedJobs(token: string): Promise<SavedJob[]> {
  const res = await authedFetch(`${API_URL}/api/saved-jobs`, token);
  if (!res.ok) throw new Error("Failed to fetch saved jobs");
  return res.json();
}

// --- Saved Resume Profile API ---

export interface SavedResume {
  resume_summary: string;
  updated_at: string;
}

export async function fetchSavedResume(token: string): Promise<SavedResume | null> {
  const res = await authedFetch(`${API_URL}/api/me/resume`, token);
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json();
}

export async function uploadResume(file: File, token?: string): Promise<ResumeUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api/resume/upload`, {
    method: "POST",
    body: formData,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(error.detail || "Upload failed");
  }

  return res.json();
}
