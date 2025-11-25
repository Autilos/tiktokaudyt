// Video Analyzer Edge Function - UPDATED WITH CLAUDE 3.5 SONNET
// Analyzes individual TikTok videos with comments using Claude AI
// Cost: ~3-6 PLN per 100 comments (Claude 3.5 Sonnet pricing)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Anthropic from "npm:@anthropic-ai/sdk@^0.20.0";

// Helper function to calculate comment stats (inline to avoid import issues)
interface CommentForStats {
  digg_count: number;
  reply_comment_total: number;
  liked_by_author: boolean;
  pinned_by_author: boolean;
}

function calculateStatsFromComments(comments: CommentForStats[]) {
  const commentsLikesTotal = comments.reduce((sum, c) => sum + (c.digg_count || 0), 0);
  const commentsWithRepliesCount = comments.filter(c => (c.reply_comment_total || 0) > 0).length;
  const commentsWithRepliesRatio = comments.length > 0 ? commentsWithRepliesCount / comments.length : 0;
  const commentsLikedByAuthorCount = comments.filter(c => c.liked_by_author).length;
  const commentsPinnedCount = comments.filter(c => c.pinned_by_author).length;

  return {
    commentsLikesTotal,
    commentsWithRepliesCount,
    commentsWithRepliesRatio: parseFloat(commentsWithRepliesRatio.toFixed(4)),
    commentsLikedByAuthorCount,
    commentsPinnedCount
  };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Client for database operations - uses service role to bypass RLS
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    // Get authenticated user via direct API call (optional - demo mode works without)
    const authHeader = req.headers.get("Authorization");
    console.log('🔐 Checking authentication...');
    console.log('  - Authorization header:', authHeader ? 'PRESENT' : 'MISSING');

    let user: { id: string; email?: string } | null = null;
    let isDemoMode = false;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Demo mode - no authentication required
      console.log('🎭 Demo mode: No authentication header, proceeding without user');
      isDemoMode = true;
    } else {
      const token = authHeader.replace('Bearer ', '');

      // Verify user via Supabase Auth API
      const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': serviceRoleKey
        }
      });

      if (!userResponse.ok) {
        // Token invalid - fallback to demo mode
        console.warn('⚠️ Auth verification failed, falling back to demo mode:', userResponse.status);
        isDemoMode = true;
      } else {
        user = await userResponse.json();
        console.log('👤 Auth result:', { hasUser: !!user, userId: user?.id });

        if (!user || !user.id) {
          console.warn('⚠️ No user found, falling back to demo mode');
          isDemoMode = true;
        }
      }
    }

    if (isDemoMode) {
      console.log('🎭 Running in demo mode (no user tracking)');
    } else {
      console.log('✅ User authenticated:', user?.id);
    }

    const { videoId, videoUrl, comments, profileVideos } = await req.json();

    if (!videoId && !videoUrl) {
      return new Response(
        JSON.stringify({ error: "videoId or videoUrl is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    if (!comments || !Array.isArray(comments)) {
      return new Response(
        JSON.stringify({ error: "comments array is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Find the video in profileVideos
    let video = null;
    if (profileVideos && Array.isArray(profileVideos)) {
      video = profileVideos.find(
        (v) => v.id === videoId || v.webVideoUrl === videoUrl
      ) || null;
    }

    // COMMENTS-ONLY MODE: If no video found, analyze only comments (no video metrics)
    const commentsOnlyMode = !video;
    console.log('🎬 Analysis mode:', commentsOnlyMode ? 'COMMENTS-ONLY' : 'FULL (video + comments)');

    // Calculate video metrics (or defaults for comments-only mode)
    const views = video?.playCount || 0;
    const likes = video?.diggCount || 0;
    const commentsCount = video?.commentCount || 0;
    const shares = video?.shareCount || 0;
    const saves = video?.collectCount || 0;
    const durationSec = video?.videoMeta?.duration || 0;
    const engagementRate = views > 0
      ? (likes + commentsCount + shares + saves) / views
      : 0;

    // Calculate profile averages if available
    let profileAvg = {
      avgEngagementRate: 0,
      avgDurationSec: 0,
      avgViews: 0
    };

    if (profileVideos && profileVideos.length > 0 && !commentsOnlyMode) {
      const totalVideos = profileVideos.length;
      let totalER = 0;
      let totalDuration = 0;
      let totalViews = 0;

      profileVideos.forEach((v) => {
        const vViews = v.playCount || 0;
        const vLikes = v.diggCount || 0;
        const vComments = v.commentCount || 0;
        const vShares = v.shareCount || 0;
        const vSaves = v.collectCount || 0;
        const vER = vViews > 0
          ? (vLikes + vComments + vShares + vSaves) / vViews
          : 0;

        totalER += vER;
        totalDuration += v.videoMeta?.duration || 0;
        totalViews += vViews;
      });

      profileAvg = {
        avgEngagementRate: totalER / totalVideos,
        avgDurationSec: totalDuration / totalVideos,
        avgViews: totalViews / totalVideos
      };
    }

    // Calculate comment metrics
    const totalComments = comments.length;
    const authorId = video?.authorMeta?.id || null;
    const commentsWithReplies = comments.filter(
      (c) => (c.replyCommentTotal || 0) > 0
    ).length;
    const replyComments = comments.filter((c) => !!c.repliesToId);
    const authorReplies = authorId
      ? replyComments.filter((c) => c.uid === authorId).length
      : 0;

    const pctCommentsWithReplies = totalComments > 0
      ? commentsWithReplies / totalComments
      : 0;
    const pctCommentsWithAuthorReply = totalComments > 0
      ? authorReplies / totalComments
      : 0;

    // Prepare top comments sample for LLM
    const sortedByLikes = [...comments].sort(
      (a, b) => (b.diggCount || 0) - (a.diggCount || 0)
    );
    const topCommentsSample = sortedByLikes.slice(0, 30); // Optymalizacja: 30 komentarzy wystarczy dla szybkiej analizy

    // Build summaries for LLM
    const videoStatsSummary = commentsOnlyMode ? `
Wideo: ${videoUrl || 'URL niedostępny'}
UWAGA: Tryb analizy TYLKO KOMENTARZY - brak metryk wideo (wyświetlenia, polubienia itp.)
Analizujemy jedynie dostępne komentarze pod tym filmem.
` : `
Wideo: ${video.webVideoUrl}
Opis: ${video.text || "Brak opisu"}

Statystyki:
- Wyświetlenia: ${views.toLocaleString()}
- Łączne interakcje (polubienia, komentarze, udostępnienia, zapisy): ${(likes + commentsCount + shares + saves).toLocaleString()}
- Współczynnik zaangażowania: ${(engagementRate * 100).toFixed(1)}%
- Długość filmu: około ${Math.round(durationSec)} sekund

Na tle średniej profilu:
- Średnie wyświetlenia w profilu: ${Math.round(profileAvg.avgViews).toLocaleString()}
- Średni współczynnik zaangażowania w profilu: ${(profileAvg.avgEngagementRate * 100).toFixed(1)}%
- Średnia długość filmów w profilu: około ${Math.round(profileAvg.avgDurationSec)} sekund
`;

    const commentStatsSummary = `
Komentarze:
- Liczba komentarzy: ${totalComments}
- Komentarze z odpowiedziami (jakiekolwiek reply): ${(pctCommentsWithReplies * 100).toFixed(0)}% wszystkich komentarzy
- Odpowiedzi autora (jeśli dostępne): ${(pctCommentsWithAuthorReply * 100).toFixed(0)}% komentarzy ma odpowiedź od autora lub jego konta.

Poniżej top ${topCommentsSample.length} komentarzy (od najbardziej lajkowanych):
${topCommentsSample.map((c) =>
  `• (${c.diggCount || 0} 👍) @${c.uniqueId}: "${c.text}"`
).join("\n")}
`;

    // NOWE PROMPTY - CLAUDE 3.5 SONNET
    const systemMessage = `Jesteś ekspertem od analizy komentarzy na TikTok i strategii content marketingu.

Twoim zadaniem jest dogłębna analiza komentarzy pod filmem TikTok i wyciągnięcie praktycznych, actionable insights.

ZASADY ANALIZY:
1. Czytaj między wierszami - wyciągaj ukryte potrzeby i emocje widzów
2. Identyfikuj wzorce - powtarzające się pytania, tematy, obawy
3. Szukaj możliwości biznesowych - produkty, które można promować, problemy do rozwiązania
4. Wykrywaj sygnały ostrzegawcze - kontrowersje, negatywne reakcje, potencjalne kryzysy
5. Generuj konkretne pomysły - nie ogólniki, ale specific content ideas

ANALIZA POWINNA ZAWIERAĆ:
- Pytania widzów (audience_questions): Konkretne pytania, które zadają widzowie. Każde pytanie to potencjalny pomysł na nowy film.
- Feedback produktowy (product_feedback): Opinie o produktach/usługach wspomnianych w filmie. Co ludzie chcą kupić? Co ich powstrzymuje?
- Pomysły na treści (content_ideas_from_comments): Konkretne tematy na nowe filmy wynikające z komentarzy. Format: "Film o [temat] bo widzowie pytają o [co]"
- Kontrowersje i ryzyka (controversies_and_risks): Negatywne reakcje, potencjalne problemy, rzeczy które mogą zaszkodzić reputacji
- Jakość dyskusji (comment_engagement_text): Ogólna ocena poziomu zaangażowania - czy ludzie dyskutują merytorycznie, czy tylko spamują emoji?

${commentsOnlyMode ? `
UWAGA: Tryb COMMENTS-ONLY - nie masz metryk wideo (wyświetlenia, polubienia filmu).
Dla pól video_summary, performance_text, format_insights_text - pozostaw puste stringi "" (nie wspominaj o ograniczeniach).
Skup się całkowicie na analizie komentarzy.
` : `
Masz dostęp do metryk wideo (wyświetlenia, interakcje, długość) - wykorzystaj je w analizie.
`}

WAŻNE:
- Jeśli w danej kategorii nie ma wartościowych insightów, zwróć pustą tablicę [] lub pusty obiekt zamiast wymyślać
- Każdy insight powinien być konkretny i actionable
- Unikaj ogólników typu "widzowie są zainteresowani"
- Cytuj konkretne komentarze jeśli to wzmacnia argument

ZAWSZE odpowiadaj w formacie JSON. Zacznij odpowiedź od { i zakończ na }.`;

    const userMessage = `Przeanalizuj ${commentsOnlyMode ? 'komentarze pod wideo TikTok' : 'wideo TikTok oraz komentarze'}.

${commentsOnlyMode ? '' : 'DANE WIDEO:\n'}${videoStatsSummary}

DANE O KOMENTARZACH:
${commentStatsSummary}

LISTA KOMENTARZY DO ANALIZY (JSON):
${JSON.stringify(
  topCommentsSample.map((c) => ({
    text: c.text,
    diggCount: c.diggCount || 0,
    uniqueId: c.uniqueId,
    replyCommentTotal: c.replyCommentTotal || 0
  })),
  null,
  2
)}

ZADANIE:
Przeanalizuj te komentarze i zwróć JSON z następującymi polami:

{
  "video_summary": "Krótkie podsumowanie o czym jest film na podstawie komentarzy (2-3 zdania)",
  "performance_text": "Analiza wydajności filmu - czy engagement jest wysoki/niski, czy komentarze są wartościowe (2-3 zdania)",
  "format_insights_text": "Wnioski o formacie filmu wynikające z komentarzy - co ludzie chwalą/krytykują (2-3 zdania)",
  "cta_effectiveness_text": "Czy CTA w filmie działa? Czy ludzie wykonują pożądaną akcję? (2-3 zdania)",
  "cta_examples_suggestions": ["Konkretne przykłady CTA które można dodać na podstawie reakcji widzów"],
  "comment_engagement_text": "Jakość dyskusji w komentarzach - czy są merytoryczne, czy spam (2-3 zdania)",
  "audience_questions": [
    {
      "question": "sformułowane pytanie",
      "question_type": "produkt | dostępność | trwałość | zamiennik | cena | inne",
      "representative_comments": ["pełny tekst komentarza 1", "pełny tekst komentarza 2"],
      "business_priority": "wysoki | średni | niski",
      "suggested_answer_points": ["punkt 1", "punkt 2"]
    }
  ],
  "product_feedback": {
    "summary": "krótkie podsumowanie feedbacku produktowego",
    "positive_points": ["co się podoba"],
    "negative_points": ["co się nie podoba"],
    "price_perception": "jak cena jest postrzegana",
    "quality_perception": "jak jakość jest postrzegana",
    "key_quotes": ["cytaty z komentarzy - pełne teksty"]
  },
  "content_ideas_from_comments": [
    {
      "idea_title": "krótki tytuł pomysłu na film",
      "idea_type": "FAQ | recenzja | porównanie | lista | storytelling | inne",
      "based_on_comments": ["komentarz 1", "komentarz 2"],
      "short_description": "co ma się wydarzyć w filmie",
      "cta_suggestion": "propozycja CTA do tego filmu"
    }
  ],
  "controversies_and_risks": {
    "has_controversy": true | false,
    "main_topics": ["temat 1", "temat 2"],
    "risk_level": "niski | średni | wysoki",
    "description": "opis kontrowersji i ryzyk",
    "example_comments": ["pełne komentarze pokazujące kontrowersję"],
    "recommendations": ["co zrobić, jak odpowiadać"]
  }
}

WAŻNE: Jeśli w danej kategorii nie ma wartościowych danych, zwróć pustą tablicę [] lub pusty obiekt.

Odpowiedz TYLKO w formacie JSON, bez dodatkowego tekstu. Zacznij od { i zakończ na }.`;

    // Initialize Anthropic client
    console.log('🤖 Initializing Claude 3.5 Sonnet...');
    const anthropic = new Anthropic({
      apiKey: Deno.env.get("ANTHROPIC_API_KEY")
    });

    // Call Claude API
    console.log('📤 Sending request to Claude API...');
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 3500,
      temperature: 0.5,
      system: systemMessage,
      messages: [
        {
          role: "user",
          content: userMessage
        }
      ]
    });

    console.log('📥 Received response from Claude API');

    // Parse response
    const responseText = response.content[0].text;
    console.log('📄 Response length:', responseText.length, 'characters');

    // Clean up response (remove markdown code blocks and extra text)
    let cleanedText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Try to extract JSON if there's extra text
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }

    let llmResult;
    try {
      llmResult = JSON.parse(cleanedText);
      console.log('✅ Successfully parsed JSON response');
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError);
      console.error('📝 Raw response (first 500 chars):', responseText.substring(0, 500));
      console.error('📝 Cleaned text (first 500 chars):', cleanedText.substring(0, 500));
      console.error('📝 Response end (last 200 chars):', responseText.substring(Math.max(0, responseText.length - 200)));
      throw new Error('Failed to parse LLM response as JSON');
    }

    // Calculate cost: Claude 3.5 Sonnet pricing
    // Input: $3 / 1M tokens, Output: $15 / 1M tokens
    // Estimate: ~500 tokens per audit = ~$0.03-0.06
    const estimatedTokens = totalComments * 10; // Rough estimate
    const costPln = (estimatedTokens / 1000000) * 3 * 4; // Convert USD to PLN (~4 PLN/USD)

    // Calculate comment stats for database
    const commentStatsForDB = calculateStatsFromComments(
      comments.map((c) => ({
        digg_count: c.diggCount || 0,
        reply_comment_total: c.replyCommentTotal || 0,
        liked_by_author: c.likedByAuthor || false,
        pinned_by_author: c.pinnedByAuthor || false
      }))
    );

    console.log("📈 Calculated comment stats:", commentStatsForDB);

    // Save to database (skip user_id in demo mode - it's UUID type)
    const auditRecord = {
      user_id: user?.id || null,
      video_id: video?.id || null,
      video_url: videoUrl || video?.webVideoUrl || '',
      video_caption: video?.text || "",
      author_username: video?.authorMeta?.name || video?.authorMeta?.nickName || "",
      author_followers: video?.authorMeta?.fans || 0,
      views: commentsOnlyMode ? null : views,
      likes: commentsOnlyMode ? null : likes,
      comments_count: commentsOnlyMode ? null : commentsCount,
      shares: commentsOnlyMode ? null : shares,
      saves: commentsOnlyMode ? null : saves,
      duration_seconds: commentsOnlyMode ? null : Math.round(durationSec),
      engagement_rate: commentsOnlyMode ? null : parseFloat(engagementRate.toFixed(4)),
      total_comments_analyzed: totalComments,
      comments_with_replies_pct: parseFloat((pctCommentsWithReplies * 100).toFixed(2)),
      author_replies_pct: parseFloat((pctCommentsWithAuthorReply * 100).toFixed(2)),
      profile_avg_engagement_rate: commentsOnlyMode ? null : parseFloat(profileAvg.avgEngagementRate.toFixed(4)),
      profile_avg_views: commentsOnlyMode ? null : Math.round(profileAvg.avgViews),
      profile_avg_duration: commentsOnlyMode ? null : Math.round(profileAvg.avgDurationSec),
      audit_data: llmResult,
      cost_pln: parseFloat(costPln.toFixed(2)),
      comments_likes_total: commentStatsForDB.commentsLikesTotal,
      comments_with_replies_count: commentStatsForDB.commentsWithRepliesCount,
      comments_with_replies_ratio: commentStatsForDB.commentsWithRepliesRatio,
      comments_liked_by_author_count: commentStatsForDB.commentsLikedByAuthorCount,
      comments_pinned_count: commentStatsForDB.commentsPinnedCount
    };

    const { data: savedAudit, error: saveError } = await supabaseClient
      .from("video_audits")
      .insert(auditRecord)
      .select()
      .single();

    if (saveError) {
      console.error("Error saving video audit:", saveError);
      throw saveError;
    }

    console.log('✅ Video audit saved:', savedAudit.id);

    // Save all comments to video_comments table
    console.log('💾 Saving comments to database...');
    const videoAuthorUsername = video?.authorMeta?.name || video?.authorMeta?.nickName || "";
    const videoAuthorId = video?.authorMeta?.id || null;

    const commentsToInsert = comments.map((comment) => ({
      video_audit_id: savedAudit.id,
      video_url: videoUrl || video?.webVideoUrl || '',
      video_id: video?.id || null,
      video_author_username: videoAuthorUsername,
      video_author_id: videoAuthorId,
      comment_id: comment.cid,
      comment_text: comment.text || '',
      comment_author_username: comment.uniqueId || '',
      comment_author_uid: comment.uid || '',
      digg_count: comment.diggCount || 0,
      reply_comment_total: comment.replyCommentTotal || 0,
      liked_by_author: comment.likedByAuthor || false,
      pinned_by_author: comment.pinnedByAuthor || false,
      is_reply: !!comment.repliesToId,
      replies_to_id: comment.repliesToId || null,
      create_time_iso: comment.createTimeISO || null,
      user_id: user?.id || null,
      session_id: savedAudit.id
    }));

    const { error: commentsError } = await supabaseClient
      .from("video_comments")
      .insert(commentsToInsert);

    if (commentsError) {
      console.error("Error saving comments:", commentsError);
      // Don't throw - audit is already saved
    } else {
      console.log(`✅ Saved ${commentsToInsert.length} comments to database`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        audit: savedAudit,
        comments_only_mode: commentsOnlyMode,
        model_used: "claude-sonnet-4-5",
        metrics: {
          views: commentsOnlyMode ? null : views,
          likes: commentsOnlyMode ? null : likes,
          comments_count: commentsOnlyMode ? null : commentsCount,
          shares: commentsOnlyMode ? null : shares,
          saves: commentsOnlyMode ? null : saves,
          engagement_rate: commentsOnlyMode ? null : parseFloat((engagementRate * 100).toFixed(2)),
          total_comments_analyzed: totalComments,
          comments_with_replies_pct: parseFloat((pctCommentsWithReplies * 100).toFixed(2)),
          author_replies_pct: parseFloat((pctCommentsWithAuthorReply * 100).toFixed(2))
        },
        commentStats: commentStatsForDB,
        llm_analysis: llmResult
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error in video-analyzer function:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
