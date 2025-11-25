# Instrukcja Wdrożenia Nowych Promptów do Supabase

## 📋 Przegląd

Ten dokument opisuje jak zaktualizować prompty analizy komentarzy TikTok w Supabase Edge Function.

---

## 🎯 Co zostanie zaktualizowane

1. **Model AI**: OpenAI GPT-4o-mini → **Anthropic Claude 3.5 Sonnet**
2. **Prompty**: Ulepszone prompty z [PROMPTY_AUDYT_KOMENTARZY.md](./PROMPTY_AUDYT_KOMENTARZY.md)
3. **Koszty**: ~$0.01-0.02 → ~$0.03-0.06 per audit (lepsza jakość)

---

## ⚙️ Krok 1: Dodaj ANTHROPIC_API_KEY do Supabase

### Opcja A: Przez Dashboard (ZALECANE)

1. Przejdź do: https://supabase.com/dashboard/project/xcbufsemfbklgbcmkitn/settings/vault/secrets
2. Kliknij **"Add new secret"**
3. Wypełnij:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: Twój klucz API z https://console.anthropic.com/settings/keys
4. Kliknij **"Save"**

### Opcja B: Przez CLI

```bash
# Zaloguj się do Supabase CLI
supabase login

# Dodaj secret
supabase secrets set ANTHROPIC_API_KEY=sk-ant-twój-klucz-tutaj
```

---

## 🔧 Krok 2: Zaktualizuj Edge Function

### 2.1 Znajdź swoją Edge Function

Przejdź do: https://supabase.com/dashboard/project/xcbufsemfbklgbcmkitn/functions

Poszukaj funkcji o nazwie podobnej do:
- `video-analyzer`
- `tiktok-scraper`
- `analyze-comments`
- lub podobnej

### 2.2 Otwórz edytor funkcji

Kliknij na nazwę funkcji → **"Edit function"**

### 2.3 Zaktualizuj `import_map.json`

Utwórz lub zaktualizuj plik `import_map.json`:

```json
{
  "imports": {
    "@anthropic-ai/sdk": "npm:@anthropic-ai/sdk@^0.20.0"
  }
}
```

### 2.4 Zaktualizuj kod funkcji (`index.ts`)

#### **A) Dodaj import Anthropic SDK** (na górze pliku)

```typescript
import Anthropic from '@anthropic-ai/sdk';
```

#### **B) Zainicjalizuj klienta Anthropic**

Zamień inicjalizację OpenAI na:

```typescript
const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
});
```

#### **C) Zaktualizuj System Message**

Zamień stary system message na:

```typescript
const SYSTEM_MESSAGE = `Jesteś ekspertem od analizy komentarzy na TikTok i strategii content marketingu.

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

ZAWSZE odpowiadaj w formacie JSON. Zacznij odpowiedź od { i zakończ na }.`;
```

#### **D) Zaktualizuj User Message Template**

```typescript
function constructUserMessage(videoData: any, comments: any[]) {
  const metrics = {
    views: videoData.playCount || 0,
    likes: videoData.diggCount || 0,
    comments: videoData.commentCount || 0,
    shares: videoData.shareCount || 0,
    saves: videoData.collectCount || 0,
    engagementRate: (
      ((videoData.diggCount + videoData.commentCount + videoData.shareCount) /
      videoData.playCount) * 100
    ).toFixed(2)
  };

  return `Przeanalizuj komentarze pod filmem TikTok i wyciągnij praktyczne wnioski.

METRYKI FILMU:
- Wyświetlenia: ${metrics.views}
- Polubienia: ${metrics.likes}
- Komentarze: ${metrics.comments}
- Udostępnienia: ${metrics.shares}
- Engagement Rate: ${metrics.engagementRate}%

OPIS FILMU:
${videoData.desc || 'Brak opisu'}

KOMENTARZE (${comments.length} komentarzy):
${comments.map((c, i) => `
${i + 1}. "${c.text}"
   - Polubienia: ${c.diggCount || 0}
   - Odpowiedzi: ${c.replyCommentTotal || 0}
   ${c.authorPinned ? '- 📌 Przypięte przez autora' : ''}
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

Odpowiedz TYLKO w formacie JSON, bez dodatkowego tekstu. Zacznij od { i zakończ na }.`;
}
```

#### **E) Zaktualizuj wywołanie API**

Zamień wywołanie OpenAI na:

```typescript
// Wywołaj Claude API
const response = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 4096,
  temperature: 0.7,
  system: SYSTEM_MESSAGE,
  messages: [
    {
      role: "user",
      content: constructUserMessage(videoData, comments)
    }
  ]
});

