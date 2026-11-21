<template>
  <div class="flex min-h-screen bg-gray-100">
    <!-- Mobile top bar (hidden on lg+ where the sidebar is always visible) -->
    <div class="lg:hidden fixed top-0 inset-x-0 z-20 h-14 bg-white border-b border-gray-200 flex items-center gap-3 px-4">
      <button
        type="button"
        class="w-10 h-10 -ml-2 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Open menu"
        @click="sidebarOpen = true"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <div class="w-9 h-9 rounded-full bg-brand-forest flex items-center justify-center shrink-0">
        <img src="/logo.png" alt="Puri Sunny logo" class="w-6 h-6 object-contain" />
      </div>
      <span class="font-serif text-brand-forest font-bold">Puri Sunny Admin</span>
    </div>

    <!-- Drawer backdrop (mobile only) -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-30 bg-black/40 lg:hidden"
      @click="sidebarOpen = false"
    />

    <AdminSidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <!-- pt-16 clears the fixed mobile top bar; lg restores the original p-8 -->
    <main class="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-8 pt-[4.5rem] sm:pt-16 lg:pt-8 overflow-auto">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AdminSidebar from './AdminSidebar.vue'

const route = useRoute()
const sidebarOpen = ref(false)

// Close the drawer after any route change (mobile navigation).
watch(() => route.fullPath, () => {
  sidebarOpen.value = false
})
</script>
