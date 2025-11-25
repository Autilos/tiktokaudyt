// Database types for Supabase tables

export interface AppUser {
  id?: string;
  user_id: string;
  email: string;
  role: 'user' | 'admin';
  created_at?: string;
  updated_at?: string;
}

export interface Subscription {
  id?: string;
  user_id: string;
  plan: 'free' | 'basic' | 'pro' | 'unlimited';
  limit_events: number;
  price_pln: number;
  status: 'active' | 'inactive' | 'cancelled';
  starts_at?: string;
  ends_at?: string;
  created_at?: string;
}

export interface Run {
  id?: string;
  user_id: string;
  mode: 'hashtag' | 'profile' | 'search' | 'video';
  inputs: string[];
  results_count: number;
  cost_usd?: number;
  job_id?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error_message?: string;
  created_at?: string;
}

export interface VideoAudit {
  id?: string;
  user_id: string;
  video_id?: string;
  video_url: string;
  video_caption?: string;
  author_username?: string;
  author_followers?: number;
  views?: number;
  likes?: number;
  comments_count?: number;
  shares?: number;
  saves?: number;
  duration_seconds?: number;
  engagement_rate?: number;
  total_comments_analyzed: number;
  comments_with_replies_pct?: number;
  author_replies_pct?: number;
  profile_avg_engagement_rate?: number;
  profile_avg_views?: number;
  profile_avg_duration?: number;
  audit_data: VideoAuditData;
  cost_pln?: number;
  comments_likes_total?: number;
  comments_with_replies_count?: number;
  comments_with_replies_ratio?: number;
  comments_liked_by_author_count?: number;
  comments_pinned_count?: number;
  created_at?: string;
}

export interface VideoAuditData {
  video_summary?: string;
  performance_text?: string;
  format_insights_text?: string;
  cta_effectiveness_text?: string;
  cta_examples_suggestions?: string[];
  comment_engagement_text?: string;
  audience_questions?: AudienceQuestion[];
  product_feedback?: ProductFeedback;
  content_ideas_from_comments?: ContentIdea[];
  controversies_and_risks?: ControversyRisk;
}

export interface AudienceQuestion {
  question: string;
  question_type: string;
  representative_comments: string[];
  business_priority: 'wysoki' | 'sredni' | 'niski';
  suggested_answer_points: string[];
}

export interface ProductFeedback {
  summary: string;
  positive_points: string[];
  negative_points: string[];
  price_perception: string;
  quality_perception: string;
  key_quotes: string[];
}

export interface ContentIdea {
  idea_title: string;
  idea_type: string;
  based_on_comments: string[];
  short_description: string;
  cta_suggestion: string;
}

export interface ControversyRisk {
  has_controversy: boolean;
  main_topics: string[];
  risk_level: 'niski' | 'sredni' | 'wysoki';
  description: string;
  example_comments: string[];
  recommendations: string[];
}

export interface VideoComment {
  id?: string;
  video_audit_id: string;
  video_url: string;
  video_id?: string;
  video_author_username?: string;
  video_author_id?: string;
  comment_id: string;
  comment_text: string;
  comment_author_username: string;
  comment_author_uid: string;
  digg_count: number;
  reply_comment_total: number;
  liked_by_author: boolean;
  pinned_by_author: boolean;
  is_reply: boolean;
  replies_to_id?: string;
  create_time_iso?: string;
  user_id: string;
  session_id: string;
  created_at?: string;
}

export interface ProfileAudit {
  id?: string;
  user_id: string;
  profile_username: string;
  profile_followers?: number;
  profile_following?: number;
  profile_likes?: number;
  profile_videos?: number;
  audit_data: ProfileAuditData;
  cost_pln?: number;
  created_at?: string;
}

export interface ProfileAuditData {
  profile_score?: number;
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  hashtag_feedback_text?: string;
  cta_analysis_text?: string;
  seo_analysis_text?: string;
  format_insights_text?: string;
  content_niche_alignment_text?: string;
}

// Service response types
export interface ServiceResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  error: Error | null;
}
