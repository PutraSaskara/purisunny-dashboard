<template>
  <AdminLayout>
    <div class="max-w-4xl mx-auto">
      <div class="mb-8">
        <router-link to="/articles" class="text-sm text-gray-500 hover:text-brand-forest mb-2 inline-block">
          &larr; Back to Articles
        </router-link>
        <h1 class="text-2xl font-serif text-brand-forest font-bold">
          {{ isEdit ? 'Edit Article' : 'New Article' }}
        </h1>
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

      <!-- Loading State for Edit -->
      <div v-if="isEdit && loadingData" class="flex items-center justify-center py-20">
        <svg class="animate-spin h-8 w-8 text-brand-forest" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-8 space-y-6">
        <!-- Title -->
        <div>
          <label for="title" class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            id="title"
            v-model="form.title"
            type="text"
            required
            @input="autoGenerateSlug"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-colors"
            placeholder="Article title"
          />
        </div>

        <!-- Slug -->
        <div>
          <label for="slug" class="block text-sm font-medium text-gray-700 mb-1">Slug</label>
          <input
            id="slug"
            v-model="form.slug"
            type="text"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-colors bg-gray-50 text-gray-500"
            placeholder="auto-generated-slug"
            readonly
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Category -->
          <div>
            <label for="category" class="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              id="category"
              v-model="form.category_id"
              required
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-colors"
            >
              <option value="" disabled>Select category</option>
              <!-- MUST iterate the data ref `categoriesList` (fetched in onMounted),
                   never the API module â€” the module exposes {getAll, create, delete}
                   and renders nonsense options that block HTML5 required validation. -->
              <option v-for="cat in categoriesList" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>

          <!-- Author -->
          <div>
            <label for="author" class="block text-sm font-medium text-gray-700 mb-1">Author *</label>
            <input
              id="author"
              v-model="form.author"
              type="text"
              required
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-colors"
              placeholder="Author name"
            />
          </div>
        </div>

        <!-- Read Time -->
        <div>
          <label for="read_time" class="block text-sm font-medium text-gray-700 mb-1">Read Time (minutes)</label>
          <input
            id="read_time"
            v-model.number="form.read_time"
            type="number"
            min="1"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-colors"
            placeholder="5"
          />
        </div>

        <!-- Content -->
        <div>
          <div class="flex items-center justify-between gap-4 mb-1">
            <label for="content" class="block text-sm font-medium text-gray-700">Content *</label>
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="showContentPreview = true"
                data-testid="content-preview-btn"
                class="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:border-brand-forest hover:text-brand-forest transition-colors"
              >
                Pratinjau
              </button>
              <button
                type="button"
                @click="showGuidelines = true"
                data-testid="content-guidelines-btn"
                class="px-2 py-1.5 text-xs text-brand-forest hover:underline"
              >
                Panduan
              </button>
            </div>
          </div>
          <textarea
            id="content"
            v-model="form.content"
            required
            rows="16"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-colors resize-y font-mono text-base"
            placeholder="Tulis isi artikel… (## Judul untuk heading, Enter 2x untuk paragraf baru — HTML tetap didukung)"
          ></textarea>
          <!-- Live writing hints (client-side only, non-blocking) -->
          <div
            v-if="contentTipsList.length"
            data-testid="content-tips"
            class="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 space-y-1"
          >
            <p v-for="tip in contentTipsList" :key="tip" class="text-xs text-gray-500">
              {{ tip }}
            </p>
          </div>
        </div>

        <!-- FAQ Editor (opsional — 0 diperbolehkan) -->
        <div class="pt-6 border-t border-gray-100 space-y-4">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-serif text-brand-forest font-bold">FAQ</h2>
              <p class="text-sm text-gray-500 mt-1">
                Opsional — maksimal 20. FAQ tampil sebagai tanya-jawab di akhir artikel dan membantu SEO.
              </p>
            </div>
            <span
              class="text-xs font-medium tabular-nums whitespace-nowrap mt-1"
              :class="form.faqs.length >= MAX_FAQS ? 'text-red-500' : 'text-gray-400'"
              data-testid="faq-counter"
            >
              {{ form.faqs.length }}/{{ MAX_FAQS }} FAQ
            </span>
          </div>

          <!-- Empty state -->
          <div
            v-if="form.faqs.length === 0"
            class="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center text-sm text-gray-400"
            data-testid="faq-empty"
          >
            Belum ada FAQ untuk artikel ini
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
                  data-testid="faq-move-up"
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
                  data-testid="faq-move-down"
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
                  data-testid="faq-remove"
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
                :maxlength="FAQ_QUESTION_MAX"
                data-testid="faq-question"
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-colors"
                placeholder="Pertanyaan yang sering diajukan"
              />
              <div class="flex items-start justify-between gap-4 mt-1">
                <p class="text-xs text-gray-400">Maks {{ FAQ_QUESTION_MAX }} karakter</p>
                <span
                  class="text-xs font-medium tabular-nums whitespace-nowrap"
                  :class="(faq.question || '').trim().length > FAQ_QUESTION_MAX ? 'text-red-500' : 'text-gray-400'"
                  data-testid="faq-question-counter"
                >
                  {{ (faq.question || '').trim().length }}/{{ FAQ_QUESTION_MAX }}
                </span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Answer</label>
              <textarea
                v-model="faq.answer"
                rows="3"
                :maxlength="FAQ_ANSWER_MAX"
                data-testid="faq-answer"
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-colors resize-none"
                placeholder="Jawaban"
              ></textarea>
              <div class="flex items-start justify-between gap-4 mt-1">
                <p class="text-xs text-gray-400">Maks {{ FAQ_ANSWER_MAX }} karakter</p>
                <span
                  class="text-xs font-medium tabular-nums whitespace-nowrap"
                  :class="(faq.answer || '').trim().length > FAQ_ANSWER_MAX ? 'text-red-500' : 'text-gray-400'"
                  data-testid="faq-answer-counter"
                >
                  {{ (faq.answer || '').trim().length }}/{{ FAQ_ANSWER_MAX }}
                </span>
              </div>
            </div>
          </div>

          <!-- Add FAQ -->
          <div class="flex items-center gap-3">
            <button
              type="button"
              @click="addFaq"
              :disabled="form.faqs.length >= MAX_FAQS"
              data-testid="faq-add"
              class="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:border-brand-forest hover:text-brand-forest transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Tambah FAQ
            </button>
            <span class="text-xs text-gray-400" data-testid="faq-quota">
              {{ form.faqs.length >= MAX_FAQS ? 'Kuota FAQ penuh (maks 20)' : `Sisa kuota: ${MAX_FAQS - form.faqs.length}` }}
            </span>
          </div>

          <!-- Live FAQ validation hints (client-side mirror of the backend
               faqs contract — non-blocking until save, see articleFaqErrors) -->
          <div
            v-if="faqValidationErrors.length"
            data-testid="faq-validation"
            class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 space-y-1"
          >
            <p v-for="msg in faqValidationErrors" :key="msg" class="text-xs text-red-600">
              {{ msg }}
            </p>
          </div>

          <p class="text-xs text-gray-400">
            Urutan posisi FAQ mengikuti urutan daftar di atas (FAQ #1 = position 0).
          </p>
        </div>

        <!-- Excerpt -->
        <div>
          <label for="excerpt" class="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
          <textarea
            id="excerpt"
            v-model="form.excerpt"
            rows="3"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-colors resize-none"
            placeholder="Short description for the article..."
          ></textarea>
        </div>

        <!-- Cover Image -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
          <div
            class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-brand-forest transition-colors"
            @click="triggerFileInput"
          >
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleFileSelect"
            />
            <div v-if="!form.cover_image && !imagePreview" class="text-gray-400">
              <svg class="w-12 h-12 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <p class="text-sm">Click to upload cover image</p>
            </div>
            <div v-else class="relative">
              <img
                :src="imagePreview || form.cover_image"
                alt="Cover preview"
                class="max-h-48 mx-auto rounded-lg"
              />
              <button
                type="button"
                @click.stop="removeImage"
                class="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Is Featured -->
        <div>
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              v-model="form.is_featured"
              class="w-5 h-5 rounded border-gray-300 text-brand-forest focus:ring-brand-forest"
            />
            <span class="text-sm font-medium text-gray-700">Featured Article</span>
          </label>
          <p class="text-xs text-gray-500 mt-1">
            Tampilkan sebagai artikel unggulan di halaman Journal (kartu besar paling atas). Cukup satu
            artikel yang dicentang — jika kosong, artikel terbaru otomatis mengisi posisi ini.
          </p>
        </div>

        <!-- SEO Settings -->
        <div class="pt-6 border-t border-gray-100 space-y-6">
          <div>
            <h2 class="text-lg font-serif text-brand-forest font-bold">SEO Settings</h2>
            <p class="text-sm text-gray-500 mt-1">
              Semua field bersifat opsional. Jika dikosongkan, nilai default artikel akan dipakai.
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
                Kosongkan untuk memakai judul artikel (maks 60 karakter disarankan)
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
                Kosongkan untuk memakai excerpt (maks 155 karakter disarankan)
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
              Gambar saat artikel dibagikan di sosmed; kosongkan untuk memakai cover image
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

          <!-- Live Preview -->
          <div class="space-y-4 pt-2">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Preview</p>

            <!-- Google SERP Preview -->
            <div class="border border-gray-200 rounded-lg p-4 bg-white max-w-xl">
              <p class="text-xs text-gray-400 mb-2">Google Search</p>
              <p class="text-sm text-[#188038] truncate">
                purisunnymunduk.id/journal/{{ previewSlug || 'article-slug' }}
              </p>
              <!-- Mock result: ~60 char title with ellipsis (see truncateChars) -->
              <p class="text-[18px] leading-snug text-[#1a0dab] mt-0.5">
                {{ serpTitle || 'Judul artikel' }}
              </p>
              <!-- Mock result: ~155 char description, clamped to 2 lines -->
              <p class="text-sm text-gray-600 mt-1 line-clamp-2">
                {{ serpDescription || 'Deskripsi artikel akan tampil di sini...' }}
              </p>
              <p class="text-[11px] text-gray-400 mt-2 italic" data-testid="serp-source-hint">
                {{ titleSource === 'meta' ? 'Memakai meta title' : 'Memakai judul artikel (meta title kosong)' }}
                <span class="text-gray-300 mx-1">|</span>
                {{ descriptionSource === 'meta' ? 'Memakai meta description' : 'Memakai excerpt artikel (meta description kosong)' }}
              </p>
            </div>

            <!-- Social Share (OG) Preview -->
            <div class="border border-gray-200 rounded-lg overflow-hidden bg-white max-w-md">
              <div class="h-40 bg-gray-100 overflow-hidden flex items-center justify-center">
                <img
                  v-if="ogPreviewSrc || form.cover_image"
                  :src="ogPreviewSrc || form.cover_image"
                  alt="Share preview"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-xs text-gray-400 px-4 text-center">
                  Belum ada gambar share — default OG image situs akan dipakai
                </span>
              </div>
              <div class="p-3 border-t border-gray-100">
                <p class="text-xs text-gray-400 uppercase tracking-wide">purisunnymunduk.id</p>
                <!-- og:title mirrors generateMetadata: branded full title -->
                <p class="text-sm font-medium text-gray-800 mt-0.5 line-clamp-2">
                  {{ socialTitle || 'Judul artikel' }}
                </p>
                <p class="text-xs text-gray-500 mt-1 line-clamp-2">
                  {{ effectiveDescription || 'Deskripsi artikel akan tampil di sini...' }}
                </p>
                <p class="text-[11px] text-gray-400 mt-2 italic">
                  <template v-if="ogPreviewSrc">Memakai OG image di atas</template>
                  <template v-else-if="form.cover_image">Memakai cover image (og_image kosong)</template>
                  <template v-else>Tidak ada og_image maupun cover image</template>
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-4 pt-4 border-t border-gray-100">
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
            {{ submitting ? 'Saving...' : isEdit ? 'Update Article' : 'Create Article' }}
          </button>
          <router-link
            to="/articles"
            class="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </router-link>
        </div>
      </form>

      <!-- Content Preview Modal -->
      <div
        v-if="showContentPreview"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="showContentPreview = false"
      >
        <div
          class="bg-white rounded-xl p-6 max-w-3xl w-full mx-4 shadow-xl max-h-[85vh] overflow-y-auto"
          data-testid="content-preview-modal"
        >
          <h3 class="text-lg font-semibold text-gray-900 mb-1">Pratinjau Artikel</h3>
          <p class="text-xs text-gray-400 mb-4">
            Pratinjau ini mencerminkan cara konten dirender di website (pemformatan otomatis yang sama).
          </p>
          <div class="article-preview" v-html="contentPreviewHtml"></div>
          <div class="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
            <button
              type="button"
              @click="showContentPreview = false"
              class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
      <!-- Content Guidelines Modal -->
      <div
        v-if="showGuidelines"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="showGuidelines = false"
      >
        <div
          class="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 shadow-xl max-h-[85vh] overflow-y-auto"
          data-testid="content-guidelines-modal"
        >
          <div class="flex items-start justify-between gap-4 mb-1">
            <h3 class="text-lg font-semibold text-gray-900">Panduan Menulis Konten (HTML &amp; SEO)</h3>
            <button
              type="button"
              @click="showGuidelines = false"
              aria-label="Tutup panduan"
              class="shrink-0 w-8 h-8 -mr-1 -mt-1 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <p class="text-xs text-gray-400 mb-4">
            Ringkasan format konten: teks biasa + HTML terbatas, agar tampilan artikel dan SEO konsisten.
          </p>

          <div class="guidelines space-y-5 text-sm text-gray-600 leading-relaxed">
            <div>
              <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Struktur heading</h4>
              <ul class="list-disc list-inside space-y-1.5">
                <li>Judul artikel otomatis menjadi H1 — jangan menulis <code>&lt;h1&gt;</code> lagi di dalam konten. Mulai bagian dari H2.</li>
                <li>Tulis <code>## Judul Bagian</code> untuk H2 dan <code>### Sub-bagian</code> untuk H3 (format teks biasa). Boleh juga <code>&lt;h2&gt;</code>/<code>&lt;h3&gt;</code> HTML langsung.</li>
                <li>Semua H2/H3 otomatis masuk <strong>Daftar Isi</strong> di halaman artikel — gunakan judul bagian yang jelas dan mengandung kata kunci.</li>
                <li>Tulis 1–2 paragraf pembuka sebelum H2 pertama (konteks + kata kunci utama).</li>
              </ul>
            </div>

            <div>
              <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Paragraf &amp; format</h4>
              <ul class="list-disc list-inside space-y-1.5">
                <li>Enter 2&times; = paragraf baru. Enter 1&times; = pindah baris saja.</li>
                <li>Blok HTML (<code>&lt;p&gt;</code>, <code>&lt;ul&gt;/&lt;ol&gt;</code>, <code>&lt;blockquote&gt;</code>, <code>&lt;figure&gt;</code>, <code>&lt;table&gt;</code>) diteruskan apa adanya. Hindari style inline.</li>
                <li>Untuk penekanan gunakan <code>&lt;strong&gt;</code>/<code>&lt;em&gt;</code> — bukan <code>&lt;b&gt;</code>/<code>&lt;i&gt;</code>.</li>
              </ul>
            </div>

            <div>
              <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">SEO</h4>
              <ul class="list-disc list-inside space-y-1.5">
                <li>Kata kunci utama muncul di paragraf awal dan minimal pada satu H2.</li>
                <li>Tautkan (internal link) ke halaman lain Puri Sunny yang relevan, mis. <code>/stay/guest-house</code>, <code>/journal/slug-artikel</code>.</li>
                <li>Meta title, description, dan OG image diatur di bagian <strong>SEO</strong> form ini — bukan di dalam konten.</li>
                <li>Gunakan tombol <strong>Preview</strong> untuk memastikan tampilan &amp; Daftar Isi sebelum menyimpan.</li>
              </ul>
            </div>
          </div>

          <div class="flex justify-end pt-4 border-t border-gray-100 mt-5">
            <button
              type="button"
              @click="showGuidelines = false"
              class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Tutup
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
// The categories API module is aliased to `categoriesApi` so its name can never
// collide with template data (e.g. `categoriesList`) again.
import { articles, categories as categoriesApi, upload } from '../api'
import { formatArticleContent, contentTips } from '../contentFormat'
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
  FAQ_MAX_ITEMS,
  FAQ_QUESTION_MAX,
  FAQ_ANSWER_MAX,
  articleFaqErrors,
  faqsForPayload,
  counterState,
  COUNTER_CLASSES,
  hardCapError,
  truncateChars,
  brandArticleTitle,
} from '../seoUtils'

