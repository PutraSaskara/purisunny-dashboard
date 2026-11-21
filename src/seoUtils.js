// Shared client-side SEO helpers for the admin dashboard (Task C).
// Pure functions — no backend calls, no state. Used by SeoPageForm/ArticleForm
// (character counters + SERP/social previews) and SeoPages/Articles
// (completeness badges + score).

// ── Character limits ──
// "Recommended" = what Google typically displays before truncating.
// "Max" = the backend validation hard cap (utils/validateSeo.js) — the forms
// must never submit beyond it (see hardCapError).
export const TITLE_RECOMMENDED = 60
export const TITLE_WARN = 66 // recommended + 10%
export const TITLE_MAX = 255
export const DESCRIPTION_RECOMMENDED = 155
export const DESCRIPTION_WARN = 170 // recommended + 10% (rounded down)
export const DESCRIPTION_MAX = 500

// Colour state for a live counter: green up to the recommended length, amber
// up to 10% over, red beyond that. Empty fields stay neutral grey.
//   'empty' | 'ok' | 'warn' | 'over'
export function counterState(length, recommended, warn) {
  if (!length) return 'empty'
  if (length <= recommended) return 'ok'
  if (length <= warn) return 'warn'
  return 'over'
}

export const COUNTER_CLASSES = {
  empty: 'text-gray-400',
  ok: 'text-green-600',
  warn: 'text-amber-600',
  over: 'text-red-500',
}

// Client-side hard-cap guard, checked before submit so an over-long value can
// never reach the API (maxlength attributes normally prevent this; the guard
// also covers values set programmatically or loaded from the API).
export function hardCapError(metaTitle, metaDescription) {
  if ((metaTitle || '').length > TITLE_MAX) {
    return `Meta Title melebihi batas ${TITLE_MAX} karakter. Persingkat sebelum menyimpan.`
  }
  if ((metaDescription || '').length > DESCRIPTION_MAX) {
    return `Meta Description melebihi batas ${DESCRIPTION_MAX} karakter. Persingkat sebelum menyimpan.`
  }
  return ''
}

// ── Meta keywords (optional, comma-separated free text) ──
// KEYWORDS_MAX mirrors the backend validation hard cap exactly
// (keywords must be at most 255 characters) — the forms must never submit
// beyond it. Keywords are NOT part of the SERP preview nor the completeness
// score (Google ignores meta keywords).
export const KEYWORDS_MAX = 255

// Payload value: trimmed; empty -> null (the backend contract is
// `keywords: string | null` and stores empty as NULL).
export function keywordsForPayload(value) {
  const trimmed = (value || '').trim()
  return trimmed ? trimmed : null
}

// Client-side hard-cap guard, checked before submit (see hardCapError) —
// '' = valid. Counts the trimmed length, i.e. exactly what the backend sees.
export function keywordsHardCapError(value) {
  if (((value || '').trim()).length > KEYWORDS_MAX) {
    return `Keywords melebihi batas ${KEYWORDS_MAX} karakter. Persingkat sebelum menyimpan.`
  }
  return ''
}

// ── SERP truncation ──
// Google truncates by pixel width, approximated here as ~60 chars for titles
// and ~155 for descriptions (matching the recommended lengths above).
export function truncateChars(text, max) {
  const t = (text || '').trim()
  return t.length > max ? `${t.slice(0, max).trimEnd()}…` : t
}

// ── Effective <title> mirroring the public site ──
// Both emit an *absolute* title (the layout title template is bypassed):
//   pages    -> frontend/lib/pageSeo.js resolvePageSeo():
//               title already mentioning "Puri Sunny" is kept as-is, otherwise
//               "| Puri Sunny Guest House & Camp" is appended.
//   articles -> frontend/app/journal/[slug]/page.js generateMetadata():
//               same rule but the suffix is "| Puri Sunny Journal".
export function brandPageTitle(title) {
  const t = (title || '').trim()
  if (!t) return ''
  return /puri sunny/i.test(t) ? t : `${t} | Puri Sunny Guest House & Camp`
}

export function brandArticleTitle(title) {
  const t = (title || '').trim()
  if (!t) return ''
  return /puri sunny/i.test(t) ? t : `${t} | Puri Sunny Journal`
}

