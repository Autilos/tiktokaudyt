# 🚀 Jak Wdrożyć Nowe Prompty - Krok po Kroku

## ✅ Przygotowane Pliki

Masz teraz gotowe 3 pliki:
1. ✅ `supabase-edge-function-NEW-index.ts` - Nowy kod z Claude 3.5 Sonnet
2. ✅ `supabase-edge-function-import_map.json` - Konfiguracja zależności
3. ✅ Ten plik z instrukcjami

---

## 📋 Krok 1: Dodaj ANTHROPIC_API_KEY do Supabase

### Pobierz klucz API z Anthropic
1. Przejdź na: https://console.anthropic.com/settings/keys
2. Kliknij "Create Key"
3. Skopiuj klucz (zaczyna się od `sk-ant-`)

### Dodaj klucz do Supabase
1. Przejdź na: https://supabase.com/dashboard/project/xcbufsemfbklgbcmkitn/settings/vault/secrets
2. Kliknij **"Add new secret"**
3. Wypełnij:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: Twój klucz (np. `sk-ant-api03-...`)
4. Kliknij **"Save"**

✅ **Checkpoint**: Secret powinien być widoczny na liście z nazwą `ANTHROPIC_API_KEY`

---

## 📋 Krok 2: Zaktualizuj Edge Function w Supabase Dashboard

### 2.1 Otwórz funkcję do edycji
1. Przejdź na: https://supabase.com/dashboard/project/xcbufsemfbklgbcmkitn/functions
2. Znajdź funkcję (prawdopodobnie nazywa się `video-analyzer` lub `tiktok-analyzer`)
3. Kliknij na nazwę funkcji
4. Kliknij przycisk **"Edit function"** (prawy górny róg)

### 2.2 Zaktualizuj import_map.json
1. W lewym panelu znajdź plik `import_map.json`
2. Jeśli nie istnieje, kliknij "+" aby dodać nowy plik
3. Skopiuj całą zawartość z pliku `supabase-edge-function-import_map.json`
4. Wklej do edytora

```json
{
  "imports": {
    "@anthropic-ai/sdk": "npm:@anthropic-ai/sdk@^0.20.0",
    "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2.39.3"
  }
}
```

### 2.3 Zaktualizuj index.ts
1. W lewym panelu kliknij na plik `index.ts`
2. **USUŃ całą zawartość** starego pliku
3. Otwórz plik `supabase-edge-function-NEW-index.ts` (który właśnie stworzyłem)
4. **Skopiuj całą zawartość** nowego pliku
5. **Wklej** do edytora w Supabase Dashboard

### 2.4 Zapisz i wdróż
1. Kliknij przycisk **"Deploy"** (prawy górny róg)
2. Poczekaj 30-60 sekund na deployment
3. Powinieneś zobaczyć komunikat: "Successfully deployed"

✅ **Checkpoint**: Funkcja powinna być wdrożona bez błędów

---

## 📋 Krok 3: Przetestuj Nową Funkcję

### 3.1 Test przez aplikację
1. Przejdź do swojej aplikacji (frontend)
2. Wykonaj audyt wideo z dużą liczbą komentarzy (minimum 20-30)
3. Sprawdź czy wyniki są lepszej jakości niż wcześniej

### 3.2 Sprawdź logi
1. Przejdź na: https://supabase.com/dashboard/project/xcbufsemfbklgbcmkitn/logs/edge-functions
2. Znajdź najnowsze wywołanie funkcji
3. Sprawdź logi:
   - ✅ `🤖 Initializing Claude 3.5 Sonnet...`
   - ✅ `📤 Sending request to Claude API...`
   - ✅ `📥 Received response from Claude API`
   - ✅ `✅ Successfully parsed JSON response`
   - ✅ `✅ Video audit saved: [ID]`

### 3.3 Co sprawdzić w wynikach
- ✅ Pole `audience_questions` zawiera strukturę z `question_type`, `business_priority`
- ✅ Pole `product_feedback` zawiera szczegółową strukturę z `positive_points`, `negative_points`
- ✅ Pole `content_ideas_from_comments` zawiera obiekty z `idea_title`, `idea_type`, `cta_suggestion`
- ✅ Pole `controversies_and_risks` zawiera obiekt z `has_controversy`, `risk_level`, `recommendations`

---

## 🔍 Krok 4: Rozwiązywanie Problemów

### ❌ Błąd: "ANTHROPIC_API_KEY is not set"
**Rozwiązanie:**
1. Sprawdź czy dodałeś secret w Vault (Krok 1)
2. Sprawdź czy nazwa to dokładnie `ANTHROPIC_API_KEY` (wielkość liter ma znaczenie!)
3. Redeploy funkcji: kliknij "Deploy" ponownie

