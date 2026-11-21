<template>
  <AdminLayout>
    <div class="max-w-4xl mx-auto">
      <h1 class="text-2xl font-serif text-brand-forest font-bold mb-8">Categories</h1>

      <!-- Error Message -->
      <div
        v-if="error"
        class="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-6 border border-red-200"
      >
        {{ error }}
      </div>

      <!-- Add Category Form -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Add New Category</h2>
        <form @submit.prevent="handleAddCategory" class="flex flex-wrap items-end gap-4">
          <div class="flex-1 min-w-[200px]">
            <label for="catName" class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              id="catName"
              v-model="newCategory.name"
              type="text"
              required
              @input="autoGenerateCatSlug"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-colors"
              placeholder="Category name"
            />
          </div>
          <div class="flex-1 min-w-[200px]">
            <label for="catSlug" class="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              id="catSlug"
              v-model="newCategory.slug"
              type="text"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-colors bg-gray-50 text-gray-500"
              placeholder="auto-generated-slug"
              readonly
            />
          </div>
          <button
            type="submit"
            :disabled="adding"
            class="w-full sm:w-auto bg-brand-forest text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-forest-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ adding ? 'Adding...' : 'Add Category' }}
          </button>
        </form>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <svg class="animate-spin h-8 w-8 text-brand-forest" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>

      <!-- Empty State -->
      <div v-else-if="categories.length === 0" class="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
        <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
          <line x1="7" y1="7" x2="7.01" y2="7"/>
        </svg>
        <p class="text-gray-500">No categories yet. Add one above.</p>
      </div>

      <!-- Categories Table -->
      <div v-else class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px]">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50">
                <th class="text-left px-3 py-2 sm:px-6 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th class="text-left px-3 py-2 sm:px-6 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Slug</th>
                <th class="text-left px-3 py-2 sm:px-6 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cat in categories" :key="cat.id" class="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td class="px-3 py-2 sm:px-6 sm:py-4">
                  <span class="inline-flex items-center gap-2">
                    <svg class="w-4 h-4 text-brand-forest" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                      <line x1="7" y1="7" x2="7.01" y2="7"/>
                    </svg>
                    <span class="text-sm font-medium text-gray-900">{{ cat.name }}</span>
                  </span>
                </td>
                <td class="px-3 py-2 sm:px-6 sm:py-4">
                  <span class="text-sm text-gray-500">{{ cat.slug }}</span>
                </td>
                <td class="px-3 py-2 sm:px-6 sm:py-4">
                  <button
                    @click="handleDeleteCategory(cat)"
                    class="text-red-500 hover:text-red-700 text-sm font-medium py-2"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import AdminLayout from '../components/AdminLayout.vue'
import { categories as api, roleErrorMessage } from '../api'

const loading = ref(true)
const adding = ref(false)
const error = ref('')
const categories = ref([])

const newCategory = reactive({
  name: '',
  slug: '',
})

function autoGenerateCatSlug() {
  newCategory.slug = newCategory.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

async function handleAddCategory() {
  if (!newCategory.name) {
    error.value = 'Category name is required'
    return
  }

  adding.value = true
  error.value = ''

  try {
    const result = await api.create({
      name: newCategory.name,
      slug: newCategory.slug || newCategory.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
    })
    categories.value.push(result.data || result)
    newCategory.name = ''
    newCategory.slug = ''
  } catch (err) {
    if (err.requiredRoles) {
      error.value = roleErrorMessage(err)
    } else if (err.status === 409) {
      error.value = 'Kategori dengan slug ini sudah ada. Gunakan nama lain.'
    } else if (err.status === 400) {
      error.value = err.message || 'Data kategori tidak valid.'
    } else {
      error.value = err.message || 'Failed to add category'
    }
  } finally {
    adding.value = false
  }
}

async function handleDeleteCategory(cat) {
  if (!confirm(`Are you sure you want to delete "${cat.name}"?`)) return

  // Clear the previous banner so a stale message cannot mask the result.
  error.value = ''

  try {
    await api.delete(cat.id)
    categories.value = categories.value.filter(c => c.id !== cat.id)
  } catch (err) {
    if (err.requiredRoles) {
      error.value = roleErrorMessage(err)
    } else if (err.status === 409) {
      // API refuses to delete a category that still has articles attached
      // (ON DELETE SET NULL would silently detach them).
      const count = typeof err.articleCount === 'number' ? err.articleCount : null
      error.value = count !== null
        ? `Kategori "${cat.name}" tidak dapat dihapus: masih dipakai oleh ${count} artikel. Pindahkan atau hapus artikel tersebut terlebih dahulu.`
        : (err.message || 'Kategori masih dipakai oleh artikel, tidak dapat dihapus.')
    } else if (err.status === 404) {
      // Already gone — drop the stale row from the list.
      categories.value = categories.value.filter(c => c.id !== cat.id)
      error.value = 'Kategori sudah tidak ada (mungkin dihapus dari tab lain).'
    } else {
      error.value = err.message || 'Failed to delete category'
    }
  }
}

onMounted(async () => {
  try {
    const data = await api.getAll()
    categories.value = Array.isArray(data) ? data : (data.data || [])
  } catch (err) {
    error.value = err.message || 'Failed to load categories'
  } finally {
    loading.value = false
  }
})
</script>