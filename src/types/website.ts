export interface SSLData {
  issuer: string | null;
  certificate_status: 'valid' | 'expired' | 'invalid' | 'mismatch';
  ssl_expiry: string | null;
  last_checked: string | null;
}


export type HealthStatus = "Healthy" | "Degraded" | "Offline" | "Intermittent" | "Unknown";

export interface Website {
  id: string;
  website_name: string;
  url: string;
  checked_at: string;
  updated_at: string;
  updated_by?: string;
  response_time_ms?: number;
  status_code?: number;
  is_active: boolean;
  health_status?: HealthStatus;
  created_by: string;
  created_at: string;
}

export interface WebsiteWithSSL{
    id: string;
  website_name: string;
  url: string;
  checked_at: string;
  updated_at: string;
  updated_by?: string;
  response_time_ms?: number;
  status_code?: number;
  is_active: boolean;
  health_status?: HealthStatus;
  created_by: string;
  created_at: string;
  ssl_expiry: string | null;
  issuer?: string | null;
  certificate_status?: 'valid' | 'expired' | 'invalid' | 'mismatch';
  last_checked?: string | null;
  domain_expiry?: string | null;
}