### ❌ Błąd: "Module not found: @anthropic-ai/sdk"
**Rozwiązanie:**
1. Sprawdź czy `import_map.json` jest poprawnie zapisany
2. Upewnij się że import w `index.ts` to: `import Anthropic from "npm:@anthropic-ai/sdk@^0.20.0";`
3. Redeploy funkcji

### ❌ Błąd: "Failed to parse JSON"
**Rozwiązanie:**
1. Sprawdź logi - znajdź "Raw response:" aby zobaczyć co zwrócił Claude
2. Claude czasem dodaje markdown - kod czyszczący już jest w funkcji
3. Jeśli problem się powtarza, zwiększ `temperature` z 0.7 na 0.8

### ❌ Wyniki są słabej jakości
**Rozwiązanie:**
1. Sprawdź czy używasz wystarczającej liczby komentarzy (min. 20-30)
2. Zwiększ `topCommentsSample` z 50 do 100 (linia ~201 w nowym kodzie)
3. Dostosuj prompty w `systemMessage` według swoich potrzeb

---

## 💰 Krok 5: Monitoruj Koszty

### Claude 3.5 Sonnet Pricing
- **Input**: $3 / 1M tokens
- **Output**: $15 / 1M tokens
- **Szacunkowy koszt**: ~$0.03-0.06 per audit (50 komentarzy)

### Sprawdź użycie API
1. Przejdź na: https://console.anthropic.com/settings/usage
2. Monitoruj dzienne/miesięczne użycie
3. Ustaw limity jeśli potrzebujesz

### Porównanie kosztów
| Model | Koszt/audit | Jakość |
|-------|-------------|--------|
| GPT-4o-mini (stary) | ~$0.01-0.02 | Dobra |
| **Claude 3.5 Sonnet (nowy)** | ~$0.03-0.06 | **Bardzo dobra** |
| GPT-4 | ~$0.20-0.40 | Bardzo dobra |

**Rekomendacja**: Claude 3.5 Sonnet to najlepszy balans jakości i ceny 🎯

---

## 📊 Krok 6: Sprawdź Różnice w Wynikach

### Stary format (GPT-4o-mini):
```json
{
  "audience_questions": [
    {
      "question": "Gdzie mogę to kupić?",
      "question_type": "dostępność",
      "representative_comments": ["komentarz 1"],
      "business_priority": "wysoki",
      "suggested_answer_points": ["punkt 1"]
    }
  ]
}
```

### Nowy format (Claude 3.5 Sonnet):
**To samo - ZACHOWANA KOMPATYBILNOŚĆ!** ✅

Struktura danych jest identyczna, więc Twój frontend będzie działał bez zmian.

**Różnica**: Jakość i szczegółowość analizy będzie znacznie lepsza.

---

## ✅ Checklist Wdrożenia

Zaznacz każdy krok po wykonaniu:

- [ ] **Krok 1**: Dodano `ANTHROPIC_API_KEY` do Supabase Vault
- [ ] **Krok 2.2**: Zaktualizowano `import_map.json`
- [ ] **Krok 2.3**: Zaktualizowano `index.ts` (skopiowano cały nowy kod)
- [ ] **Krok 2.4**: Kliknięto "Deploy" i deployment się powiódł
- [ ] **Krok 3.1**: Przetestowano audyt przez aplikację
- [ ] **Krok 3.2**: Sprawdzono logi - brak błędów
- [ ] **Krok 3.3**: Wyniki zawierają nową szczegółową strukturę
- [ ] **Krok 5**: Skonfigurowano monitorowanie kosztów w Anthropic

---

## 🎉 Gotowe!

Jeśli wszystkie kroki są zaznaczone, gratulacje! 🎊

Twoja aplikacja teraz używa Claude 3.5 Sonnet z ulepszonymi promptami.

---

## 📞 Potrzebujesz Pomocy?

Jeśli napotkasz problemy:
1. Sprawdź sekcję "Rozwiązywanie Problemów" powyżej
2. Zobacz logi w Supabase Dashboard
3. Sprawdź logi w Anthropic Console

---

## 🔄 Następne Kroki (Opcjonalne)

Po wdrożeniu możesz rozważyć:

1. **A/B Testing**: Porównaj wyniki starego i nowego modelu
2. **Fine-tuning Promptów**: Dostosuj prompty do swojej niszy
3. **Prompt Caching**: Użyj Anthropic Prompt Caching dla oszczędności
4. **Zwiększenie liczby komentarzy**: Zmień `topCommentsSample` z 50 na 100

---

**Data utworzenia**: 2025-11-25
**Wersja**: 1.0
**Model**: Claude 3.5 Sonnet (claude-3-5-sonnet-20241022)
