<template>
  <AdminLayout>
    <div class="max-w-4xl mx-auto">
      <div class="mb-8">
        <router-link to="/seo" class="text-sm text-gray-500 hover:text-brand-forest mb-2 inline-block">
          &larr; Back to SEO Pages
        </router-link>
        <template v-if="page">
          <h1 class="text-2xl font-serif text-brand-forest font-bold">
            SEO & FAQ &mdash; {{ page.label }}
          </h1>
          <p class="text-sm text-gray-500 mt-1">
            <span class="font-mono">{{ page.path }}</span>
            <span class="text-gray-300 mx-2">|</span>
            <span>{{ page.key }}</span>
          </p>
        </template>
        <h1 v-else class="text-2xl font-serif text-brand-forest font-bold">Halaman tidak dikenal</h1>
      </div>

      <!-- Error Message (API errors[] ditampilkan apa adanya) -->
      <div
        v-if="error"
        class="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-6 border border-red-200"
      >
        <p>{{ error }}</p>
        <ul v-if="errorDetails.length" class="mt-1 list-disc list-inside text-xs">
          <li v-for="detail in errorDetails" :key="detail">{{ detail }}</li>
        </ul>
      </div>

      <!-- Success Message -->
      <div
        v-if="success"
        class="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm mb-6 border border-green-200"
      >
        {{ success }}
      </div>

      <!-- Loading State -->
      <div v-if="loadingData" class="flex items-center justify-center py-20">
        <svg class="animate-spin h-8 w-8 text-brand-forest" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>

      <form v-else-if="page" @submit.prevent="handleSubmit" class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-6">
        <!-- SEO Settings -->
        <div class="space-y-6">
          <div>
            <h2 class="text-lg font-serif text-brand-forest font-bold">SEO Settings</h2>
            <p class="text-sm text-gray-500 mt-1">
              Semua field bersifat opsional. Jika dikosongkan, nilai default halaman akan dipakai.
            </p>
          </div>

          <!-- Meta Title -->
          <div>
            <label for="meta_title" class="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
            <input
              id="meta_title"
              v-model="form.meta_title"
              type="text"
              data-testid="meta-title"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-colors"
              placeholder="Custom search engine title"
            />
            <div class="flex items-start justify-between gap-4 mt-1">
              <p class="text-xs text-gray-400">
                Kosongkan untuk memakai default halaman (maks 60 karakter disarankan)
              </p>
              <span
                class="text-xs font-medium tabular-nums whitespace-nowrap"
                :class="metaTitleCounterClass"
                data-testid="meta-title-counter"
              >
                {{ metaTitleCount }}/{{ TITLE_RECOMMENDED }}
              </span>
            </div>
            <p v-if="metaTitleCount > TITLE_MAX" class="text-xs text-red-500 mt-1">
              Melebihi batas maksimal {{ TITLE_MAX }} karakter (validasi backend) — penyimpanan diblokir, persingkat dulu.
            </p>
            <p v-else-if="metaTitleState === 'warn' || metaTitleState === 'over'" class="text-xs text-amber-600 mt-1">
              Melebihi {{ TITLE_RECOMMENDED }} karakter — judul akan terpotong di hasil pencarian Google.
            </p>
          </div>

          <!-- Meta Description -->
          <div>
            <label for="meta_description" class="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
            <textarea
              id="meta_description"
              v-model="form.meta_description"
              rows="3"
              data-testid="meta-description"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-colors resize-none"
              placeholder="Custom search engine description"
            ></textarea>
            <div class="flex items-start justify-between gap-4 mt-1">
              <p class="text-xs text-gray-400">
                Kosongkan untuk memakai default halaman (maks 155 karakter disarankan)
              </p>
              <span
                class="text-xs font-medium tabular-nums whitespace-nowrap"
                :class="metaDescriptionCounterClass"
                data-testid="meta-description-counter"
              >
                {{ metaDescriptionCount }}/{{ DESCRIPTION_RECOMMENDED }}
              </span>
            </div>
            <p v-if="metaDescriptionCount > DESCRIPTION_MAX" class="text-xs text-red-500 mt-1">
              Melebihi batas maksimal {{ DESCRIPTION_MAX }} karakter (validasi backend) — penyimpanan diblokir, persingkat dulu.
            </p>
            <p v-else-if="metaDescriptionState === 'warn' || metaDescriptionState === 'over'" class="text-xs text-amber-600 mt-1">
              Melebihi {{ DESCRIPTION_RECOMMENDED }} karakter — deskripsi akan terpotong di hasil pencarian Google.
            </p>
          </div>

          <!-- Keywords -->
          <div>
            <label for="keywords" class="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
            <input
              id="keywords"
              v-model="form.keywords"
              type="text"
              data-testid="keywords"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-colors"
              placeholder="munduk, air terjun, bali"
            />
            <div class="flex items-start justify-between gap-4 mt-1">
              <p class="text-xs text-gray-400">
                Opsional — pisahkan dengan koma. Google mengabaikan meta keywords; hindari isian berlebihan.
              </p>
              <span
                class="text-xs font-medium tabular-nums whitespace-nowrap"
                :class="keywordsCounterClass"
                data-testid="keywords-counter"
              >
                {{ keywordsCount }}/{{ KEYWORDS_MAX }}
              </span>
            </div>
            <p v-if="keywordsCount > KEYWORDS_MAX" class="text-xs text-red-500 mt-1">
              Melebihi batas maksimal {{ KEYWORDS_MAX }} karakter (validasi backend) — penyimpanan diblokir, persingkat dulu.
            </p>
          </div>

          <!-- OG Image -->
          <div>
            <label for="og_image" class="block text-sm font-medium text-gray-700 mb-1">OG Image</label>
            <div class="flex items-start gap-3">
              <div class="flex-1">
                <input
                  id="og_image"
                  v-model="form.og_image"
                  type="url"
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-colors"
                  placeholder="https://example.com/og-image.jpg"
                />
                <input
                  ref="ogFileInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleOgFileSelect"
                />
                <div class="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    @click="triggerOgFileInput"
                    class="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:border-brand-forest hover:text-brand-forest transition-colors"
                  >
                    Upload image
                  </button>
                  <button
                    v-if="form.og_image || ogImagePreview"
                    type="button"
                    @click="removeOgImage"
                    class="text-sm text-red-500 hover:text-red-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div
                v-if="ogPreviewSrc"
                class="w-28 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shrink-0"
              >
                <img :src="ogPreviewSrc" alt="OG image preview" class="w-full h-full object-cover" />
              </div>
            </div>
            <p class="text-xs text-gray-400 mt-1">
              Gambar saat halaman dibagikan di sosmed; kosongkan untuk memakai gambar default halaman
            </p>
          </div>

          <!-- Noindex -->
          <div>
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                v-model="form.noindex"
                class="w-5 h-5 rounded border-gray-300 text-brand-forest focus:ring-brand-forest"
              />
              <span class="text-sm font-medium text-gray-700">Jangan tampilkan di mesin pencari (noindex)</span>
            </label>
          </div>
        </div>

        <!-- FAQ Editor -->
        <div class="pt-6 border-t border-gray-100 space-y-4">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-serif text-brand-forest font-bold">FAQ</h2>
              <p class="text-sm text-gray-500 mt-1">
                FAQ tampil di halaman + menjadi FAQPage schema untuk mesin pencari &amp; AI
              </p>
            </div>
            <span
              class="text-xs font-medium tabular-nums whitespace-nowrap mt-1"
              :class="form.faqs.length >= MAX_FAQS ? 'text-red-500' : 'text-gray-400'"
            >
              {{ form.faqs.length }}/{{ MAX_FAQS }} FAQ
            </span>
          </div>

          <!-- Empty state -->
          <div
            v-if="form.faqs.length === 0"
            class="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center text-sm text-gray-400"
          >
            Belum ada FAQ untuk halaman ini
          </div>

          <!-- FAQ list -->
          <div
            v-for="(faq, index) in form.faqs"
            :key="index"
            data-testid="faq-card"
            class="border border-gray-200 rounded-lg p-4 space-y-3"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                FAQ #{{ index + 1 }}
              </span>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  :disabled="index === 0"
                  @click="moveFaq(index, -1)"
                  title="Pindahkan ke atas"
                  class="p-2.5 rounded-lg border border-gray-300 text-gray-500 hover:border-brand-forest hover:text-brand-forest transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="18 15 12 9 6 15"/>
                  </svg>
                </button>
                <button
                  type="button"
                  :disabled="index === form.faqs.length - 1"
                  @click="moveFaq(index, 1)"
                  title="Pindahkan ke bawah"
                  class="p-2.5 rounded-lg border border-gray-300 text-gray-500 hover:border-brand-forest hover:text-brand-forest transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                <button
                  type="button"
                  @click="removeFaq(index)"
                  title="Hapus FAQ"
                  class="p-2.5 rounded-lg border border-gray-300 text-red-500 hover:border-red-500 hover:bg-red-50 transition-colors"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Question</label>
              <input
                v-model="faq.question"
                type="text"
                maxlength="255"
                data-testid="faq-question"
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-colors"
                placeholder="Pertanyaan yang sering diajukan"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Answer</label>
              <textarea
                v-model="faq.answer"
                rows="3"
                data-testid="faq-answer"
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-colors resize-none"
                placeholder="Jawaban"
              ></textarea>
            </div>
          </div>

          <!-- Add FAQ -->
          <div class="flex items-center gap-3">
            <button
              type="button"
              @click="addFaq"
              :disabled="form.faqs.length >= MAX_FAQS"
              class="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:border-brand-forest hover:text-brand-forest transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Tambah FAQ
            </button>
            <span class="text-xs text-gray-400">
              {{ form.faqs.length >= MAX_FAQS ? 'Kuota FAQ penuh (maks 20)' : `Sisa kuota: ${MAX_FAQS - form.faqs.length}` }}
            </span>
          </div>
          <p class="text-xs text-gray-400">
            Urutan posisi FAQ mengikuti urutan daftar di atas (FAQ #1 = position 0).
          </p>
        </div>

        <!-- Live Preview -->
        <div class="pt-6 border-t border-gray-100 space-y-4">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Preview</p>

          <!-- Google SERP Preview -->
          <div class="border border-gray-200 rounded-lg p-4 bg-white max-w-xl">
            <p class="text-xs text-gray-400 mb-2">Google Search</p>
            <p class="text-sm text-[#188038] truncate">
              purisunnymunduk.id{{ page.path }}
            </p>
            <!-- Mock result: ~60 char title with ellipsis (see truncateChars) -->
            <p class="text-[18px] leading-snug text-[#1a0dab] mt-0.5">
              {{ serpTitle || SERP_TITLE_PLACEHOLDER }}
            </p>
            <!-- Mock result: ~155 char description, clamped to 2 lines -->
            <p class="text-sm text-gray-600 mt-1 line-clamp-2">
              {{ serpDescription || SERP_DESCRIPTION_PLACEHOLDER }}
            </p>
            <p class="text-[11px] text-gray-400 mt-2 italic" data-testid="serp-source-hint">
              {{ titleSource === 'meta' ? 'Memakai meta title' : 'Memakai judul default halaman (meta title kosong)' }}
              <span class="text-gray-300 mx-1">|</span>
              {{ descriptionSource === 'meta' ? 'Memakai meta description' : 'Memakai deskripsi default halaman (meta description kosong)' }}
            </p>
          </div>

          <!-- Social Share (OG) Preview -->
          <div class="border border-gray-200 rounded-lg overflow-hidden bg-white max-w-md">
            <div class="h-40 bg-gray-100 overflow-hidden flex items-center justify-center">
              <img
                v-if="ogPreviewSrc"
                :src="ogPreviewSrc"
                alt="Share preview"
                class="w-full h-full object-cover"
              />
              <span v-else class="text-xs text-gray-400 px-4 text-center">
                Default OG image (1200&times;630) akan dipakai saat halaman dibagikan
              </span>
            </div>
            <div class="p-3 border-t border-gray-100">
              <p class="text-xs text-gray-400 uppercase tracking-wide">purisunnymunduk.id</p>
              <!-- og:title mirrors buildSeoMetadata: branded full title -->
              <p class="text-sm font-medium text-gray-800 mt-0.5 line-clamp-2">
                {{ socialTitle || SERP_TITLE_PLACEHOLDER }}
              </p>
              <p class="text-xs text-gray-500 mt-1 line-clamp-2">
                {{ previewDescription || SERP_DESCRIPTION_PLACEHOLDER }}
              </p>
              <p class="text-[11px] text-gray-400 mt-2 italic">
                {{ ogPreviewSrc ? 'Memakai OG image di atas' : 'Memakai default OG image (og_image kosong)' }}
              </p>
            </div>
          </div>

          <p v-if="usingFallback" class="text-xs text-gray-400">
            Preview memakai fallback: nilai default halaman yang dipakai saat meta masih kosong.
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4 pt-4 border-t border-gray-100">
          <button
            type="submit"
            :disabled="submitting"
            class="w-full sm:w-auto bg-brand-forest text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-forest-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
          >
            <svg
              v-if="submitting"
              class="animate-spin h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {{ submitting ? 'Saving...' : 'Save' }}
          </button>
          <button
            type="button"
            @click="resetForm"
            :disabled="submitting"
            class="px-6 py-3 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:border-brand-forest hover:text-brand-forest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
          <button
            v-if="hasEntry"
            type="button"
            @click="showDeleteConfirm = true"
            :disabled="submitting"
            class="px-6 py-3 rounded-lg border border-red-200 text-sm font-medium text-red-500 hover:bg-red-50 hover:border-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete Entry
          </button>
          <router-link to="/seo" class="text-sm text-gray-500 hover:text-gray-700">
            Cancel
          </router-link>
        </div>
      </form>

      <!-- Delete Confirmation Modal -->
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="showDeleteConfirm = false"
      >
        <div class="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Hapus Entry SEO</h3>
          <p class="text-sm text-gray-600 mb-6">
            Yakin ingin menghapus data SEO &amp; FAQ untuk "{{ page.label }}"? Halaman akan kembali
            memakai nilai default. Tindakan ini tidak bisa dibatalkan.
          </p>
          <div class="flex justify-end gap-3">
            <button
              @click="showDeleteConfirm = false"
              class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              @click="handleDelete"
              :disabled="deleting"
              class="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ deleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AdminLayout from '../components/AdminLayout.vue'
import { seo as seoApi, upload } from '../api'
import { findSeoPage } from '../seoPages'
import {
  TITLE_MAX,
  TITLE_RECOMMENDED,
  TITLE_WARN,
  DESCRIPTION_MAX,
  DESCRIPTION_RECOMMENDED,
  DESCRIPTION_WARN,
  KEYWORDS_MAX,
  keywordsForPayload,
  keywordsHardCapError,
  counterState,
  COUNTER_CLASSES,
  hardCapError,
  truncateChars,
  brandPageTitle,
} from '../seoUtils'

const MAX_FAQS = 20

const router = useRouter()
const route = useRoute()

const page = computed(() => findSeoPage(String(route.params.pageKey || '')))

const ogFileInput = ref(null)
const ogImagePreview = ref(null)
const ogImageFile = ref(null)
const submitting = ref(false)
const deleting = ref(false)
const loadingData = ref(false)
const hasEntry = ref(false)
const showDeleteConfirm = ref(false)
const error = ref('')
// Structured API errors[] shown verbatim (mirrors ArticleForm/Redirects).
const errorDetails = ref([])
const success = ref('')

const form = ref({
  meta_title: '',
  meta_description: '',
  keywords: '',
  og_image: '',
  noindex: false,
  faqs: [],
})

// --- SEO helpers (pola sama dengan ArticleForm) ---
const SERP_TITLE_PLACEHOLDER = 'Judul default halaman akan tampil di sini...'
const SERP_DESCRIPTION_PLACEHOLDER = 'Deskripsi default halaman akan tampil di sini...'

const metaTitleCount = computed(() => (form.value.meta_title || '').length)
const metaDescriptionCount = computed(() => (form.value.meta_description || '').length)

// Keywords: single free-text field (comma-separated). The counter shows the
// trimmed length (exactly what gets saved) — grey within the hard cap,
// red over it (same idiom as the FAQ counters in ArticleForm).
const keywordsCount = computed(() => (form.value.keywords || '').trim().length)
const keywordsCounterClass = computed(() =>
  keywordsCount.value > KEYWORDS_MAX ? 'text-red-500' : 'text-gray-400'
)

// Live counters: green <= recommended, amber up to 10% over, red beyond.
const metaTitleState = computed(() => counterState(metaTitleCount.value, TITLE_RECOMMENDED, TITLE_WARN))
const metaTitleCounterClass = computed(() => COUNTER_CLASSES[metaTitleState.value])
const metaDescriptionState = computed(() =>
  counterState(metaDescriptionCount.value, DESCRIPTION_RECOMMENDED, DESCRIPTION_WARN)
)
const metaDescriptionCounterClass = computed(() => COUNTER_CLASSES[metaDescriptionState.value])

const previewTitle = computed(() => (form.value.meta_title || '').trim())
const previewDescription = computed(() => (form.value.meta_description || '').trim())
// Which value the public site will actually use (meta_* -> page default chain).
const titleSource = computed(() => (previewTitle.value ? 'meta' : 'default'))
const descriptionSource = computed(() => (previewDescription.value ? 'meta' : 'default'))
// SERP mock: branded <title> exactly as buildSeoMetadata emits it, truncated at
// the recommended display widths with an ellipsis.
const serpTitle = computed(() => truncateChars(brandPageTitle(previewTitle.value), TITLE_RECOMMENDED))
const serpDescription = computed(() => truncateChars(previewDescription.value, DESCRIPTION_RECOMMENDED))
// og:title mirrors buildSeoMetadata (full branded title, not truncated).
const socialTitle = computed(() => brandPageTitle(previewTitle.value))
const ogPreviewSrc = computed(() => ogImagePreview.value || form.value.og_image || '')
const usingFallback = computed(
  () => !previewTitle.value || !previewDescription.value || !ogPreviewSrc.value
)

// Uploaded images come back as a relative path (e.g. /uploads/x.jpg).
// og_image must be an absolute http(s) URL, so resolve it against the API origin.
function toAbsoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return ''
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  const apiBase = import.meta.env.VITE_API_URL || ''
  const base = /^https?:\/\//i.test(apiBase) ? apiBase : window.location.origin
  try {
    return new URL(pathOrUrl, base).href
  } catch {
    return pathOrUrl
  }
}

