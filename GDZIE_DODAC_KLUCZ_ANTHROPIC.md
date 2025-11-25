# 🔑 Gdzie Dodać Klucz Anthropic - Ilustrowany Przewodnik

## Krok 1: Otwórz Supabase Secrets

1. **Kliknij w ten link**: https://supabase.com/dashboard/project/xcbufsemfbklgbcmkitn/settings/vault/secrets

2. Zobaczysz stronę "Secrets" w Supabase

---

## Krok 2: Dodaj Nowy Secret

1. **Kliknij przycisk**: "Add new secret" (prawy górny róg)

2. **Pojawi się formularz z dwoma polami:**

   ```
   ┌─────────────────────────────────────┐
   │ Name:  [                         ]  │  ← Tutaj wpisz: ANTHROPIC_API_KEY
   │                                     │
   │ Value: [                         ]  │  ← Tutaj wklej klucz z Anthropic
   │                                     │  (np. sk-ant-api03-xxxxx...)
   │                                     │
   │  [ Cancel ]  [ Save ]               │
   └─────────────────────────────────────┘
   ```

3. **Wypełnij dokładnie tak:**
   - **Name**: `ANTHROPIC_API_KEY` (wielkość liter ma znaczenie!)
   - **Value**: Twój klucz z Anthropic (skopiuj całość, np. `sk-ant-api03-...`)

4. **Kliknij**: "Save"

---

## Krok 3: Sprawdź Czy Secret Został Dodany

Po zapisaniu powinieneś zobaczyć na liście:

```
┌────────────────────────────────────────────────┐
│ Secrets                                        │
│                                                │
│ • ANTHROPIC_API_KEY                            │  ← Powinno być widoczne
│   Created: 2025-11-25                          │
│   [Edit] [Delete]                              │
│                                                │
│ • OPENAI_API_KEY (może już istnieć)            │
│ • SUPABASE_SERVICE_ROLE_KEY (może już istnieć) │
└────────────────────────────────────────────────┘
```

✅ **Jeśli widzisz `ANTHROPIC_API_KEY` na liście - gotowe!**

---

## ❓ Nie Masz Klucza Anthropic?

### Jak Zdobyć Klucz:

1. **Przejdź na**: https://console.anthropic.com/

2. **Zaloguj się lub Załóż Konto** (darmowe do $5 kredytu)

3. **Po zalogowaniu przejdź do**: https://console.anthropic.com/settings/keys

4. **Kliknij**: "Create Key"

5. **Nazwij klucz** (np. "TikTok Audyt Production")

6. **Skopiuj klucz** (pokaże się tylko raz!)
   - Klucz wygląda tak: `sk-ant-api03-xxxxxxxxxxxxxxxxxxxxx`
   - WAŻNE: Zapisz go bezpiecznie - nie pokaże się ponownie!

7. **Wróć do Supabase** i dodaj ten klucz jako secret (Krok 2)

---

## 🎯 Co Dalej Po Dodaniu Klucza?

Po dodaniu `ANTHROPIC_API_KEY` do Supabase Secrets:

✅ **Krok 1 zakończony!**

Teraz musisz:
1. Zaktualizować kod Edge Function (skopiować nowy `index.ts`)
2. Zaktualizować `import_map.json`
3. Wdrożyć funkcję (kliknąć "Deploy")

**Przejdź do**: [JAK_WDROZYC_KROK_PO_KROKU.md](./JAK_WDROZYC_KROK_PO_KROKU.md) - Krok 2

---

## 🔒 Bezpieczeństwo

### ✅ BEZPIECZNE - Dodawanie do Supabase Secrets:
- Secrets w Supabase są szyfrowane
- Tylko Edge Functions mogą je odczytać
- Nie są widoczne w kodzie ani logach

### ❌ NIEBEZPIECZNE - NIE RÓB TEGO:
- ❌ Nie wpisuj klucza w kodzie źródłowym
- ❌ Nie commituj klucza do GitHuba
- ❌ Nie wysyłaj klucza przez email/chat
- ❌ Nie przechowuj klucza w `.env` na frontendzie

---

## 📞 Potrzebujesz Pomocy?

Jeśli masz problem:
1. Sprawdź czy nazwa to dokładnie `ANTHROPIC_API_KEY` (wielkość liter!)
2. Sprawdź czy klucz zaczyna się od `sk-ant-`
3. Sprawdź czy klucz został skopiowany w całości (bez spacji na końcu)

---

**Po dodaniu klucza wróć do**: [JAK_WDROZYC_KROK_PO_KROKU.md](./JAK_WDROZYC_KROK_PO_KROKU.md)
