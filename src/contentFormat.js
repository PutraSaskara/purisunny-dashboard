// Mirror of frontend/lib/formatArticleContent.js — keep in sync.
//
// Content auto-formatter spec (verbatim — any change must be applied to BOTH copies):
//
// 1. Normalize \r\n → \n. Empty/null → ''.
// 2. Split into blocks on /\n\s*\n+/ (one or more blank lines). Trim; drop empties.
// 3. Per block:
//    a. If block contains an opening block-level tag /<(p|div|h[1-6]|ul|ol|li|blockquote|table|thead|tbody|tr|figure|figcaption|section|pre|hr|dl|dd|dt)\b/i
//       → pass through unchanged (author-supplied HTML block).
//    b. Else if block matches /^\s*(#{1,3})\s+(.+)$/ → heading. '#' and '##' → <h2>, '###' → <h3>.
//       Render `<h2 id="slug">inline</h2>` where `inline` = the text after the # marker with single newlines → `<br />`.
//    c. Else → `<p>…</p>`; inner lines joined with `<br />` (single newlines become line breaks).
//    Slug rule (all headings, incl. step 4): take the heading's plain text (strip tags), lowercase, replace /[^a-z0-9\u00C0-\u024F]+/ with '-', trim '-'; empty → 'section'. Dedupe within one document by appending '-2', '-3'…
//    Stray-markup safety for text in (b)/(c): escape `&` not part of an entity (&(?![a-zA-Z#][\w]*;)) → `&amp;`, and `<` not starting a valid tag (/<(?!\/?[a-zA-Z][a-zA-Z0-9-]*(\s[^>]*?)?\/?>)/) → `&lt;`. Valid inline tags (b, i, em, strong, a, code, br, span…) pass through.
// 4. Post-pass: any <h2>/<h3> opening tag WITHOUT an id attribute gets id="slug" (same slug+dedupe rules).
// 5. Blocks joined with '\n'.

// Opening block-level tag ⇒ the block is author-supplied HTML (step 3a).
const BLOCK_TAG_RE =
  /<(p|div|h[1-6]|ul|ol|li|blockquote|table|thead|tbody|tr|figure|figcaption|section|pre|hr|dl|dd|dt)\b/i

// Step 3b heading marker. The spec regex is /^\s*(#{1,3})\s+(.+)$/; the text
// capture is [\s\S]+ so multi-line heading text keeps the documented
// "single newlines → <br />" rule (single-line blocks behave identically).
const HEADING_RE = /^\s*(#{1,3})\s+([\s\S]+)$/

// ── Stray-markup safety (step 3, text in b/c) ──
// `&` only escapes when not starting an entity; `<` only escapes when not
// starting a valid opening/closing tag, so inline tags pass through untouched.
function escapeStray(text) {
  return String(text)
    .replace(/&(?![a-zA-Z#][\w]*;)/g, '&amp;')
    .replace(/<(?!\/?[a-zA-Z][a-zA-Z0-9-]*(\s[^>]*?)?\/?>)/g, '&lt;')
}

// Inline rendering: single newlines become <br /> (steps 3b/3c).
function inlineHtml(text) {
  return escapeStray(text).replace(/\n/g, '<br />')
}

// ── Slug rule (step 3, all headings incl. step 4) ──
// Plain text (tags stripped) → lowercase → non [a-z0-9\u00C0-\u024F]+ runs become
// '-' → trim '-'; empty → 'section'.
function slugifyHeading(plainWithTags) {
  const plain = String(plainWithTags).replace(/<[^>]*>/g, '')
  const slug = plain
    .toLowerCase()
    .replace(/[^a-z0-9\u00C0-\u024F]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'section'
}

// Dedupe within one document: 'slug', 'slug-2', 'slug-3', …
function uniqueSlug(base, used) {
  let slug = base
  let n = 1
  while (used.has(slug)) {
    n += 1
    slug = `${base}-${n}`
  }
  used.add(slug)
  return slug
}

function formatBlock(block, usedSlugs) {
  // 3a — author-supplied HTML block passes through unchanged.
  if (BLOCK_TAG_RE.test(block)) return block

  // 3b — markdown-style heading.
  const heading = block.match(HEADING_RE)
  if (heading) {
    const tag = heading[1].length >= 3 ? 'h3' : 'h2'
    const slug = uniqueSlug(slugifyHeading(heading[2]), usedSlugs)
    return `<${tag} id="${slug}">${inlineHtml(heading[2])}</${tag}>`
  }

  // 3c — plain paragraph; single newlines become <br />.
  return `<p>${inlineHtml(block)}</p>`
}

// Step 4 — post-pass: every <h2>/<h3> opening tag without an id gets one
// (same slug + dedupe rules, sharing the document's slug map).
function addHeadingIds(html, usedSlugs) {
  // Paired tags first so the slug can come from the heading's text.
  let out = html.replace(
    /<(h[23])((?:\s[^>]*)?)>([\s\S]*?)<\/\1>/gi,
    (full, tag, attrs, inner) => {
      if (/\bid\s*=/i.test(attrs)) return full
      const slug = uniqueSlug(slugifyHeading(inner), usedSlugs)
      return `<${tag} id="${slug}"${attrs}>${inner}</${tag}>`
    }
  )
  // Any remaining unpaired opening tag still needs an id (text unavailable → 'section').
  out = out.replace(/<(h[23])((?:\s[^>]*)?)>/gi, (full, tag, attrs) => {
    if (/\bid\s*=/i.test(attrs)) return full
    const slug = uniqueSlug(slugifyHeading(''), usedSlugs)
    return `<${tag} id="${slug}"${attrs}>`
  })
  return out
}

/**
 * Format raw article content (plain text + optional inline/author HTML) into
 * the HTML the public site renders. Pure function — no DOM, no side effects.
 * Mirror of frontend/lib/formatArticleContent.js — keep in sync.
 */
export function formatArticleContent(raw) {
  if (raw == null) return ''
  const text = String(raw).replace(/\r\n/g, '\n')
  if (!text.trim()) return ''

  const usedSlugs = new Set()
  const blocks = text
    .split(/\n\s*\n+/)
    .map((b) => b.trim())
    .filter(Boolean)

  const html = blocks.map((block) => formatBlock(block, usedSlugs)).join('\n')
  return addHeadingIds(html, usedSlugs)
}

/**
 * Non-blocking writing hints for the admin content editor (client-side only).
 * Returns an array of Indonesian tip strings — empty when nothing to suggest.
 */
export function contentTips(raw) {
  const text = raw == null ? '' : String(raw).replace(/\r\n/g, '\n')
  const tips = []
  if (!text.trim()) return tips

  // Author already writes block-level HTML — they do not need formatting hints.
  if (BLOCK_TAG_RE.test(text)) return tips

  const blocks = text
    .split(/\n\s*\n+/)
    .map((b) => b.trim())
    .filter(Boolean)
  const hasHeading = blocks.some((b) => /^\s*#{1,3}\s+\S/.test(b))
  if (!hasHeading) {
    tips.push(
      'Tips: tulis `## Judul` untuk membuat judul bagian — otomatis muncul di daftar isi artikel.'
    )
  }

  // Several line breaks but never a blank line → the whole text will collapse
  // into a single paragraph with <br />s. A blank line starts a new paragraph.
  const hasBlankLine = /\n\s*\n/.test(text)
  const singleNewlines = (text.match(/\n(?![ \t]*\n)/g) || []).length
  if (singleNewlines >= 3 && !hasBlankLine) {
    tips.push('Tips: tekan Enter dua kali untuk memisahkan paragraf baru.')
  }

  return tips
}
