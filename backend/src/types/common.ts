/**
 * Common TypeScript interfaces and types used across the backend
 */

export interface User {
  id: string;
  email: string;
  created_at: Date;
  updated_at: Date;
  email_verified: boolean;
  ai_recommendations_enabled?: boolean;
}

export interface Visitor {
  id: string;
  user_id: string;
  visitor_id: string;
  first_touch_data: FirstTouchData;
  created_at: Date;
  updated_at: Date;
}

export interface Session {
  id: string;
  user_id: string;
  visitor_id: string;
  session_id: string;
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  referrer?: string;
  landing_page?: string;
  timestamp: Date;
}

export interface Purchase {
  id: string;
  user_id: string;
  visitor_id?: string;
  launch_id?: string;
  email: string;
  amount: number;
  currency: string;
  course_name?: string;
  platform: 'kajabi' | 'teachable' | 'skool' | 'stripe';
  platform_purchase_id: string;
  purchased_at: Date;
  created_at: Date;
  first_touch_source?: string;
  first_touch_medium?: string;
  first_touch_campaign?: string;
  last_touch_source?: string;
  last_touch_medium?: string;
  last_touch_campaign?: string;
  match_method?: string;
  device_fingerprint?: string;
}

export interface Launch {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_date: Date;
  end_date: Date;
  status: 'upcoming' | 'active' | 'completed' | 'archived';
  revenue_goal?: number;
  sales_goal?: number;
  share_enabled: boolean;
  share_token?: string;
  share_password?: string;
  share_expires_at?: Date;
  cached_revenue?: number;
  cached_students?: number;
  cached_conversion_rate?: number;
  created_at: Date;
  updated_at: Date;
}

export interface PlatformIntegration {
  id: string;
  user_id: string;
  platform: 'kajabi' | 'teachable' | 'skool';
  encrypted_access_token: string;
  encrypted_refresh_token?: string;
  status: 'active' | 'disconnected' | 'error';
  webhook_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface FirstTouchData {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  referrer?: string;
  landingPage?: string;
  timestamp?: Date;
}

export interface UTMParameters {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
}

export interface AttributionData extends UTMParameters {
  referrer?: string;
  landingPage?: string;
  timestamp?: Date;
}

export interface RevenueBySource {
  source: string;
  revenue: number;
  visitors: number;
  students: number;
  purchases: number;
  conversionRate: string;
  avgOrderValue: string;
  revenuePerVisitor: string;
}

export interface RevenueSummary {
  totalRevenue: number;
  totalStudents: number;
  totalPurchases: number;
  avgOrderValue: number;
  trends?: {
    revenue: number;
    students: number;
    avgOrderValue: number;
  };
}

export interface DateRange {
  start: Date;
  end: Date;
}

export type SortOrder = 'asc' | 'desc';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