function triggerOgFileInput() {
  ogFileInput.value?.click()
}

function handleOgFileSelect(event) {
  const file = event.target.files[0]
  if (!file) return
  ogImageFile.value = file
  ogImagePreview.value = URL.createObjectURL(file)
}

function removeOgImage() {
  ogImageFile.value = null
  ogImagePreview.value = null
  form.value.og_image = ''
  if (ogFileInput.value) ogFileInput.value.value = ''
}

// --- FAQ editor ---
function addFaq() {
  if (form.value.faqs.length >= MAX_FAQS) return
  form.value.faqs.push({ question: '', answer: '' })
}

function removeFaq(index) {
  form.value.faqs.splice(index, 1)
}

function moveFaq(index, direction) {
  const target = index + direction
  if (target < 0 || target >= form.value.faqs.length) return
  const faqs = form.value.faqs
  ;[faqs[index], faqs[target]] = [faqs[target], faqs[index]]
}

function validate() {
  // Client-side hard cap (matches backend validation) — never submit beyond it.
  const capError = hardCapError(form.value.meta_title, form.value.meta_description)
  if (capError) {
    return capError
  }
  const keywordsError = keywordsHardCapError(form.value.keywords)
  if (keywordsError) {
    return keywordsError
  }
  if (form.value.faqs.length > MAX_FAQS) {
    return `FAQ maksimal ${MAX_FAQS}`
  }
  for (let i = 0; i < form.value.faqs.length; i++) {
    const faq = form.value.faqs[i]
    if (!(faq.question || '').trim() || !(faq.answer || '').trim()) {
      return `FAQ #${i + 1}: pertanyaan dan jawaban tidak boleh kosong`
    }
  }
  const ogUrl = (form.value.og_image || '').trim()
  if (ogUrl && !/^https?:\/\//i.test(ogUrl) && !ogImageFile.value) {
    return 'OG Image harus berupa URL http(s) absolut'
  }
  return ''
}