// ── Article FAQ editor (optional list — 0 allowed) ──
// Limits mirror the backend faqs contract exactly.
export const FAQ_MAX_ITEMS = 20
export const FAQ_QUESTION_MAX = 255
export const FAQ_ANSWER_MAX = 1000

// Client-side mirror of the backend faqs validation:
//   - at most FAQ_MAX_ITEMS items
//   - question: trimmed, required, <= 255 chars
//   - answer:   trimmed, required, <= 1000 chars
// Empty-row behavior: a row where BOTH question and answer are blank after
// trimming is skipped on save (dropped by faqsForPayload) instead of erroring —
// an untouched "Tambah FAQ" row must never block saving. A row with only ONE
// side filled IS an error (mirrors "faqs[i].question is required" /
// "faqs[i].answer is required"). Returns human-readable messages; [] = valid.
export function articleFaqErrors(faqs) {
  const list = Array.isArray(faqs) ? faqs : []
  const errors = []
  if (list.length > FAQ_MAX_ITEMS) {
    errors.push(`FAQ maksimal ${FAQ_MAX_ITEMS} item`)
    return errors
  }
  list.forEach((faq, i) => {
    const question = ((faq && faq.question) || '').trim()
    const answer = ((faq && faq.answer) || '').trim()
    if (!question && !answer) return // fully-empty row — skipped on save
    const n = i + 1
    if (!question) {
      errors.push(`FAQ #${n}: pertanyaan wajib diisi`)
    } else if (question.length > FAQ_QUESTION_MAX) {
      errors.push(`FAQ #${n}: pertanyaan maksimal ${FAQ_QUESTION_MAX} karakter`)
    }
    if (!answer) {
      errors.push(`FAQ #${n}: jawaban wajib diisi`)
    } else if (answer.length > FAQ_ANSWER_MAX) {
      errors.push(`FAQ #${n}: jawaban maksimal ${FAQ_ANSWER_MAX} karakter`)
    }
  })
  return errors
}

// Payload shape for POST/PUT: [{ question, answer }] with trimmed values.
// Fully-empty rows are dropped (see articleFaqErrors); ids/positions are
// backend-managed — never send them. With no valid rows left this is [],
// which clears the stored list per the API contract.
export function faqsForPayload(faqs) {
  return (Array.isArray(faqs) ? faqs : [])
    .map((faq) => ({
      question: ((faq && faq.question) || '').trim(),
      answer: ((faq && faq.answer) || '').trim(),
    }))
    .filter((faq) => faq.question || faq.answer)
}

// ── SEO completeness score (0–100) ──
// Simple weighted checklist, identical for create/edit lists:
//   Articles: meta_title 35 + meta_description 35 + og_image 20
//             + FAQ bonus 10 when at least one FAQ exists
//   Pages:    meta_title 35 + meta_description 35 + og_image 20
//             + FAQ bonus 10 when at least one FAQ exists
// A row is "incomplete" below 100 — that drives the "Incomplete only" filter.
export function articleSeoScore(row) {
  let score = 0
  if (row && row.meta_title) score += 35
  if (row && row.meta_description) score += 35
  if (row && row.og_image) score += 20
  if (row && articleFaqCount(row) > 0) score += 10
  return score
}

// FAQ count for an article row: list endpoints report `faq_count`, the detail
// endpoint (GET /articles/:slug) carries the `faqs[]` array itself.
export function articleFaqCount(row) {
  if (!row) return 0
  if (Array.isArray(row.faqs)) return row.faqs.length
  const n = Number(row.faq_count)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export function pageSeoScore(entry) {
  let score = 0
  if (entry && entry.meta_title) score += 35
  if (entry && entry.meta_description) score += 35
  if (entry && entry.og_image) score += 20
  if (entry && Array.isArray(entry.faqs) && entry.faqs.length > 0) score += 10
  return score
}

// Badge colour per score: complete = green, partial = amber, empty = grey.
export function scoreBadgeClass(score) {
  if (score >= 100) return 'bg-green-100 text-green-700'
  if (score > 0) return 'bg-amber-100 text-amber-700'
  return 'bg-gray-100 text-gray-500'
}