const router = useRouter()
const route = useRoute()

const isEdit = computed(() => !!route.params.id)
const fileInput = ref(null)
const imagePreview = ref(null)
const imageFile = ref(null)
const ogFileInput = ref(null)
const ogImagePreview = ref(null)
const ogImageFile = ref(null)
const submitting = ref(false)
const loadingData = ref(false)
const error = ref('')
// Structured API errors[] shown verbatim (mirrors Redirects.vue).
const errorDetails = ref([])
const categoriesList = ref([])

// FAQ editor quota — single-sourced from the backend contract (seoUtils).
const MAX_FAQS = FAQ_MAX_ITEMS

const form = ref({
  title: '',
  slug: '',
  category_id: '',
  author: '',
  read_time: 5,
  content: '',
  excerpt: '',
  cover_image: '',
  is_featured: false,
  meta_title: '',
  meta_description: '',
  keywords: '',
  og_image: '',
  noindex: false,
  faqs: [],
})

function slugify(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function autoGenerateSlug() {
  if (!isEdit.value) {
    form.value.slug = slugify(form.value.title)
  }
}

// --- Content preview + writing hints (pure client-side) ---
const showContentPreview = ref(false)
// Panduan menulis konten (HTML & SEO) — modal bantuan untuk admin baru.
const showGuidelines = ref(false)
const contentPreviewHtml = computed(() => formatArticleContent(form.value.content))
const contentTipsList = computed(() => contentTips(form.value.content))

// --- SEO helpers ---
const metaTitleCount = computed(() => (form.value.meta_title || '').length)
const metaDescriptionCount = computed(() => (form.value.meta_description || '').length)

// Keywords: single free-text field (comma-separated). The counter shows the
// trimmed length (exactly what gets saved) — grey within the hard cap,
// red over it (same idiom as the FAQ counters above).
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

// Effective values as the public site resolves them (generateMetadata chain):
// meta_title -> article title, meta_description -> excerpt.
const effectiveTitle = computed(
  () => (form.value.meta_title || '').trim() || (form.value.title || '').trim()
)
const effectiveDescription = computed(
  () => (form.value.meta_description || '').trim() || (form.value.excerpt || '').trim()
)
const titleSource = computed(() => ((form.value.meta_title || '').trim() ? 'meta' : 'default'))
const descriptionSource = computed(() => ((form.value.meta_description || '').trim() ? 'meta' : 'default'))
// SERP mock: branded <title> exactly as generateMetadata emits it
// ("| Puri Sunny Journal" suffix), truncated at ~60 chars with an ellipsis.
const serpTitle = computed(() => truncateChars(brandArticleTitle(effectiveTitle.value), TITLE_RECOMMENDED))
const serpDescription = computed(() => truncateChars(effectiveDescription.value, DESCRIPTION_RECOMMENDED))
// og:title mirrors generateMetadata (full branded title, not truncated).
const socialTitle = computed(() => brandArticleTitle(effectiveTitle.value))
const previewSlug = computed(() => form.value.slug || slugify(form.value.title))
const ogPreviewSrc = computed(() => ogImagePreview.value || form.value.og_image || '')

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

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileSelect(event) {
  const file = event.target.files[0]
  if (!file) return
  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
}

function removeImage() {
  imageFile.value = null
  imagePreview.value = null
  form.value.cover_image = ''
  if (fileInput.value) fileInput.value.value = ''
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

// --- FAQ editor (mirror of SeoPageForm's editor; 0 items allowed) ---
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

// Live, non-blocking mirror of the backend faqs validation (seoUtils).
// Empty-row behavior: a fully-empty row is dropped by faqsForPayload before
// submit (see handleSubmit) so an untouched "Tambah FAQ" row never blocks
// saving; a partially-filled row IS an error, exactly like the API.
const faqValidationErrors = computed(() => articleFaqErrors(form.value.faqs))

async function handleSubmit() {
  error.value = ''
  errorDetails.value = []

  if (!form.value.title || !form.value.category_id || !form.value.author || !form.value.content) {
    error.value = 'Please fill in all required fields'
    return
  }

  // Client-side hard cap (matches backend validation) — never submit beyond it.
  const capError = hardCapError(form.value.meta_title, form.value.meta_description)
  if (capError) {
    error.value = capError
    return
  }

  // Keywords hard cap (matches backend validation) — never submit beyond it.
  const keywordsError = keywordsHardCapError(form.value.keywords)
  if (keywordsError) {
    error.value = keywordsError
    return
  }

  // FAQ: client-side mirror of the backend faqs contract (articleFaqErrors).
  // Fully-empty rows are skipped on save (faqsForPayload drops them) so an
  // untouched "Tambah FAQ" row never blocks saving — only partially-filled or
  // over-limit rows are rejected here.
  const faqErrors = articleFaqErrors(form.value.faqs)
  if (faqErrors.length) {
    error.value = faqErrors[0]
    errorDetails.value = faqErrors.slice(1)
    return
  }

  submitting.value = true

  try {
    let imageUrl = form.value.cover_image

    // Upload image if a new file is selected
    if (imageFile.value) {
      const uploadResult = await upload.image(imageFile.value)
      imageUrl = uploadResult.url || uploadResult.path || ''
    }

    // OG image: prefer a freshly uploaded file, otherwise the typed URL
    let ogImageUrl = (form.value.og_image || '').trim()
    if (ogImageFile.value) {
      const ogUploadResult = await upload.image(ogImageFile.value)
      ogImageUrl = toAbsoluteUrl(ogUploadResult.url || ogUploadResult.path || '')
    }
    if (ogImageUrl && !/^https?:\/\//i.test(ogImageUrl)) {
      error.value = 'OG Image must be a valid http(s) URL'
      return
    }

    // read_time is sent as typed: the API coerces it (0 stays 0, absent -> 5).
    // Never `|| 5` here — that would silently rewrite a deliberate 0.
    const payload = {
      title: form.value.title,
      slug: form.value.slug || slugify(form.value.title),
      category_id: form.value.category_id,
      author: form.value.author,
      read_time:
        form.value.read_time === '' || form.value.read_time === null
          ? undefined
          : Number(form.value.read_time),
      content: form.value.content,
      excerpt: form.value.excerpt || '',
      cover_image: imageUrl,
      is_featured: form.value.is_featured,
      meta_title: (form.value.meta_title || '').trim(),
      meta_description: (form.value.meta_description || '').trim(),
      // Trimmed; empty -> null (keywords: string | null contract). Always part
      // of the row update on PUT, exactly like meta_title.
      keywords: keywordsForPayload(form.value.keywords),
      og_image: ogImageUrl,
      noindex: form.value.noindex ? 1 : 0,
      // Replace-all semantics: faqs is always sent (empty rows dropped, ids/
      // positions backend-managed). [] clears the stored list.
      faqs: faqsForPayload(form.value.faqs),
    }

    if (isEdit.value) {
      await articles.update(route.params.id, payload)
    } else {
      await articles.create(payload)
    }

    router.push('/articles')
  } catch (err) {
    // 400: validation message from the API (field-specific).
    // 409: slug already used by another article. 404: the record or its
    // category vanished while this form was open.
    if (err.status === 409) {
      error.value = 'Slug sudah dipakai artikel lain. Ubah judul atau slug terlebih dahulu.'
    } else if (err.status === 404) {
      error.value = err.message || 'Artikel atau kategori tidak ditemukan. Muat ulang halaman.'
    } else {
      error.value = err.message || 'Failed to save article'
    }
    // Field-level errors[] dari API ditampilkan apa adanya.
    errorDetails.value = Array.isArray(err.errors) ? err.errors : []
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const catData = await categoriesApi.getAll()
    categoriesList.value = Array.isArray(catData) ? catData : (catData.data || [])
  } catch {
    // Categories list is optional for form display
  }

  if (isEdit.value) {
    loadingData.value = true
    try {
      // The public GET endpoint matches by slug and wraps the result in
      // { article, related }, while edit links use the numeric id. Support both:
      // try slug first, then fall back to finding the article by id in the list.
      // Numeric ids are never slugs, so skip the slug probe for them â€” probing
      // GET /articles/1 returned a 404 on every edit load (console noise).
      let article = null
      const param = String(route.params.id)
      if (!/^\d+$/.test(param)) {
        try {
          const data = await articles.getBySlug(route.params.id)
          article = data && data.article ? data.article : (data && data.title ? data : null)
        } catch {
          // not found by slug â€” fall back to id lookup below
        }
      }
      if (!article) {
        const list = await articles.getAll()
        // Same list shapes as Articles.vue: bare array (legacy) or the paginated
        // contract { items, ... }.
        const rows = Array.isArray(list) ? list : (list.data || list.items || [])
        const row = rows.find((a) => String(a.id) === param || a.slug === param) || null
        article = row
        // The list payload only reports faq_count — the detail fetch by slug is
        // the only payload carrying faqs[] (there is no GET by numeric id).
        // Resolve the row's slug so the FAQ editor can be populated.
        if (row && row.slug) {
          try {
            const data = await articles.getBySlug(row.slug)
            article = (data && data.article) || article
          } catch {
            // detail unavailable — keep the list row (FAQ editor starts empty)
          }
        }
      }

      if (article) {
        form.value = {
          title: article.title || '',
          slug: article.slug || '',
          category_id: article.category_id ?? '',
          author: article.author || '',
          read_time: article.read_time || 5,
          content: article.content || '',
          excerpt: article.excerpt || '',
          cover_image: article.cover_image || '',
          is_featured: !!article.is_featured,
          meta_title: article.meta_title || '',
          meta_description: article.meta_description || '',
          keywords: article.keywords ?? '',
          og_image: article.og_image || '',
          noindex: !!article.noindex,
          // 0 FAQ diperbolehkan — tanpa faqs di payload detail, editor kosong.
          faqs: (article.faqs || []).map((faq) => ({
            question: faq.question || '',
            answer: faq.answer || '',
          })),
        }
      } else {
        error.value = 'Article not found'
      }
    } catch (err) {
      error.value = err.message || 'Failed to load article'
    } finally {
      loadingData.value = false
    }
  }
})
</script>

<style scoped>
/* Readable article typography for the content preview modal — mirrors the
   public site's article body (prose-like spacing, brand headings). */
.article-preview {
  color: #1f2937;
  font-size: 1rem;
  line-height: 1.75;
}
.article-preview :deep(p) {
  margin: 0 0 1rem;
}
.article-preview :deep(h2) {
  font-family: ui-serif, Georgia, Cambria, 'Times New Roman', serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d5a27;
  margin: 1.75rem 0 0.75rem;
  line-height: 1.3;
}
.article-preview :deep(h3) {
  font-family: ui-serif, Georgia, Cambria, 'Times New Roman', serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: #2d5a27;
  margin: 1.5rem 0 0.5rem;
  line-height: 1.35;
}
.article-preview :deep(ul) {
  list-style: disc;
  margin: 0 0 1rem;
  padding-left: 1.5rem;
}
.article-preview :deep(ol) {
  list-style: decimal;
  margin: 0 0 1rem;
  padding-left: 1.5rem;
}
.article-preview :deep(li) {
  margin: 0.25rem 0;
}
.article-preview :deep(blockquote) {
  border-left: 4px solid #8ba888;
  margin: 1rem 0;
  padding: 0.25rem 0 0.25rem 1rem;
  color: #6b7280;
  font-style: italic;
}
.article-preview :deep(a) {
  color: #2d5a27;
  text-decoration: underline;
}
.article-preview :deep(img) {
  max-width: 100%;
  border-radius: 0.5rem;
}
.article-preview :deep(hr) {
  border: 0;
  border-top: 1px solid #e5e7eb;
  margin: 1.5rem 0;
}
.article-preview :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.875em;
  background: #f3f4f6;
  border-radius: 0.25rem;
  padding: 0.125rem 0.25rem;
}
.article-preview :deep(table) {
  border-collapse: collapse;
  margin: 1rem 0;
}
.article-preview :deep(th),
.article-preview :deep(td) {
  border: 1px solid #e5e7eb;
  padding: 0.5rem 0.75rem;
  text-align: left;
}
/* Inline code chips inside the content guidelines modal. */
.guidelines code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.8125em;
  background: #f3f4f6;
  border-radius: 0.25rem;
  padding: 0.125rem 0.3rem;
}
</style>
