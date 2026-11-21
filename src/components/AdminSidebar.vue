<template>
  <aside
    class="fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out bg-brand-forest-dark flex flex-col lg:static lg:translate-x-0 lg:min-h-screen"
    :class="open ? 'translate-x-0' : '-translate-x-full'"
  >
    <!-- Logo -->
    <div class="px-6 py-6 border-b border-white/10 flex items-center justify-between">
      <router-link to="/dashboard" class="flex items-center gap-3" @click="emit('close')">
        <img src="/logo.png" alt="Puri Sunny logo" class="w-8 h-8 object-contain" />
        <div>
          <h1 class="text-white font-serif text-lg leading-tight">Puri Sunny</h1>
          <p class="text-brand-sage text-xs">Admin Panel</p>
        </div>
      </router-link>
      <button
        type="button"
        class="lg:hidden w-11 h-11 -mr-2 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Close menu"
        @click="emit('close')"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-4 py-6 space-y-1">
      <router-link
        to="/dashboard"
        class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
        @click="emit('close')"
        :class="isActive('/dashboard') ? 'bg-brand-forest text-white' : 'text-white/70 hover:text-white hover:bg-white/10'"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
        Dashboard
      </router-link>

      <router-link
        to="/bookings"
        class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
        @click="emit('close')"
        :class="isActive('/bookings') ? 'bg-brand-forest text-white' : 'text-white/70 hover:text-white hover:bg-white/10'"
      >
        <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span>Bookings</span>
        <span
          v-if="newLeads > 0"
          class="ml-auto inline-flex items-center justify-center min-w-[1.4rem] px-1.5 py-0.5 rounded-full bg-amber-400 text-brand-forest-dark text-xs font-semibold tabular-nums"
          aria-label="New booking leads"
        >
          {{ newLeads > 99 ? '99+' : newLeads }}
        </span>
      </router-link>

      <router-link
        to="/articles"
        class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
        @click="emit('close')"
        :class="isActive('/articles') ? 'bg-brand-forest text-white' : 'text-white/70 hover:text-white hover:bg-white/10'"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        Articles
      </router-link>

      <router-link
        to="/categories"
        class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
        @click="emit('close')"
        :class="isActive('/categories') ? 'bg-brand-forest text-white' : 'text-white/70 hover:text-white hover:bg-white/10'"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
          <line x1="7" y1="7" x2="7.01" y2="7"/>
        </svg>
        Categories
      </router-link>
      <router-link
        to="/seo"
        class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
        @click="emit('close')"
        :class="isActive('/seo') ? 'bg-brand-forest text-white' : 'text-white/70 hover:text-white hover:bg-white/10'"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        SEO Pages
      </router-link>
      <router-link
        v-if="admin"
        to="/redirects"
        class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
        @click="emit('close')"
        :class="isActive('/redirects') ? 'bg-brand-forest text-white' : 'text-white/70 hover:text-white hover:bg-white/10'"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="16 3 21 3 21 8"/>
          <line x1="4" y1="20" x2="21" y2="3"/>
          <polyline points="21 16 21 21 16 21"/>
          <line x1="3" y1="4" x2="20" y2="21"/>
        </svg>
        Redirects
      </router-link>
    </nav>

    <!-- Logout -->
    <div class="px-4 pb-6">
      <button
        @click="handleLogout"
        class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors w-full"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Logout
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { isAdmin, booking } from '../api'
import { clearAuth } from '../authStorage'

defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])

const router = useRouter()
const route = useRoute()
const admin = isAdmin()

function isActive(path) {
  if (path === '/dashboard') {
    return route.path === '/dashboard'
  }
  return route.path.startsWith(path)
}

// Unread booking count for the Bookings badge. Best-effort: a failure (or a
// role/token edge case) just leaves the badge hidden.
const newLeads = ref(0)

onMounted(async () => {
  try {
    const data = await booking.list({ page: 1, per_page: 1 })
    newLeads.value = data && data.counts ? Number(data.counts.new) || 0 : 0
  } catch {
    newLeads.value = 0
  }
})

function handleLogout() {
  clearAuth()
  router.push('/login')
}
</script>