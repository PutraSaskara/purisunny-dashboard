<template>
  <AdminLayout>
    <div class="max-w-6xl mx-auto">
      <h1 class="text-2xl font-serif text-brand-forest font-bold mb-8">Dashboard</h1>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <svg class="animate-spin h-8 w-8 text-brand-forest" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>

      <!-- Stats Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-brand-forest/10 flex items-center justify-center">
              <svg class="w-6 h-6 text-brand-forest" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div>
              <p class="text-sm text-gray-500">Total Articles</p>
              <p class="text-3xl font-bold text-brand-forest">{{ stats.totalArticles }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-brand-sage/20 flex items-center justify-center">
              <svg class="w-6 h-6 text-brand-forest" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            </div>
            <div>
              <p class="text-sm text-gray-500">Categories</p>
              <p class="text-3xl font-bold text-brand-forest">{{ stats.totalCategories }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <svg class="w-6 h-6 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <div>
              <p class="text-sm text-gray-500">Recent Contacts</p>
              <p class="text-3xl font-bold text-brand-forest">{{ stats.recentContacts }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Contacts -->
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 class="text-lg font-serif text-brand-forest font-bold mb-4">Recent Contacts</h2>

        <p v-if="recentContacts.length === 0" class="text-sm text-gray-500 py-4">
          No contact messages yet.
        </p>

        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[640px]">
            <thead>
              <tr class="text-left text-xs uppercase tracking-wide text-gray-400 border-b border-gray-100">
                <th class="py-2 pr-3 sm:py-3 sm:pr-4 font-medium">Name</th>
                <th class="py-2 pr-3 sm:py-3 sm:pr-4 font-medium">Contact</th>
                <th class="py-2 pr-3 sm:py-3 sm:pr-4 font-medium">Message</th>
                <th class="py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="contact in recentContacts"
                :key="contact.id"
                class="border-b border-gray-50 last:border-0 align-top"
              >
                <td class="py-2 pr-3 sm:py-3 sm:pr-4">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-gray-800">{{ contact.name }}</span>
                    <span
                      v-if="!contact.is_read"
                      class="inline-flex items-center rounded-full bg-amber-100 text-amber-600 px-2 py-0.5 text-xs font-medium"
                    >
                      New
                    </span>
                  </div>
                </td>
                <td class="py-2 pr-3 sm:py-3 sm:pr-4 text-gray-500">
                  <p v-if="contact.email">{{ contact.email }}</p>
                  <p v-if="contact.phone">{{ contact.phone }}</p>
                </td>
                <td class="py-2 pr-3 sm:py-3 sm:pr-4 text-gray-600 max-w-sm">{{ excerpt(contact.message) }}</td>
                <td class="py-2 pr-3 sm:py-3 sm:pr-4 text-gray-500 whitespace-nowrap">{{ formatDate(contact.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Error State -->
      <div v-if="error" class="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-200">
        {{ error }}
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminLayout from '../components/AdminLayout.vue'
import { articles, categories, contacts } from '../api'

const loading = ref(true)
const error = ref('')
const stats = ref({
  totalArticles: 0,
  totalCategories: 0,
  recentContacts: 0,
})
const recentContacts = ref([])

// Trim whitespace and cap the preview at ~80 characters.
function excerpt(message) {
  const text = (message || '').replace(/\s+/g, ' ').trim()
  return text.length > 80 ? `${text.slice(0, 80)}…` : text
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(async () => {
  // Contacts fetch is isolated from the article/category fetches: if it fails,
  // the other stats still render and only the contacts error is surfaced.
  let contactsData = null
  const contactsPromise = contacts.getAll(5)
    .then((data) => {
      contactsData = data
    })
    .catch((err) => {
      error.value = err.message || 'Failed to load recent contacts'
    })

  try {
    const [articlesData, categoriesData] = await Promise.all([
      articles.getAll(),
      categories.getAll(),
      contactsPromise,
    ])

    stats.value = {
      totalArticles: Array.isArray(articlesData) ? articlesData.length : (articlesData.data ? articlesData.data.length : 0),
      totalCategories: Array.isArray(categoriesData) ? categoriesData.length : (categoriesData.data ? categoriesData.data.length : 0),
      recentContacts: contactsData
        ? (typeof contactsData.total === 'number' ? contactsData.total : (Array.isArray(contactsData.contacts) ? contactsData.contacts.length : 0))
        : 0,
    }

    if (contactsData) {
      recentContacts.value = Array.isArray(contactsData.contacts) ? contactsData.contacts : []
    }
  } catch (err) {
    error.value = err.message || 'Failed to load dashboard data'
  } finally {
    loading.value = false
  }
})
</script>