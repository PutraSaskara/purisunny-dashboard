<template>
  <AdminLayout>
    <div class="max-w-6xl mx-auto">
      <div class="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 class="text-2xl font-serif text-brand-forest font-bold">Articles</h1>
        <div class="flex items-center gap-3">
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
          <router-link
            to="/articles/new"
            class="bg-brand-forest text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-forest-dark transition-colors flex items-center gap-2"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Article
          </router-link>
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

      <!-- Empty State -->
      <div v-else-if="!loading && articles.length === 0" class="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
        <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <p class="text-gray-500 mb-4">No articles yet</p>
        <router-link
          to="/articles/new"
          class="text-brand-forest font-medium hover:underline"
        >
          Create your first article
        </router-link>
      </div>

      <template v-else>
        <!-- Filter empty state -->
        <div
          v-if="visibleArticles.length === 0"
          class="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100"
        >
          <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <p class="text-gray-500">Semua artikel sudah lengkap SEO-nya.</p>
        </div>

        <!-- Articles Table -->
        <div v-else class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[640px]">
              <thead>
                <tr class="border-b border-gray-100 bg-gray-50">
                  <th class="text-left px-3 py-2 sm:px-6 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                  <th class="text-left px-3 py-2 sm:px-6 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th class="text-left px-3 py-2 sm:px-6 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Author</th>
                  <th class="text-left px-3 py-2 sm:px-6 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Read Time</th>
                  <th class="text-left px-3 py-2 sm:px-6 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Featured</th>
                  <th class="text-left px-3 py-2 sm:px-6 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">SEO</th>
                  <th class="text-left px-3 py-2 sm:px-6 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">FAQ</th>
                  <th class="text-left px-3 py-2 sm:px-6 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th class="text-left px-3 py-2 sm:px-6 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="article in visibleArticles" :key="article.id" class="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td class="px-3 py-2 sm:px-6 sm:py-4">
                    <p class="text-sm font-medium text-gray-900 truncate max-w-xs">{{ article.title }}</p>
                  </td>
                  <td class="px-3 py-2 sm:px-6 sm:py-4">
                    <span class="text-sm text-gray-600">{{ article.category?.name || article.category || '-' }}</span>
                  </td>
                  <td class="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                    <span class="text-sm text-gray-600">{{ article.author || '-' }}</span>
                  </td>
                  <td class="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                    <span class="text-sm text-gray-600">{{ article.read_time || '-' }} min</span>
                  </td>
                  <td class="px-3 py-2 sm:px-6 sm:py-4">
                    <span
                      class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="article.is_featured ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                    >
                      {{ article.is_featured ? 'Yes' : 'No' }}
                    </span>
                  </td>
                  <td class="px-3 py-2 sm:px-6 sm:py-4">
                    <div class="flex items-center gap-1 whitespace-nowrap">
                      <span
                        class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium"
                        :class="article.meta_title ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                      >
                        Title {{ article.meta_title ? '✓' : '✗' }}
                      </span>
                      <span
                        class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium"
                        :class="article.meta_description ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                      >
                        Desc {{ article.meta_description ? '✓' : '✗' }}
                      </span>
                      <span
                        class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium"
                        :class="article.og_image ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                      >
                        OG {{ article.og_image ? '✓' : '✗' }}
                      </span>
                      <span
                        class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium tabular-nums"
                        :class="scoreBadgeClass(articleSeoScore(article))"
                        :title="`SEO completeness: ${articleSeoScore(article)}%`"
                      >
                        {{ articleSeoScore(article) }}%
                      </span>
                      <span
                        v-if="isNoindex(article)"
                        class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-200 text-gray-600"
                      >
                        noindex
                      </span>
                    </div>
                  </td>
                  <td class="px-3 py-2 sm:px-6 sm:py-4">
                    <!-- FAQ chip — same treatment as the pages list's FAQ count -->
                    <span
                      v-if="articleFaqCount(article) > 0"
                      class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-ivory text-brand-forest"
                      data-testid="faq-chip"
                    >
                      {{ articleFaqCount(article) }} FAQ
                    </span>
                    <span v-else class="text-xs text-gray-400" data-testid="faq-chip-empty">&mdash;</span>
                  </td>
                  <td class="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                    <span class="text-sm text-gray-500 whitespace-nowrap">{{ formatDate(article.created_at) }}</span>
                  </td>
                  <td class="px-3 py-2 sm:px-6 sm:py-4">
                    <div class="flex items-center gap-3">
                      <router-link
                        :to="`/articles/${article.id}/edit`"
                        class="text-brand-forest hover:text-brand-forest-dark text-sm font-medium py-2 px-3 -mx-3"
                      >
                        Edit
                      </router-link>
                      <button
                        v-if="admin"
                        @click="confirmDelete(article)"
                        class="text-red-500 hover:text-red-700 text-sm font-medium py-2 px-3 -mx-3"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>

      <!-- Delete Confirmation Modal -->
      <div
        v-if="deleteTarget"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="deleteTarget = null"
      >
        <div class="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Delete Article</h3>
          <p class="text-sm text-gray-600 mb-6">
            Are you sure you want to delete "{{ deleteTarget.title }}"? This action cannot be undone.
          </p>
          <div class="flex justify-end gap-3">
            <button
              @click="deleteTarget = null"
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
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '../components/AdminLayout.vue'
import { articles as api, roleErrorMessage, isAdmin } from '../api'
import { articleSeoScore, articleFaqCount, scoreBadgeClass } from '../seoUtils'

const admin = isAdmin()
const loading = ref(true)
const error = ref('')
const articles = ref([])
const deleteTarget = ref(null)
const deleting = ref(false)
// Client-side completeness filter (see seoUtils.articleSeoScore for the formula).
const seoFilter = ref('all')

const visibleArticles = computed(() =>
  seoFilter.value === 'incomplete'
    ? articles.value.filter((article) => articleSeoScore(article) < 100)
    : articles.value
)

function isNoindex(article) {
  return Number(article.noindex) === 1 || article.noindex === true
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function confirmDelete(article) {
  deleteTarget.value = article
}

async function handleDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await api.delete(deleteTarget.value.id)
    articles.value = articles.value.filter(a => a.id !== deleteTarget.value.id)
    deleteTarget.value = null
  } catch (err) {
    error.value = roleErrorMessage(err) || err.message || 'Failed to delete article'
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  try {
    const data = await api.getAll()
    // List payload shapes: bare array (legacy) or the paginated contract
    // { items, total, page, per_page, total_pages } whose rows carry faq_count.
    articles.value = Array.isArray(data) ? data : (data.data || data.items || [])
  } catch (err) {
    error.value = err.message || 'Failed to load articles'
  } finally {
    loading.value = false
  }
})
</script>