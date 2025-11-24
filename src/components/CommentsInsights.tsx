import { HelpCircle, Users, Lightbulb, AlertTriangle } from 'lucide-react';

// Types matching backend structure (using string for flexibility with LLM responses)
export interface AudienceQuestion {
  question: string;
  question_type: string;
  representative_comments: string[];
  business_priority: string;
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

export interface ControversiesAndRisks {
  has_controversy: boolean;
  main_topics: string[];
  risk_level: string;
  description: string;
  example_comments: string[];
  recommendations: string[];
}

export interface SummaryForUI {
  sentiment?: string;
  summaryText?: string;
  topQuestionsCount?: number;
  contentIdeasCount?: number;
  hasControversy?: boolean;
  riskLevel?: string;
  positivePointsCount?: number;
  negativePointsCount?: number;
}

interface CommentsInsightsProps {
  summary?: string;
  sentiment?: string;
  audience_questions?: AudienceQuestion[];
  product_feedback?: ProductFeedback;
  content_ideas_from_comments?: ContentIdea[];
  controversies_and_risks?: ControversiesAndRisks;
  summaryForUI?: SummaryForUI;
}

export function CommentsInsights({
  summary,
  sentiment,
  audience_questions = [],
  product_feedback,
  content_ideas_from_comments = [],
  controversies_and_risks,
  summaryForUI
}: CommentsInsightsProps) {
  const hasAnyInsights =
    audience_questions.length > 0 ||
    product_feedback ||
    content_ideas_from_comments.length > 0 ||
    controversies_and_risks?.has_controversy ||
    summary;

  if (!hasAnyInsights) {
    return null;
  }

  // Calculate counts from data or use summaryForUI
  const topQuestionsCount = summaryForUI?.topQuestionsCount ?? audience_questions.length;
  const contentIdeasCount = summaryForUI?.contentIdeasCount ?? content_ideas_from_comments.length;
  const positivePointsCount = summaryForUI?.positivePointsCount ?? (product_feedback?.positive_points?.length ?? 0);
  const negativePointsCount = summaryForUI?.negativePointsCount ?? (product_feedback?.negative_points?.length ?? 0);
  const hasControversy = summaryForUI?.hasControversy ?? controversies_and_risks?.has_controversy;
  const riskLevel = summaryForUI?.riskLevel ?? controversies_and_risks?.risk_level ?? 'niski';
  const displaySentiment = summaryForUI?.sentiment ?? sentiment ?? 'neutral';
  const displaySummary = summaryForUI?.summaryText ?? summary;

  const topQuestions = audience_questions.slice(0, 3);
  const contentIdeas = content_ideas_from_comments.slice(0, 3);
  const positivePoints = product_feedback?.positive_points?.slice(0, 3) ?? [];
  const negativePoints = product_feedback?.negative_points?.slice(0, 3) ?? [];

  const getSentimentLabel = (s: string) => {
    switch (s) {
      case 'positive': return 'Pozytywny';
      case 'negative': return 'Negatywny';
      case 'mixed': return 'Mieszany';
      default: return 'Neutralny';
    }
  };

  const getSentimentColor = (s: string) => {
    switch (s) {
      case 'positive': return 'bg-green-500/10 text-green-300 border-green-700';
      case 'negative': return 'bg-red-500/10 text-red-300 border-red-700';
      case 'mixed': return 'bg-yellow-500/10 text-yellow-300 border-yellow-700';
      default: return 'bg-gray-500/10 text-gray-300 border-gray-700';
    }
  };

  return (
    <section className="mt-8">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">
          Analiza komentarzy
        </h2>
      </div>

      {/* 2x2 Grid of insights boxes */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 1. Najczestsze pytania widzow */}
        <div className="flex flex-col gap-3 rounded-xl border border-blue-800 bg-blue-900/20 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-blue-300 flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              Najczestsze pytania widzow
            </h3>
            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-300">
              {topQuestionsCount} pytan
            </span>
          </div>

          {topQuestions.length === 0 ? (
            <p className="text-xs text-gray-400">
              Brak wyraznych pytan w komentarzach.
            </p>
          ) : (
            <ul className="space-y-2 text-xs text-gray-200">
              {topQuestions.map((q, idx) => (
                <li key={idx} className="rounded-lg bg-blue-950/50 p-2">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="font-medium text-blue-100">{q.question}</p>
                    <span className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                      q.business_priority === 'wysoki' ? 'bg-red-900/50 text-red-300' :
                      q.business_priority === 'sredni' ? 'bg-yellow-900/50 text-yellow-300' :
                      'bg-gray-800 text-gray-300'
                    }`}>
                      {q.business_priority}
                    </span>
                  </div>
                  {q.suggested_answer_points?.length > 0 && (
                    <ul className="ml-3 list-disc text-[11px] text-gray-400">
                      {q.suggested_answer_points.slice(0, 2).map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 2. Feedback produktowy */}
        <div className="flex flex-col gap-3 rounded-xl border border-green-800 bg-green-900/20 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-green-300 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Feedback produktowy
            </h3>
            <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-300">
              +{positivePointsCount} / -{negativePointsCount}
            </span>
          </div>

          {product_feedback?.summary && (
            <p className="text-xs text-gray-200">
              {product_feedback.summary}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div>
              <p className="mb-1 font-medium text-green-300">Co dziala:</p>
              <ul className="space-y-1 text-gray-300">
                {positivePoints.length === 0 ? (
                  <li className="text-gray-500">Brak mocnych plusow.</li>
                ) : (
                  positivePoints.map((p, i) => <li key={i}>• {p}</li>)
                )}
              </ul>
            </div>
            <div>
              <p className="mb-1 font-medium text-red-300">Co boli:</p>
              <ul className="space-y-1 text-gray-300">
                {negativePoints.length === 0 ? (
                  <li className="text-gray-500">Brak istotnych zarzutow.</li>
                ) : (
                  negativePoints.map((p, i) => <li key={i}>• {p}</li>)
                )}
              </ul>
            </div>
          </div>

          {(product_feedback?.price_perception || product_feedback?.quality_perception) && (
            <div className="mt-2 grid grid-cols-2 gap-3 text-[11px] text-gray-400">
              {product_feedback?.price_perception && (
                <p>
                  <span className="font-medium text-gray-300">Cena: </span>
                  {product_feedback.price_perception}
                </p>
              )}
              {product_feedback?.quality_perception && (
                <p>
                  <span className="font-medium text-gray-300">Jakosc: </span>
                  {product_feedback.quality_perception}
                </p>
              )}
            </div>
          )}
        </div>

        {/* 3. Pomysly na nowe filmy */}
        <div className="flex flex-col gap-3 rounded-xl border border-purple-800 bg-purple-900/20 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Pomysly na nowe filmy
            </h3>
            <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-xs text-purple-300">
              {contentIdeasCount} propozycji
            </span>
          </div>

          {contentIdeas.length === 0 ? (
            <p className="text-xs text-gray-400">
              Brak wyraznych tematow na nowe tresci w komentarzach.
            </p>
          ) : (
            <ul className="space-y-2 text-xs text-gray-200">
              {contentIdeas.map((idea, idx) => (
                <li key={idx} className="rounded-lg bg-purple-950/50 p-2">
                  <p className="font-medium text-purple-100">{idea.idea_title}</p>
                  <p className="mt-1 text-[11px] text-gray-400">
                    {idea.short_description}
                  </p>
                  {idea.cta_suggestion && (
                    <p className="mt-1 text-[11px] text-gray-500">
                      CTA: <span className="italic">{idea.cta_suggestion}</span>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 4. Kontrowersje i ryzyka */}
        <div className="flex flex-col gap-3 rounded-xl border border-amber-800 bg-amber-900/20 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Kontrowersje i ryzyka
            </h3>
            <span className={`rounded-full px-2 py-0.5 text-xs ${
              hasControversy
                ? riskLevel === 'wysoki'
                  ? 'bg-red-500/10 text-red-300'
                  : 'bg-amber-500/10 text-amber-300'
                : 'bg-green-500/10 text-green-300'
            }`}>
              {hasControversy
                ? `Ryzyko: ${riskLevel}`
                : 'Brak kontrowersji'}
            </span>
          </div>

          {hasControversy ? (
            <>
              {controversies_and_risks?.description && (
                <p className="text-xs text-gray-200">
                  {controversies_and_risks.description}
                </p>
              )}

              {controversies_and_risks?.main_topics && controversies_and_risks.main_topics.length > 0 && (
                <div className="text-[11px] text-gray-300">
                  <p className="mb-1 font-medium text-gray-200">Glowne tematy:</p>
                  <div className="flex flex-wrap gap-1">
                    {controversies_and_risks.main_topics.map((topic, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-gray-800 px-2 py-0.5 text-[10px]"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {controversies_and_risks?.recommendations && controversies_and_risks.recommendations.length > 0 && (
                <div className="text-[11px]">
                  <p className="mb-1 font-medium text-gray-200">Rekomendacje:</p>
                  <ul className="list-disc space-y-1 pl-4 text-gray-300">
                    {controversies_and_risks.recommendations.slice(0, 3).map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-400">
              Komentarze nie wskazuja na istotne ryzyka reputacyjne ani produktowe.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