async function handleSubmit() {
  error.value = ''
  errorDetails.value = []
  success.value = ''

  const validationError = validate()
  if (validationError) {
    error.value = validationError
    return
  }

  submitting.value = true

  try {
    // OG image: prefer a freshly uploaded file, otherwise the typed URL
    let ogImageUrl = (form.value.og_image || '').trim()
    if (ogImageFile.value) {
      const ogUploadResult = await upload.image(ogImageFile.value)
      ogImageUrl = toAbsoluteUrl(ogUploadResult.url || ogUploadResult.path || '')
    }
    if (ogImageUrl && !/^https?:\/\//i.test(ogImageUrl)) {
      error.value = 'OG Image harus berupa URL http(s) absolut'
      return
    }

    const payload = {
      meta_title: (form.value.meta_title || '').trim(),
      meta_description: (form.value.meta_description || '').trim(),
      // Trimmed; empty -> null (keywords: string | null contract).
      keywords: keywordsForPayload(form.value.keywords),
      og_image: ogImageUrl,
      noindex: form.value.noindex ? 1 : 0,
      faqs: form.value.faqs.map((faq) => ({
        question: (faq.question || '').trim(),
        answer: (faq.answer || '').trim(),
      })),
    }

    await seoApi.update(page.value.key, payload)

    // Jadikan nilai tersimpan sebagai baseline baru (untuk Reset)
    baseline.value = JSON.parse(JSON.stringify(payload))
    hasEntry.value = true
    success.value = 'Perubahan tersimpan. Halaman publik sedang diperbarui.'
  } catch (err) {
    error.value = err.message || 'Failed to save SEO settings'
    // Field-level errors[] dari API ditampilkan apa adanya.
    errorDetails.value = Array.isArray(err.errors) ? err.errors : []
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  error.value = ''
  errorDetails.value = []
  success.value = ''
  removeOgImage()
  applyData(baseline.value)
}

async function handleDelete() {
  if (!page.value) return
  deleting.value = true
  error.value = ''
  success.value = ''
  try {
    await seoApi.delete(page.value.key)
    router.push('/seo')
  } catch (err) {
    error.value = err.message || 'Failed to delete SEO entry'
    showDeleteConfirm.value = false
  } finally {
    deleting.value = false
  }
}

// --- Data loading ---
const baseline = ref({
  meta_title: '',
  meta_description: '',
  keywords: '',
  og_image: '',
  noindex: 0,
  faqs: [],
})

function applyData(data) {
  form.value = {
    meta_title: data.meta_title || '',
    meta_description: data.meta_description || '',
    keywords: data.keywords ?? '',
    og_image: data.og_image || '',
    noindex: Number(data.noindex) === 1,
    faqs: (data.faqs || []).map((faq) => ({
      question: faq.question || '',
      answer: faq.answer || '',
    })),
  }
}

onMounted(async () => {
  if (!page.value) {
    error.value = 'Halaman tidak dikenal'
    return
  }

  loadingData.value = true
  try {
    const data = await seoApi.getByKey(page.value.key)
    const entry = data && data.page_key ? data : (data && data.entry) || data
    baseline.value = {
      meta_title: entry.meta_title || '',
      meta_description: entry.meta_description || '',
      keywords: entry.keywords ?? '',
      og_image: entry.og_image || '',
      noindex: Number(entry.noindex) === 1 ? 1 : 0,
      faqs: entry.faqs || [],
    }
    applyData(baseline.value)
    hasEntry.value = true
  } catch (err) {
    if (err.status === 404) {
      // Belum ada data SEO untuk halaman ini — form kosong, preview fallback
      hasEntry.value = false
    } else {
      error.value = err.message || 'Failed to load SEO data'
    }
  } finally {
    loadingData.value = false
  }
})
</script>
