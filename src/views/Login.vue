<template>
  <div class="min-h-screen bg-brand-ivory flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-2xl shadow-lg p-8">
        <!-- Branding -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-forest mb-4">
            <img src="/logo.png" alt="Puri Sunny logo" class="w-8 h-8 object-contain" />
          </div>
          <h1 class="text-2xl font-serif text-brand-forest font-bold">Puri Sunny Admin</h1>
          <p class="text-gray-500 text-sm mt-1">Sign in to manage your content</p>
        </div>

        <!-- Error Message -->
        <div
          v-if="errorMessage"
          class="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-6 border border-red-200"
        >
          {{ errorMessage }}
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              id="username"
              v-model="username"
              type="text"
              required
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-colors"
              placeholder="Enter your username"
              :disabled="loading"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-colors"
              placeholder="Enter your password"
              :disabled="loading"
            />
          </div>

          <!-- Remember me -->
          <label for="remember" class="flex items-center gap-2 py-1 cursor-pointer select-none">
            <input
              id="remember"
              v-model="remember"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-brand-forest accent-brand-forest focus:ring-2 focus:ring-brand-forest/20 cursor-pointer"
            />
            <span class="text-sm text-gray-700">Remember me</span>
          </label>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-brand-forest text-white py-3 rounded-lg font-medium hover:bg-brand-forest-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg
              v-if="loading"
              class="animate-spin h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span v-if="loading">Signing in...</span>
            <span v-else>Sign In</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '../api'
import { setAuth } from '../authStorage'

const router = useRouter()

const username = ref('')
const password = ref('')
const remember = ref(true)
const loading = ref(false)
const errorMessage = ref('')

async function handleLogin() {
  errorMessage.value = ''

  if (!username.value || !password.value) {
    errorMessage.value = 'Please fill in all fields'
    return
  }

  loading.value = true

  try {
    const response = await auth.login(username.value, password.value, remember.value)

    if (response.token) {
      setAuth({ token: response.token, user: response.user || null }, remember.value)
      router.push('/dashboard')
    } else {
      errorMessage.value = 'Invalid response from server'
    }
  } catch (error) {
    errorMessage.value = error.message || 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>