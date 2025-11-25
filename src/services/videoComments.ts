import { supabase } from '../lib/supabaseClient';
import type { VideoComment, ServiceResponse, PaginatedResponse } from './types';

/**
 * Get comments for a video audit
 */
export async function getVideoAuditComments(
  videoAuditId: string,
  options?: {
    limit?: number;
    offset?: number;
    orderBy?: 'digg_count' | 'created_at' | 'reply_comment_total';
    orderDirection?: 'asc' | 'desc';
  }
): Promise<PaginatedResponse<VideoComment>> {
  const orderBy = options?.orderBy || 'digg_count';
  const orderDirection = options?.orderDirection === 'asc';

  let query = supabase
    .from('video_comments')
    .select('*', { count: 'exact' })
    .eq('video_audit_id', videoAuditId)
    .order(orderBy, { ascending: orderDirection });

  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  const { data, count, error } = await query;

  return {
    data: data || [],
    count: count || 0,
    error
  };
}

/**
 * Get single comment by ID
 */
export async function getComment(commentId: string): Promise<ServiceResponse<VideoComment>> {
  const { data, error } = await supabase
    .from('video_comments')
    .select('*')
    .eq('id', commentId)
    .single();

  return { data, error };
}

/**
 * Create multiple comments (batch insert)
 */
export async function createComments(
  comments: Omit<VideoComment, 'id' | 'created_at'>[]
): Promise<ServiceResponse<VideoComment[]>> {
  const { data, error } = await supabase
    .from('video_comments')
    .insert(comments)
    .select();

  return { data: data || [], error };
}

/**
 * Get top comments by likes
 */
export async function getTopCommentsByLikes(
  videoAuditId: string,
  limit = 30
): Promise<ServiceResponse<VideoComment[]>> {
  const { data, error } = await supabase
    .from('video_comments')
    .select('*')
    .eq('video_audit_id', videoAuditId)
    .order('digg_count', { ascending: false })
    .limit(limit);

  return { data: data || [], error };
}

/**
 * Get comments with replies
 */
export async function getCommentsWithReplies(
  videoAuditId: string,
  limit = 50
): Promise<ServiceResponse<VideoComment[]>> {
  const { data, error } = await supabase
    .from('video_comments')
    .select('*')
    .eq('video_audit_id', videoAuditId)
    .gt('reply_comment_total', 0)
    .order('reply_comment_total', { ascending: false })
    .limit(limit);

  return { data: data || [], error };
}

/**
 * Get comments liked by author
 */
export async function getAuthorLikedComments(
  videoAuditId: string
): Promise<ServiceResponse<VideoComment[]>> {
  const { data, error } = await supabase
    .from('video_comments')
    .select('*')
    .eq('video_audit_id', videoAuditId)
    .eq('liked_by_author', true)
    .order('digg_count', { ascending: false });

  return { data: data || [], error };
}

/**
 * Get pinned comments
 */
export async function getPinnedComments(
  videoAuditId: string
): Promise<ServiceResponse<VideoComment[]>> {
  const { data, error } = await supabase
    .from('video_comments')
    .select('*')
    .eq('video_audit_id', videoAuditId)
    .eq('pinned_by_author', true);

  return { data: data || [], error };
}

/**
 * Search comments by text
 */
export async function searchComments(
  videoAuditId: string,
  searchText: string,
  limit = 50
): Promise<ServiceResponse<VideoComment[]>> {
  const { data, error } = await supabase
    .from('video_comments')
    .select('*')
    .eq('video_audit_id', videoAuditId)
    .ilike('comment_text', `%${searchText}%`)
    .order('digg_count', { ascending: false })
    .limit(limit);

  return { data: data || [], error };
}

/**
 * Get comments by author
 */
export async function getCommentsByAuthor(
  videoAuditId: string,
  authorUsername: string
): Promise<ServiceResponse<VideoComment[]>> {
  const { data, error } = await supabase
    .from('video_comments')
    .select('*')
    .eq('video_audit_id', videoAuditId)
    .eq('comment_author_username', authorUsername)
    .order('created_at', { ascending: false });

  return { data: data || [], error };
}

/**
 * Get reply comments (comments that are replies to other comments)
 */
export async function getReplyComments(
  videoAuditId: string,
  limit = 50
): Promise<ServiceResponse<VideoComment[]>> {
  const { data, error } = await supabase
    .from('video_comments')
    .select('*')
    .eq('video_audit_id', videoAuditId)
    .eq('is_reply', true)
    .order('digg_count', { ascending: false })
    .limit(limit);

  return { data: data || [], error };
}

/**
 * Get comment statistics for a video audit
 */
export async function getCommentStats(videoAuditId: string) {
  const { data: comments } = await supabase
    .from('video_comments')
    .select('digg_count, reply_comment_total, liked_by_author, pinned_by_author, is_reply')
    .eq('video_audit_id', videoAuditId);

  if (!comments || comments.length === 0) {
    return {
      totalComments: 0,
      totalLikes: 0,
      commentsWithReplies: 0,
      authorLikedCount: 0,
      pinnedCount: 0,
      replyComments: 0
    };
  }

  return {
    totalComments: comments.length,
    totalLikes: comments.reduce((sum, c) => sum + (c.digg_count || 0), 0),
    commentsWithReplies: comments.filter(c => (c.reply_comment_total || 0) > 0).length,
    authorLikedCount: comments.filter(c => c.liked_by_author).length,
    pinnedCount: comments.filter(c => c.pinned_by_author).length,
    replyComments: comments.filter(c => c.is_reply).length
  };
}
