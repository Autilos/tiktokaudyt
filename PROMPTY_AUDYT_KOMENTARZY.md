# ULEPSZONE PROMPTY - AUDYT KOMENTARZY TIKTOK

## 1. ZMIANA MODELU

**Stary model:** `gpt-4o-mini` (OpenAI)  
**Nowy model:** `claude-3-5-sonnet-20241022` (Anthropic)

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
});

const response = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 4096,
  temperature: 0.7,
  system: systemMessage,  // System message jako osobny parametr
  messages: [
    {
      role: "user",
      content: userMessage
    }
  ]
});

// Wyciągnij JSON z odpowiedzi
const responseText = response.content[0].text;
const auditData = JSON.parse(responseText);
```

**Wymagane zmiany w Supabase:**
1. Dodaj `ANTHROPIC_API_KEY` do Supabase Secrets
2. Zainstaluj `@anthropic-ai/sdk` w Edge Function
3. Zmień wywołanie API z OpenAI na Anthropic


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

ZAWSZE odpowiadaj w formacie JSON. Zacznij odpowiedź od { i zakończ na }.
```

**Uwaga dla Claude:** Claude nie ma natywnego JSON mode jak GPT-4, ale jest bardzo dobry w generowaniu poprawnego JSON gdy się go o to poprosi. Dodaj na końcu user message: "Odpowiedz TYLKO w formacie JSON, bez dodatkowego tekstu."


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

Odpowiedz TYLKO w formacie JSON, bez dodatkowego tekstu. Zacznij od { i zakończ na }.
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
import Anthropic from '@anthropic-ai/sdk';

// Inicjalizacja klienta Anthropic
const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
});

// Wywołanie API
const response = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 4096,
  temperature: 0.7,
  system: IMPROVED_SYSTEM_MESSAGE,  // System message jako osobny parametr
  messages: [
    {
      role: "user",
      content: constructUserMessage(videoData, comments)
    }
  ]
});

// Parsowanie odpowiedzi
const responseText = response.content[0].text;
const auditData = JSON.parse(responseText);

// Dodaj nowe prompty
const IMPROVED_SYSTEM_MESSAGE = `
Jesteś ekspertem od analizy komentarzy na TikTok i strategii content marketingu.
[... reszta promptu jak powyżej ...]
`;

function constructUserMessage(videoData, comments) {
  return `
Przeanalizuj komentarze pod filmem TikTok i wyciągnij praktyczne wnioski.
[... reszta promptu jak powyżej ...]
Odpowiedz TYLKO w formacie JSON, bez dodatkowego tekstu. Zacznij od { i zakończ na }.
  `;
}
```

### Instalacja zależności

W `supabase/functions/video-analyzer/` utwórz `import_map.json`:
```json
{
  "imports": {
    "@anthropic-ai/sdk": "npm:@anthropic-ai/sdk@^0.20.0"
  }
}
```

---

## 5. JAK WDROŻYĆ

### Krok 1: Dodaj ANTHROPIC_API_KEY do Supabase
```bash
# Zaloguj się do Supabase CLI
supabase login

# Dodaj secret
supabase secrets set ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

Lub przez Dashboard:
```
https://supabase.com/dashboard/project/xcbufsemfbklgbcmkitn/settings/vault
→ Secrets → Add new secret
→ Name: ANTHROPIC_API_KEY
→ Value: sk-ant-...
```

### Krok 2: Zaktualizuj Edge Function
1. Zmień import z OpenAI na Anthropic
2. Zmień wywołanie API (jak w sekcji 4)
3. Dodaj `import_map.json` z zależnością Anthropic SDK

### Krok 3: Wdróż funkcję
```bash
supabase functions deploy video-analyzer
```

---

## 6. KOSZTY

**GPT-4o-mini (poprzedni):**
- Input: $0.15 / 1M tokens
- Output: $0.60 / 1M tokens
- Koszt na audyt: ~$0.01-0.02

**Claude 3.5 Sonnet (nowy):**
- Input: $3 / 1M tokens
- Output: $15 / 1M tokens
- Koszt na audyt: ~$0.03-0.06

**GPT-4 (alternatywa):**
- Input: $30 / 1M tokens
- Output: $60 / 1M tokens
- Koszt na audyt: ~$0.20-0.40

**Porównanie:**
- Claude 3.5 Sonnet jest **3x droższy** niż GPT-4o-mini
- Claude 3.5 Sonnet jest **6-10x tańszy** niż GPT-4
- Claude 3.5 Sonnet oferuje **lepszą jakość** niż GPT-4o-mini
- Claude 3.5 Sonnet ma **podobną jakość** do GPT-4 przy znacznie niższych kosztach

**Szacunkowy miesięczny koszt:**
- 100 audytów/miesiąc: ~$3-6
- 500 audytów/miesiąc: ~$15-30
- 1000 audytów/miesiąc: ~$30-60

**Rekomendacja:** Claude 3.5 Sonnet to najlepszy balans jakości i ceny.

---

## 7. TESTOWANIE

Po wdrożeniu przetestuj na filmie z dużą liczbą komentarzy (50+) i sprawdź czy:
- ✅ Insights są konkretne i actionable
- ✅ Pytania widzów są dobrze wyekstrahowane
- ✅ Pomysły na filmy są wartościowe
- ✅ Kontrowersje są wykrywane
- ✅ Nie ma halucynacji (wymyślonych danych)
