<template>
  <AdminLayout>
    <div class="max-w-5xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-serif text-brand-forest font-bold">Redirects</h1>
          <p class="text-sm text-gray-500 mt-1">
            Peta redirect untuk {{ redirects.length }} path. Aturan 301/302 dipakai saat ada
            permintaan ke path lama (404) di situs publik.
          </p>
        </div>
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

      <!-- Add Redirect Form (admin only) -->
      <div v-if="admin" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Add New Redirect</h2>
        <form @submit.prevent="handleAddRedirect" class="space-y-4">
          <div class="flex flex-wrap items-end gap-4">
            <div class="flex-1 min-w-[200px]">
              <label for="fromPath" class="block text-sm font-medium text-gray-700 mb-1">From Path *</label>
              <input
                id="fromPath"
                v-model="newRedirect.from_path"
                type="text"
                required
                maxlength="255"
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-colors font-mono text-base"
                placeholder="/old-path"
              />
            </div>
            <div class="flex-1 min-w-[200px]">
              <label for="toPath" class="block text-sm font-medium text-gray-700 mb-1">To Path *</label>
              <input
                id="toPath"
                v-model="newRedirect.to_path"
                type="text"
                required
                maxlength="255"
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-colors font-mono text-base"
                placeholder="/new-path"
              />
            </div>
            <div class="w-48">
              <label for="status" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                id="status"
                v-model.number="newRedirect.status"
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-colors"
              >
                <option :value="301">301 — Permanent</option>
                <option :value="302">302 — Temporary</option>
              </select>
            </div>
            <button
              type="submit"
              :disabled="adding"
              class="w-full sm:w-auto bg-brand-forest text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-forest-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ adding ? 'Adding...' : 'Add Redirect' }}
            </button>
          </div>
          <p class="text-xs text-gray-400">
            Path wajib diawali "/" dan tidak boleh memuat "://" atau "#" (maks 255 karakter).
            From dan To harus berbeda.
          </p>
        </form>
      </div>

      <!-- Read-only hint for non-admin sessions -->
      <div
        v-else
        class="bg-amber-50 text-amber-700 px-4 py-3 rounded-lg text-sm mb-6 border border-amber-200"
      >
        Redirects are admin-only. You can view the list below, but only an administrator can add, edit, or delete entries.
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <svg class="animate-spin h-8 w-8 text-brand-forest" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>

      <!-- Empty State -->
      <div v-else-if="redirects.length === 0" class="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
        <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <polyline points="16 3 21 3 21 8"/>
          <line x1="4" y1="20" x2="21" y2="3"/>
          <polyline points="21 16 21 21 16 21"/>
          <line x1="3" y1="4" x2="20" y2="21"/>
        </svg>
        <p class="text-gray-500">No redirects yet. Add one above.</p>
      </div>

      <!-- Redirects Table -->
      <div v-else class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px]">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50">
                <th class="text-left px-3 py-2 sm:px-6 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">From Path</th>
                <th class="text-left px-3 py-2 sm:px-6 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">To Path</th>
                <th class="text-left px-3 py-2 sm:px-6 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th class="text-left px-3 py-2 sm:px-6 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Updated</th>
                <th v-if="admin" class="text-left px-3 py-2 sm:px-6 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="redirect in redirects"
                :key="redirect.id"
                class="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
              >
                <td class="px-3 py-2 sm:px-6 sm:py-4">
                  <span class="text-sm font-medium text-gray-900 font-mono">{{ redirect.from_path }}</span>
                </td>
                <td class="px-3 py-2 sm:px-6 sm:py-4">
                  <span class="inline-flex items-center gap-2">
                    <svg class="w-4 h-4 text-gray-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                    <span class="text-sm text-gray-600 font-mono">{{ redirect.to_path }}</span>
                  </span>
                </td>
                <td class="px-3 py-2 sm:px-6 sm:py-4">
                  <span
                    class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="Number(redirect.status) === 301 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'"
                  >
                    {{ Number(redirect.status) === 301 ? '301' : '302' }}
                  </span>
                </td>
                <td class="px-3 py-2 sm:px-6 sm:py-4">
                  <span class="text-sm text-gray-500">{{ formatDate(redirect.updated_at) }}</span>
                </td>
                <td v-if="admin" class="px-3 py-2 sm:px-6 sm:py-4">
                  <div class="flex items-center gap-3">
                    <button
                      @click="openEdit(redirect)"
                      class="text-brand-forest hover:text-brand-forest-dark text-sm font-medium py-2"
                    >
                      Edit
                    </button>
                    <button
                      @click="handleDeleteRedirect(redirect)"
                      class="text-red-500 hover:text-red-700 text-sm font-medium py-2"
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

      <!-- Edit Redirect Modal -->
      <div
        v-if="editTarget"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="closeEdit"
      >
        <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Edit Redirect</h3>
          <form @submit.prevent="handleUpdateRedirect" class="space-y-4">
            <div>
              <label for="editFromPath" class="block text-sm font-medium text-gray-700 mb-1">From Path *</label>
              <input
                id="editFromPath"
                v-model="editForm.from_path"
                type="text"
                required
                maxlength="255"
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-colors font-mono text-base"
                placeholder="/old-path"
              />
            </div>
            <div>
              <label for="editToPath" class="block text-sm font-medium text-gray-700 mb-1">To Path *</label>
              <input
                id="editToPath"
                v-model="editForm.to_path"
                type="text"
                required
                maxlength="255"
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-colors font-mono text-base"
                placeholder="/new-path"
              />
            </div>
            <div>
              <label for="editStatus" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                id="editStatus"
                v-model.number="editForm.status"
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-colors"
              >
                <option :value="301">301 — Permanent</option>
                <option :value="302">302 — Temporary</option>
              </select>
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button
                type="button"
                @click="closeEdit"
                class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 text-sm font-medium text-white bg-brand-forest hover:bg-brand-forest-dark rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import AdminLayout from '../components/AdminLayout.vue'
