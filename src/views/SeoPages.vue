<template>
  <AdminLayout>
    <div class="max-w-6xl mx-auto">
      <div class="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="text-2xl font-serif text-brand-forest font-bold">SEO Pages</h1>
          <p class="text-sm text-gray-500 mt-1">
            Kelola meta SEO & FAQ untuk {{ SEO_PAGES.length }} halaman situs. Perubahan langsung
            diterapkan ke halaman publik setelah disimpan.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <label for="seoFilter" class="text-sm text-gray-500">Show</label>
          <select
            id="seoFilter"
            v-model="seoFilter"
            class="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-colors"
          >
            <option value="all">All</option>
            <option value="incomplete">Incomplete only</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <svg class="animate-spin h-8 w-8 text-brand-forest" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>

      <!-- Error State -->
      <div v-if="error" class="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-6 border border-red-200">
        {{ error }}
      </div>

      <template v-if="!loading && !error">
        <!-- Filter empty state -->
        <div
          v-if="visibleGroups.length === 0"
          class="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100"
        >
          <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <p class="text-gray-500">Semua halaman sudah lengkap SEO-nya.</p>
        </div>

        <section v-for="group in visibleGroups" :key="group.name" class="mb-8">
          <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {{ group.name }}
          </h2>

          <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full min-w-[640px]">
                <thead>
                  <tr class="border-b border-gray-100 bg-gray-50">
                    <th class="text-left px-3 py-2 sm:px-6 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Halaman</th>
                    <th class="text-left px-3 py-2 sm:px-6 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">SEO Completeness</th>
                    <th class="text-left px-3 py-2 sm:px-6 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">FAQ</th>
                    <th class="text-left px-3 py-2 sm:px-6 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Indexing</th>
                    <th class="text-left px-3 py-2 sm:px-6 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="page in group.pages"
                    :key="page.key"
                    class="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                  >
                    <td class="px-3 py-2 sm:px-6 sm:py-4">
                      <p class="text-sm font-medium text-gray-900">{{ page.label }}</p>
                      <p class="text-xs text-gray-400 mt-0.5 font-mono">{{ page.path }}</p>
                      <p class="text-[10px] text-gray-400 mt-0.5">{{ page.key }}</p>
                    </td>
                    <td class="px-3 py-2 sm:px-6 sm:py-4">
                      <div class="flex flex-wrap items-center gap-1.5">
                        <span
                          class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium"
                          :class="hasMetaTitle(page.key) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                        >
                          Title {{ hasMetaTitle(page.key) ? '✓' : '✗' }}
                        </span>
                        <span
                          class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium"
                          :class="hasMetaDescription(page.key) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                        >
                          Desc {{ hasMetaDescription(page.key) ? '✓' : '✗' }}
                        </span>
                        <span
                          class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium"
                          :class="hasOgImage(page.key) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                        >
                          OG {{ hasOgImage(page.key) ? '✓' : '✗' }}
                        </span>
                        <span
                          class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium tabular-nums"
                          :class="scoreBadgeClass(scoreFor(page.key))"
                          :title="`SEO completeness: ${scoreFor(page.key)}%`"
                        >
                          {{ scoreFor(page.key) }}%
                        </span>
                      </div>
                    </td>
                    <td class="px-3 py-2 sm:px-6 sm:py-4">
                      <span
                        v-if="faqCount(page.key) > 0"
                        class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-ivory text-brand-forest"
                      >
                        {{ faqCount(page.key) }} FAQ
                      </span>
                      <span v-else class="text-xs text-gray-400">&mdash;</span>
                    </td>
                    <td class="px-3 py-2 sm:px-6 sm:py-4">
                      <span
                        class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium"
                        :class="isNoindex(page.key) ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-700'"
                      >
                        {{ isNoindex(page.key) ? 'noindex' : 'Terindex' }}
                      </span>
                    </td>
                    <td class="px-3 py-2 sm:px-6 sm:py-4">
                      <router-link
                        :to="`/seo/${encodeURIComponent(page.key)}/edit`"
                        class="text-brand-forest hover:text-brand-forest-dark text-sm font-medium py-2"
                      >
                        Edit
                      </router-link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </template>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '../components/AdminLayout.vue'
import { seo as seoApi } from '../api'
import { SEO_PAGE_GROUPS, SEO_PAGES } from '../seoPages'
import { pageSeoScore, scoreBadgeClass } from '../seoUtils'

const loading = ref(true)
const error = ref('')
const pagesByKey = ref({})
// Client-side completeness filter (see seoUtils.pageSeoScore for the formula).
const seoFilter = ref('all')

const visibleGroups = computed(() => {
  const groups = SEO_PAGE_GROUPS.map((group) => ({
    ...group,
    pages:
      seoFilter.value === 'incomplete'
        ? group.pages.filter((page) => pageSeoScore(entryFor(page.key)) < 100)
        : group.pages,
  })).filter((group) => group.pages.length > 0)
  return groups
})

function entryFor(pageKey) {
  return pagesByKey.value[pageKey] || null
}

function hasMetaTitle(pageKey) {
  const entry = entryFor(pageKey)
  return !!(entry && entry.meta_title)
}

function hasMetaDescription(pageKey) {
  const entry = entryFor(pageKey)
  return !!(entry && entry.meta_description)
}

function hasOgImage(pageKey) {
  const entry = entryFor(pageKey)
  return !!(entry && entry.og_image)
}

function scoreFor(pageKey) {
  return pageSeoScore(entryFor(pageKey))
}

function faqCount(pageKey) {
  const entry = entryFor(pageKey)
  return entry && Array.isArray(entry.faqs) ? entry.faqs.length : 0
}

function isNoindex(pageKey) {
  const entry = entryFor(pageKey)
  return !!(entry && Number(entry.noindex) === 1)
}

onMounted(async () => {
  try {
    const data = await seoApi.getAll()
    const rows = (data && data.pages) || []
    const map = {}
    for (const row of rows) {
      map[row.page_key] = row
    }
    pagesByKey.value = map
  } catch (err) {
    error.value = err.message || 'Failed to load SEO pages'
  } finally {
    loading.value = false
  }
})
</script>
