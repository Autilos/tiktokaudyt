# ULEPSZONE PROMPTY - AUDYT KOMENTARZY TIKTOK

## 1. ZMIANA MODELU

**Stary model:** `gpt-4o-mini`  
**Nowy model:** `gpt-4` (lub `gpt-4-turbo` dla lepszej wydajności)

```typescript
const response = await openai.chat.completions.create({
  model: "gpt-4",  // ZMIANA: z "gpt-4o-mini" na "gpt-4"
  temperature: 0.7,
  response_format: { type: "json_object" },
  messages: [
    { role: "system", content: systemMessage },
    { role: "user", content: userMessage }
  ]
});
```

---

## 2. ULEPSZONE PROMPTY

### System Message (Audyt Komentarzy)

```
Jesteś ekspertem od analizy komentarzy na TikTok i strategii content marketingu.

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

WAŻNE:
- Jeśli w danej kategorii nie ma wartościowych insightów, zwróć pustą tablicę [] zamiast wymyślać
- Każdy insight powinien być konkretny i actionable
- Unikaj ogólników typu "widzowie są zainteresowani"
- Cytuj konkretne komentarze jeśli to wzmacnia argument

Zawsze odpowiadaj TYLKO w formacie JSON zgodnym ze schematem.
```

### User Message Template

```typescript
const userMessage = `
Przeanalizuj komentarze pod filmem TikTok i wyciągnij praktyczne wnioski.

METRYKI FILMU:
- Wyświetlenia: ${metrics.views}
- Polubienia: ${metrics.likes}
- Komentarze: ${metrics.comments}
- Udostępnienia: ${metrics.shares}
- Engagement Rate: ${metrics.engagementRate}%

OPIS FILMU:
${videoCaption || 'Brak opisu'}

KOMENTARZE (${comments.length} komentarzy):
${comments.map((c, i) => `
${i + 1}. "${c.text}"
   - Polubienia: ${c.diggCount}
   - Odpowiedzi: ${c.replyCommentTotal}
   ${c.likedByAuthor ? '- ❤️ Polubione przez autora' : ''}
   ${c.pinnedByAuthor ? '- 📌 Przypięte przez autora' : ''}
`).join('\n')}

ZADANIE:
Przeanalizuj te komentarze i zwróć JSON z następującymi polami:
{
  "video_summary": "Krótkie podsumowanie o czym jest film na podstawie komentarzy (2-3 zdania)",
  "performance_text": "Analiza wydajności filmu - czy engagement jest wysoki/niski, czy komentarze są wartościowe (2-3 zdania)",
  "format_insights_text": "Wnioski o formacie filmu wynikające z komentarzy - co ludzie chwalą/krytykują (2-3 zdania)",
  "cta_effectiveness_text": "Czy CTA w filmie działa? Czy ludzie wykonują pożądaną akcję? (2-3 zdania)",
  "cta_examples_suggestions": ["Konkretne przykłady CTA które można dodać na podstawie reakcji widzów"],
  "comment_engagement_text": "Jakość dyskusji w komentarzach - czy są merytoryczne, czy spam (2-3 zdania)",
  "audience_questions": ["Konkretne pytania zadawane przez widzów - każde to pomysł na film"],
  "product_feedback": ["Feedback o produktach/usługach - co ludzie chcą kupić, jakie mają wątpliwości"],
  "content_ideas_from_comments": ["Konkretne pomysły na nowe filmy: 'Film o [X] bo widzowie pytają o [Y]'"],
  "controversies_and_risks": ["Negatywne reakcje, kontrowersje, potencjalne problemy wizerunkowe"]
}

WAŻNE: Jeśli w danej kategorii nie ma wartościowych danych, zwróć pustą tablicę [].
`;
```

---

## 3. SCHEMAT ODPOWIEDZI JSON

```typescript
type VideoAuditLLMResult = {
  video_summary: string;
  performance_text: string;
  format_insights_text: string;
  cta_effectiveness_text: string;
  cta_examples_suggestions: string[];
  comment_engagement_text: string;
  audience_questions: string[];
  product_feedback: string[];
  content_ideas_from_comments: string[];
  controversies_and_risks: string[];
};
```

---

## 4. IMPLEMENTACJA W SUPABASE EDGE FUNCTION

### Lokalizacja pliku
`supabase/functions/video-analyzer/index.ts`

### Kod do aktualizacji

```typescript
// Zmień model
const response = await openai.chat.completions.create({
  model: "gpt-4",  // ZMIANA: było "gpt-4o-mini"
  temperature: 0.7,
  response_format: { type: "json_object" },
  messages: [
    { role: "system", content: IMPROVED_SYSTEM_MESSAGE },
    { role: "user", content: constructUserMessage(videoData, comments) }
  ]
});

// Dodaj nowe prompty
const IMPROVED_SYSTEM_MESSAGE = `
Jesteś ekspertem od analizy komentarzy na TikTok i strategii content marketingu.
[... reszta promptu jak powyżej ...]
`;

function constructUserMessage(videoData, comments) {
  return `
Przeanalizuj komentarze pod filmem TikTok i wyciągnij praktyczne wnioski.
[... reszta promptu jak powyżej ...]
  `;
}
```

---

## 5. JAK WDROŻYĆ

### Krok 1: Zaloguj się do Supabase Dashboard
```
https://supabase.com/dashboard/project/xcbufsemfbklgbcmkitn
```

### Krok 2: Przejdź do Edge Functions
```
Edge Functions → video-analyzer → Edit
```

### Krok 3: Zaktualizuj kod
1. Zmień `model: "gpt-4o-mini"` na `model: "gpt-4"`
2. Zastąp stary system message nowym (z tego dokumentu)
3. Zaktualizuj user message template

### Krok 4: Wdróż funkcję
```bash
supabase functions deploy video-analyzer
```

---

## 6. KOSZTY

**GPT-4o-mini:**
- Input: $0.15 / 1M tokens
- Output: $0.60 / 1M tokens

**GPT-4:**
- Input: $30 / 1M tokens (200x drożej)
- Output: $60 / 1M tokens (100x drożej)

**Szacunkowy koszt na 1 audyt:**
- GPT-4o-mini: ~$0.01-0.02
- GPT-4: ~$0.20-0.40

**Rekomendacja:** Jeśli chcesz lepszej jakości ale niższych kosztów, rozważ `gpt-4-turbo` który jest 2x tańszy od GPT-4.

---

## 7. TESTOWANIE

Po wdrożeniu przetestuj na filmie z dużą liczbą komentarzy (50+) i sprawdź czy:
- ✅ Insights są konkretne i actionable
- ✅ Pytania widzów są dobrze wyekstrahowane
- ✅ Pomysły na filmy są wartościowe
- ✅ Kontrowersje są wykrywane
- ✅ Nie ma halucynacji (wymyślonych danych)