// Parsuj odpowiedź
const responseText = response.content[0].text;

// Usuń markdown code blocks jeśli są
const cleanedText = responseText
  .replace(/```json\n?/g, '')
  .replace(/```\n?/g, '')
  .trim();

const auditData = JSON.parse(cleanedText);
```

#### **F) TypeScript Type dla odpowiedzi**

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

## 🚀 Krok 3: Wdróż Funkcję

### Opcja A: Przez Dashboard

1. W edytorze funkcji kliknij **"Deploy"**
2. Poczekaj na wdrożenie (zwykle 30-60 sekund)
3. Sprawdź logi czy nie ma błędów

### Opcja B: Przez CLI

```bash
# Jeśli masz lokalną kopię funkcji
supabase functions deploy video-analyzer
```

---

## ✅ Krok 4: Testowanie

### 4.1 Test ręczny

1. Przejdź do swojej aplikacji: https://twoja-domena.com
2. Wykonaj audyt filmu z dużą liczbą komentarzy (50+)
3. Sprawdź czy wyniki są lepszej jakości

### 4.2 Sprawdź logi

1. Przejdź do: https://supabase.com/dashboard/project/xcbufsemfbklgbcmkitn/logs/edge-functions
2. Znajdź najnowsze wywołanie funkcji
3. Sprawdź czy nie ma błędów typu:
   - `ANTHROPIC_API_KEY is not set`
   - `Failed to parse JSON`
   - API errors

### 4.3 Checklist jakości

Sprawdź czy wyniki zawierają:
- ✅ Konkretne, actionable insights
- ✅ Pytania widzów są dobrze wyekstrahowane
- ✅ Pomysły na filmy są wartościowe
- ✅ Kontrowersje są wykrywane (jeśli istnieją)
- ✅ Brak halucynacji (wymyślonych danych)
- ✅ Puste tablice [] zamiast "Brak danych"

---

## 💰 Krok 5: Monitoruj Koszty

### Claude 3.5 Sonnet Pricing

- Input: $3 / 1M tokens
- Output: $15 / 1M tokens
- Koszt na audyt: ~$0.03-0.06

### Szacunkowy miesięczny koszt

| Audyty/miesiąc | Koszt |
|----------------|-------|
| 100 | $3-6 |
| 500 | $15-30 |
| 1000 | $30-60 |

### Monitorowanie

Sprawdzaj użycie API na: https://console.anthropic.com/settings/usage

---

## 🔍 Rozwiązywanie Problemów

### Problem: "ANTHROPIC_API_KEY is not set"

**Rozwiązanie:**
1. Sprawdź czy dodałeś secret w Supabase Vault
2. Sprawdź czy nazwa to dokładnie `ANTHROPIC_API_KEY`
3. Redeploy funkcji po dodaniu secretu

### Problem: "Failed to parse JSON"

**Rozwiązanie:**
1. Claude czasem dodaje markdown code blocks (```json)
2. Upewnij się że masz kod czyszczący (sekcja 2.4.E)
3. Sprawdź logi aby zobaczyć surową odpowiedź

### Problem: "Module not found: @anthropic-ai/sdk"

**Rozwiązanie:**
1. Sprawdź czy `import_map.json` jest poprawnie skonfigurowany
2. Redeploy funkcji
3. Sprawdź czy wersja SDK jest dostępna w npm

### Problem: Słabe wyniki analizy

**Rozwiązanie:**
1. Sprawdź czy system message jest dokładnie skopiowany
2. Upewnij się że `temperature: 0.7` (nie za nisko, nie za wysoko)
3. Zwiększ `max_tokens` jeśli odpowiedzi są ucięte

---

## 📚 Dodatkowe Zasoby

- [Anthropic API Docs](https://docs.anthropic.com/en/api/messages)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Claude 3.5 Sonnet Pricing](https://www.anthropic.com/api)

---

## 🎯 Następne Kroki

Po wdrożeniu możesz rozważyć:

1. **A/B Testing**: Porównaj wyniki Claude vs GPT-4o-mini
2. **Prompt Optimization**: Dostosuj prompty na podstawie feedbacku użytkowników
3. **Caching**: Użyj Anthropic Prompt Caching dla często powtarzających się danych
4. **Fine-tuning**: Stwórz fine-tuned model jeśli będziesz mieć dużo danych treningowych

---

## 📝 Historia Zmian

| Data | Wersja | Zmiany |
|------|--------|--------|
| 2025-11-25 | 1.0 | Pierwsza wersja instrukcji |

---

**Potrzebujesz pomocy?** Otwórz issue w repozytorium lub skontaktuj się z zespołem.