import { redirects as api, roleErrorMessage, isAdmin } from '../api'

const admin = isAdmin()
const loading = ref(true)
const adding = ref(false)
const saving = ref(false)
const error = ref('')
const errorDetails = ref([])
const success = ref('')
const redirects = ref([])
const editTarget = ref(null)

const newRedirect = reactive({
  from_path: '',
  to_path: '',
  status: 301,
})

const editForm = reactive({
  from_path: '',
  to_path: '',
  status: 301,
})

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Surface the API error verbatim: role rejections get the shared admin-only
// explanation, everything else shows `message` + the `errors[]` entries as-is
// (validation reasons like "from_path must start with '/'", the 409 uniqueness
// conflict, the "shadows an existing route" refusal, ...).
function applyError(err, fallback) {
  error.value = roleErrorMessage(err) || err.message || fallback
  errorDetails.value = Array.isArray(err.errors) ? err.errors : []
}

function clearError() {
  error.value = ''
  errorDetails.value = []
}

function openEdit(redirect) {
  clearError()
  success.value = ''
  editTarget.value = redirect
  editForm.from_path = redirect.from_path
  editForm.to_path = redirect.to_path
  editForm.status = Number(redirect.status) === 302 ? 302 : 301
}

function closeEdit() {
  editTarget.value = null
}

function normalizeRedirect(row) {
  return {
    ...row,
    status: Number(row.status) === 302 ? 302 : 301,
  }
}

async function handleAddRedirect() {
  if (!newRedirect.from_path || !newRedirect.to_path) {
    clearError()
    error.value = 'From Path and To Path are required'
    return
  }

  adding.value = true
  clearError()
  success.value = ''

  try {
    const result = await api.create({
      from_path: newRedirect.from_path.trim(),
      to_path: newRedirect.to_path.trim(),
      status: newRedirect.status,
    })
    redirects.value.push(normalizeRedirect(result.redirect || result))
    redirects.value.sort((a, b) => a.id - b.id)
    newRedirect.from_path = ''
    newRedirect.to_path = ''
    newRedirect.status = 301
    success.value = 'Redirect added.'
  } catch (err) {
    applyError(err, 'Failed to add redirect')
  } finally {
    adding.value = false
  }
}

async function handleUpdateRedirect() {
  if (!editTarget.value) return
  if (!editForm.from_path || !editForm.to_path) {
    clearError()
    error.value = 'From Path and To Path are required'
    return
  }

  saving.value = true
  clearError()
  success.value = ''

  try {
    const result = await api.update(editTarget.value.id, {
      from_path: editForm.from_path.trim(),
      to_path: editForm.to_path.trim(),
      status: editForm.status,
    })
    const updated = normalizeRedirect(result.redirect || result)
    redirects.value = redirects.value.map((r) => (r.id === updated.id ? updated : r))
    closeEdit()
    success.value = 'Redirect updated.'
  } catch (err) {
    applyError(err, 'Failed to update redirect')
    if (err.status === 404) {
      // Vanished while the modal was open — drop the stale row.
      redirects.value = redirects.value.filter((r) => r.id !== editTarget.value.id)
      closeEdit()
    }
  } finally {
    saving.value = false
  }
}

async function handleDeleteRedirect(redirect) {
  if (!confirm(`Are you sure you want to delete the redirect "${redirect.from_path}"?`)) return

  clearError()
  success.value = ''

  try {
    await api.delete(redirect.id)
    redirects.value = redirects.value.filter((r) => r.id !== redirect.id)
    success.value = 'Redirect deleted.'
  } catch (err) {
    if (err.status === 404) {
      // Already gone — drop the stale row from the list.
      redirects.value = redirects.value.filter((r) => r.id !== redirect.id)
      error.value = 'Redirect sudah tidak ada (mungkin dihapus dari tab lain).'
    } else {
      applyError(err, 'Failed to delete redirect')
    }
  }
}

onMounted(async () => {
  try {
    const data = await api.getAll()
    const rows = (data && data.redirects) || (Array.isArray(data) ? data : [])
    redirects.value = rows.map(normalizeRedirect)
  } catch (err) {
    applyError(err, 'Failed to load redirects')
  } finally {
    loading.value = false
  }
})
</script>
