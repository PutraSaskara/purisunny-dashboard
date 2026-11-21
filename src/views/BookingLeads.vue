<template>
  <AdminLayout>
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-serif text-brand-forest font-bold">Bookings</h1>
          <span
            v-if="counts.new > 0"
            class="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2.5 py-0.5 text-xs font-medium"
          >
            {{ counts.new }} new
          </span>
        </div>
        <p class="text-sm text-gray-500">
          {{ total }} lead{{ total === 1 ? '' : 's' }}
        </p>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6">
        <form class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3" @submit.prevent="applySearch">
          <div>
            <label for="leadStatus" class="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Status
            </label>
            <select
              id="leadStatus"
              v-model="filters.status"
              class="w-full px-3 py-2.5 min-h-[44px] rounded-lg border border-gray-300 text-sm bg-white focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-colors"
            >
              <option value="">All statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label for="leadChannel" class="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Channel
            </label>
            <select
              id="leadChannel"
              v-model="filters.channel"
              class="w-full px-3 py-2.5 min-h-[44px] rounded-lg border border-gray-300 text-sm bg-white focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-colors"
            >
              <option value="">All channels</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="question">Question</option>
            </select>
          </div>

          <div>
            <label for="leadEmailStatus" class="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Email
            </label>
            <select
              id="leadEmailStatus"
              v-model="filters.email_status"
              class="w-full px-3 py-2.5 min-h-[44px] rounded-lg border border-gray-300 text-sm bg-white focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-colors"
            >
              <option value="">Any email state</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="sending">Sending</option>
              <option value="sent">Sent</option>
              <option value="not_required">Not required</option>
            </select>
          </div>

          <div>
            <label for="leadSearch" class="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Search
            </label>
            <input
              id="leadSearch"
              v-model="searchInput"
              type="search"
              placeholder="Name or email"
              class="w-full px-3 py-2.5 min-h-[44px] rounded-lg border border-gray-300 text-sm bg-white focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-colors"
            />
          </div>

          <div class="flex items-end gap-2">
            <button
              type="submit"
              class="flex-1 bg-brand-forest text-white px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium hover:bg-brand-forest-dark transition-colors"
            >
              Search
            </button>
            <button
              type="button"
              class="px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              @click="resetFilters"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      <!-- Feedback: fixed toast so it stays readable above the drawer
           overlay (drawer/modal sit at z-50). -->
      <div
        v-if="notice"
        class="fixed top-3 inset-x-0 z-[60] flex justify-center px-4 pointer-events-none"
      >
        <div
          class="px-4 py-3 rounded-lg text-sm border shadow-sm max-w-md pointer-events-auto"
          :class="notice.kind === 'error'
            ? 'bg-red-50 text-red-600 border-red-200'
            : 'bg-green-50 text-green-700 border-green-200'"
          role="status"
        >
          {{ notice.text }}
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
      <div v-else-if="error" class="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-6 border border-red-200">
        {{ error }}
      </div>

      <!-- Empty State -->
      <div
        v-else-if="leads.length === 0"
        class="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100"
      >
        <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <p class="text-gray-500 mb-4">No booking leads match this view.</p>
        <button
          v-if="hasFilters"
          class="min-h-[44px] inline-flex items-center text-brand-forest font-medium hover:underline"
          @click="resetFilters"
        >
          Clear filters
        </button>
      </div>

      <template v-else>
        <!-- Desktop table -->
        <div class="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[860px]">
              <thead>
                <tr class="border-b border-gray-100 bg-gray-50">
                  <th class="text-left px-2 py-3 sm:px-2.5 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Guest</th>
                  <th class="text-left px-2 py-3 sm:px-2.5 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Stay</th>
                  <th class="text-left px-2 py-3 sm:px-2.5 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Room</th>
                  <th class="text-left px-2 py-3 sm:px-2.5 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Channel</th>
                  <th class="text-left px-2 py-3 sm:px-2.5 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th class="text-left px-2 py-3 sm:px-2.5 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Email</th>
                  <th class="text-left px-2 py-3 sm:px-2.5 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Created</th>
                  <th class="text-left px-2 py-3 sm:px-2.5 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="lead in leads"
                  :key="lead.id"
                  tabindex="-1"
                  class="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer"
                  @click="openLead(lead, $event)"
                >
                  <td class="px-2 py-3 sm:px-2.5 sm:py-4">
                    <p class="text-sm font-medium text-gray-900 truncate max-w-[140px]">{{ lead.name }}</p>
                    <p class="text-xs text-gray-500 truncate max-w-[140px]">{{ lead.email || lead.phone || '-' }}</p>
                  </td>
                  <!-- Dates wrap here so all 8 columns fit the 1280px content
                       width; the container keeps overflow-x-auto as a safety
                       net below lg. -->
                  <td class="px-2 py-3 sm:px-2.5 sm:py-4 text-sm text-gray-600 align-top">
                    <span class="block">{{ stayDates(lead) }}</span>
                    <span v-if="guestsLabel(lead)" class="block text-xs text-gray-400">{{ guestsLabel(lead) }}</span>
                  </td>
                  <td class="px-2 py-3 sm:px-2.5 sm:py-4">
                    <span class="block text-sm text-gray-600 truncate max-w-[110px]">{{ lead.room_slug || '-' }}</span>
                  </td>
                  <td class="px-2 py-3 sm:px-2.5 sm:py-4">
                    <span
                      class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                      :class="channelClass(lead.channel)"
                    >
                      {{ channelLabel(lead.channel) }}
                    </span>
                  </td>
                  <td class="px-2 py-3 sm:px-2.5 sm:py-4">
                    <span
                      class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                      :class="statusClass(lead.status)"
                    >
                      {{ statusLabel(lead.status) }}
                    </span>
                  </td>
                  <td class="px-2 py-3 sm:px-2.5 sm:py-4">
                    <span
                      class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                      :class="emailStatusClass(lead.email_status)"
                      :title="lead.email_error_code ? `Error: ${lead.email_error_code}` : ''"
                    >
                      {{ emailStatusLabel(lead.email_status) }}
                      <span v-if="lead.email_status === 'failed' && lead.email_error_code" class="font-mono">
                        {{ lead.email_error_code }}
                      </span>
                    </span>
                    <p
                      v-if="lead.email_status === 'failed' && lead.email_attempts"
                      class="text-[10px] text-red-500 mt-1"
                    >
                      {{ lead.email_attempts }} attempt{{ lead.email_attempts === 1 ? '' : 's' }}
                    </p>
                  </td>
                  <td class="px-2 py-3 sm:px-2.5 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
                    {{ formatDate(lead.created_at) }}
                  </td>
                  <td class="px-2 py-3 sm:px-2.5 sm:py-4 whitespace-nowrap">
                    <button
                      class="text-brand-forest hover:text-brand-forest-dark text-sm font-medium"
                      @click.stop="openLead(lead, $event)"
                    >
                      View
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Mobile cards -->
        <div class="md:hidden space-y-3">
          <button
            v-for="lead in leads"
            :key="lead.id"
            type="button"
            class="w-full text-left bg-white rounded-xl shadow-sm border border-gray-100 p-4"
            @click="openLead(lead, $event)"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ lead.name }}</p>
                <p class="text-xs text-gray-500 truncate">{{ lead.email || lead.phone || '-' }}</p>
              </div>
              <span
                class="shrink-0 inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="statusClass(lead.status)"
              >
                {{ statusLabel(lead.status) }}
              </span>
            </div>

            <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
              <span>{{ stayDates(lead) }}</span>
              <span v-if="guestsLabel(lead)">{{ guestsLabel(lead) }}</span>
              <span v-if="lead.room_slug">{{ lead.room_slug }}</span>
              <span
                class="inline-flex px-2 py-0.5 rounded-full font-medium"
                :class="channelClass(lead.channel)"
              >
                {{ channelLabel(lead.channel) }}
              </span>
              <span
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium"
                :class="emailStatusClass(lead.email_status)"
              >
                {{ emailStatusLabel(lead.email_status) }}
                <span v-if="lead.email_status === 'failed' && lead.email_error_code" class="font-mono">
                  {{ lead.email_error_code }}
                </span>
              </span>
            </div>
          </button>
        </div>

        <!-- Pagination -->
        <div
          v-if="totalPages > 1"
          class="flex flex-wrap items-center justify-between gap-3 mt-6"
        >
          <p class="text-sm text-gray-500">
            Page {{ page }} of {{ totalPages }}
          </p>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="page <= 1 || loading"
              @click="goToPage(page - 1)"
            >
              Previous
            </button>
            <button
              type="button"
              class="px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="page >= totalPages || loading"
              @click="goToPage(page + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </template>

      <!-- Detail drawer -->
      <div
        v-if="selected"
        class="fixed inset-0 z-50 flex justify-end"
        @keydown="onDrawerKeydown"
      >
        <div class="absolute inset-0 bg-black/40" @click="closeLead"></div>
        <div
          ref="drawerPanel"
          class="relative w-full sm:max-w-lg bg-white h-full overflow-y-auto shadow-xl focus:outline-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby="leadDrawerTitle"
          tabindex="-1"
        >
          <div class="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h2 id="leadDrawerTitle" class="text-lg font-serif text-brand-forest font-bold truncate">{{ selected.name }}</h2>
              <div class="flex flex-wrap items-center gap-2 mt-1">
                <span
                  class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="statusClass(selected.status)"
                >
                  {{ statusLabel(selected.status) }}
                </span>
                <span
                  class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="channelClass(selected.channel)"
                >
                  {{ channelLabel(selected.channel) }}
                </span>
              </div>
            </div>
            <button
              type="button"
              class="w-11 h-11 -mr-2 shrink-0 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              aria-label="Close"
              @click="closeLead"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="px-5 py-5 space-y-6">
            <!-- Direct follow-up -->
            <div class="flex flex-wrap gap-3">
              <a
                v-if="selected.email"
                :href="`mailto:${selected.email}`"
                class="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium bg-brand-forest text-white hover:bg-brand-forest-dark transition-colors"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Email
              </a>
              <a
                v-if="selected.phone"
                :href="`tel:${selected.phone}`"
                class="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium text-brand-forest bg-brand-ivory hover:bg-brand-sage/20 transition-colors"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                Call
              </a>
            </div>

            <!-- Contact -->
            <div class="bg-gray-50 rounded-xl p-4 space-y-1 text-sm">
              <p v-if="selected.email" class="text-gray-700 break-all">{{ selected.email }}</p>
              <p v-if="selected.phone" class="text-gray-700">{{ selected.phone }}</p>
              <p v-if="!selected.email && !selected.phone" class="text-gray-500">No contact details.</p>
            </div>

            <!-- Stay facts -->
            <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <template v-if="selected.check_in || selected.check_out">
                <div>
                  <dt class="text-xs text-gray-400 uppercase tracking-wide">Check-in</dt>
                  <dd class="text-gray-700">{{ selected.check_in || '—' }}</dd>
                </div>
                <div>
                  <dt class="text-xs text-gray-400 uppercase tracking-wide">Check-out</dt>
                  <dd class="text-gray-700">{{ selected.check_out || '—' }}</dd>
                </div>
              </template>
              <div v-else class="col-span-2">
                <dt class="text-xs text-gray-400 uppercase tracking-wide">Stay</dt>
                <dd class="text-gray-700">No dates — question lead</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-400 uppercase tracking-wide">Guests</dt>
                <dd class="text-gray-700">{{ selected.guests ?? '—' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-400 uppercase tracking-wide">Room</dt>
                <dd class="text-gray-700 break-all">{{ selected.room_slug || '-' }}</dd>
              </div>
              <div class="col-span-2">
                <dt class="text-xs text-gray-400 uppercase tracking-wide">Source page</dt>
                <dd class="text-gray-700 break-all">{{ selected.source_page || '-' }}</dd>
              </div>
              <div class="col-span-2">
                <dt class="text-xs text-gray-400 uppercase tracking-wide">Created</dt>
                <dd class="text-gray-700">{{ formatDateTime(selected.created_at) }}</dd>
              </div>
            </dl>

            <!-- Status selector -->
            <div>
              <label for="detailStatus" class="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Lead status
              </label>
              <select
                id="detailStatus"
                :value="selected.status"
                :disabled="updating"
                class="w-full px-3 py-2.5 min-h-[44px] rounded-lg border border-gray-300 text-sm bg-white focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-colors disabled:opacity-60"
                @change="onStatusChange"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <!-- Email diagnostics -->
              <!-- Question leads never send email: a clean note instead of
                   the diagnostics grid (resend stays email-channel only). -->
              <div v-if="selected.email_status === 'not_required'" class="rounded-xl border border-gray-100 bg-gray-50 p-4 flex flex-wrap items-center gap-2">
                <span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                  Not required
                </span>
                <p class="text-sm text-gray-500">Email not required for this lead.</p>
              </div>

              <div
                v-else
                class="rounded-xl border p-4"
                :class="selected.email_status === 'failed' ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'"
              >
              <div class="flex items-center justify-between gap-3 mb-3">
                <div class="flex items-center gap-2">
                  <span
                    class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="emailStatusClass(selected.email_status)"
                  >
                    {{ emailStatusLabel(selected.email_status) }}
                  </span>
                  <span v-if="selected.email_status === 'failed'" class="text-xs font-medium text-red-600">
                    Delivery failed
                  </span>
                </div>
                <button
                  v-if="selected.channel === 'email'"
                  type="button"
                  class="px-4 py-2.5 min-h-[44px] rounded-lg text-xs font-medium bg-white border border-gray-200 text-brand-forest hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  :disabled="resending"
                  @click="resend"
                >
                  {{ resending ? 'Resending…' : 'Resend email' }}
                </button>
              </div>

              <dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <dt class="text-gray-400 uppercase tracking-wide">Attempts</dt>
                  <dd class="text-gray-700">{{ selected.email_attempts ?? 0 }}</dd>
                </div>
                <div>
                  <dt class="text-gray-400 uppercase tracking-wide">Error code</dt>
                  <dd class="text-gray-700 font-mono">
                    <span v-if="selected.email_error_code">{{ selected.email_error_code }}</span>
                    <span v-else class="font-sans text-gray-400">—</span>
                  </dd>
                </div>
                <div>
                  <dt class="text-gray-400 uppercase tracking-wide">Last attempt</dt>
                  <dd class="text-gray-700">{{ formatDateTime(selected.email_last_attempt_at) }}</dd>
                </div>
                <div>
                  <dt class="text-gray-400 uppercase tracking-wide">Sent at</dt>
                  <dd class="text-gray-700">{{ formatDateTime(selected.email_sent_at) }}</dd>
                </div>
              </dl>
              <p v-if="selected.email_error" class="text-xs text-red-600 mt-2">
                {{ selected.email_error }}
              </p>
            </div>

            <!-- Messages -->
            <div>
              <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">First message</h3>
              <p class="text-sm text-gray-700 whitespace-pre-wrap break-words">{{ selected.first_message || '—' }}</p>
            </div>
            <div>
              <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Full message</h3>
              <p class="text-sm text-gray-700 whitespace-pre-wrap break-words">{{ selected.message || '—' }}</p>
            </div>

            <!-- Delete (admin only) -->
            <div v-if="admin" class="pt-4 border-t border-gray-100">
              <button
                type="button"
                class="min-h-[44px] inline-flex items-center text-red-500 hover:text-red-700 text-sm font-medium"
                @click="openDeleteModal"
              >
                Delete lead
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div
        v-if="deleteTarget"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="deleteTarget = null"
        @keydown="onModalKeydown"
      >
        <div
          ref="modalPanel"
          class="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl focus:outline-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby="deleteLeadTitle"
          tabindex="-1"
        >
          <h3 id="deleteLeadTitle" class="text-lg font-semibold text-gray-900 mb-2">Delete Booking Lead</h3>
          <p class="text-sm text-gray-600 mb-6">
            Are you sure you want to delete the lead from "{{ deleteTarget.name }}"? This action cannot be undone.
          </p>
          <div class="flex justify-end gap-3">
            <button
              class="px-4 py-2.5 min-h-[44px] text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              @click="deleteTarget = null"
            >
              Cancel
            </button>
            <button
              :disabled="deleting"
              class="px-4 py-2.5 min-h-[44px] text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              @click="handleDelete"
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
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import AdminLayout from '../components/AdminLayout.vue'
import { booking as api, roleErrorMessage, isAdmin } from '../api'

const admin = isAdmin()

const loading = ref(true)
const error = ref('')
const notice = ref(null)
const leads = ref([])
const page = ref(1)
const totalPages = ref(0)
const total = ref(0)
const counts = reactive({ new: 0, total: 0 })

const filters = reactive({ status: '', channel: '', email_status: '' })
const searchInput = ref('')
const appliedQuery = ref('')

const selected = ref(null)
const updating = ref(false)
const resending = ref(false)
const deleteTarget = ref(null)
const deleting = ref(false)

// a11y: dialog panels + the elements focus returns to after each layer closes.
const drawerPanel = ref(null)
const modalPanel = ref(null)
const lastTrigger = ref(null)
const deleteTrigger = ref(null)

let noticeTimer = null

const hasFilters = computed(() =>
  Boolean(filters.status || filters.channel || filters.email_status || appliedQuery.value)
)

const STATUS_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
}

const EMAIL_LABELS = {
  not_required: 'Not required',
  pending: 'Pending',
  sending: 'Sending',
  sent: 'Sent',
  failed: 'Failed',
}

function statusLabel(status) {
  return STATUS_LABELS[status] || status || '-'
}

function statusClass(status) {
  switch (status) {
    case 'new':
      return 'bg-amber-100 text-amber-700'
    case 'contacted':
      return 'bg-blue-100 text-blue-700'
    case 'confirmed':
      return 'bg-green-100 text-green-700'
    case 'cancelled':
      return 'bg-gray-200 text-gray-600'
    default:
      return 'bg-gray-100 text-gray-500'
  }
}

function channelLabel(channel) {
  if (channel === 'whatsapp') return 'WhatsApp'
  if (channel === 'email') return 'Email'
  if (channel === 'question') return 'Question'
  return channel || '-'
}

// Question gets a muted sage badge: distinct from WhatsApp green and Email
// ivory, and never red (red stays reserved for failed email delivery).
function channelClass(channel) {
  if (channel === 'whatsapp') return 'bg-green-100 text-green-700'
  if (channel === 'email') return 'bg-brand-ivory text-brand-forest'
  if (channel === 'question') return 'bg-brand-sage/30 text-brand-forest-dark'
  return 'bg-gray-100 text-gray-500'
}

function emailStatusLabel(status) {
  return EMAIL_LABELS[status] || status || '-'
}

// Failed must be the loudest state; sent is green, in-flight states are muted.
function emailStatusClass(status) {
  switch (status) {
    case 'failed':
      return 'bg-red-100 text-red-700'
    case 'sent':
      return 'bg-green-100 text-green-700'
    case 'sending':
    case 'pending':
      return 'bg-amber-100 text-amber-700'
    case 'not_required':
      return 'bg-gray-100 text-gray-500'
    default:
      return 'bg-gray-100 text-gray-500'
  }
}

// Question leads carry no stay dates; both-null renders an em dash instead
// of "null → null", and a single known date renders on its own.
function stayDates(lead) {
  if (lead.check_in && lead.check_out) return `${lead.check_in} → ${lead.check_out}`
  if (lead.check_in) return lead.check_in
  if (lead.check_out) return lead.check_out
  return '—'
}

// '' hides the line entirely (no "- pax"); 1 renders as "1 guest".
function guestsLabel(lead) {
  const guests = lead.guests
  if (guests === null || guests === undefined || guests === '') return ''
  return Number(guests) === 1 ? '1 guest' : `${guests} guests`
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function showNotice(kind, text) {
  notice.value = { kind, text }
  if (noticeTimer) clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => {
    notice.value = null
  }, 5000)
}

function showError(err, fallback) {
  showNotice('error', roleErrorMessage(err) || (err && err.message) || fallback)
}

function applySearch() {
  appliedQuery.value = searchInput.value.trim()
  page.value = 1
  loadLeads()
}

function resetFilters() {
  filters.status = ''
  filters.channel = ''
  filters.email_status = ''
  searchInput.value = ''
  appliedQuery.value = ''
  page.value = 1
  loadLeads()
}

function goToPage(next) {
  if (next < 1) return
  page.value = next
  loadLeads()
}

async function loadLeads() {
  loading.value = true
  error.value = ''
  try {
    const data = await api.list({
      status: filters.status,
      channel: filters.channel,
      email_status: filters.email_status,
      q: appliedQuery.value,
      page: page.value,
      per_page: 20,
    })
    leads.value = Array.isArray(data.items) ? data.items : []
    total.value = typeof data.total === 'number' ? data.total : leads.value.length
    totalPages.value = typeof data.total_pages === 'number' ? data.total_pages : 0
    page.value = typeof data.page === 'number' ? data.page : page.value
    if (data.counts) {
      counts.new = Number(data.counts.new) || 0
      counts.total = Number(data.counts.total) || 0
    }
  } catch (err) {
    error.value = roleErrorMessage(err) || err.message || 'Failed to load booking leads'
  } finally {
    loading.value = false
  }
}

// Replace one row in place so status/resend updates show without a refetch.
function replaceLead(lead) {
  if (!lead) return
  const index = leads.value.findIndex((item) => item.id === lead.id)
  if (index !== -1) {
    leads.value.splice(index, 1, lead)
  }
  if (selected.value && selected.value.id === lead.id) {
    selected.value = lead
  }
}

// --- Dialog keyboard + focus management -------------------------------

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function focusableWithin(container) {
  if (!container) return []
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))
    .filter((el) => el.getClientRects().length > 0)
}

// Keep Tab/Shift+Tab inside an open dialog panel.
function trapTab(container, event) {
  const items = focusableWithin(container)
  if (items.length === 0) {
    event.preventDefault()
    return
  }
  const first = items[0]
  const last = items[items.length - 1]
  const active = document.activeElement
  if (event.shiftKey && (active === first || active === container || !container.contains(active))) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && (active === last || !container.contains(active))) {
    event.preventDefault()
    first.focus()
  }
}

function onDrawerKeydown(event) {
  if (event.key === 'Escape') {
    // While the confirm modal is open it owns Escape; the drawer stays put.
    if (deleteTarget.value) return
    event.stopPropagation()
    closeLead()
    return
  }
  if (event.key === 'Tab') {
    trapTab(drawerPanel.value, event)
  }
}

function onModalKeydown(event) {
  if (event.key === 'Escape') {
    event.stopPropagation()
    deleteTarget.value = null
    return
  }
  if (event.key === 'Tab') {
    trapTab(modalPanel.value, event)
  }
}

function restoreFocus(target) {
  nextTick(() => {
    if (target && document.contains(target)) target.focus()
  })
}

// Focus moves into each dialog on open and back to its trigger on close.
watch(selected, (value, previous) => {
  if (value) {
    nextTick(() => drawerPanel.value && drawerPanel.value.focus())
  } else if (previous) {
    restoreFocus(lastTrigger.value)
  }
})

watch(deleteTarget, (value, previous) => {
  if (value) {
    nextTick(() => modalPanel.value && modalPanel.value.focus())
  } else if (previous) {
    restoreFocus(deleteTrigger.value)
    deleteTrigger.value = null
  }
})

function openDeleteModal(event) {
  deleteTrigger.value = (event && event.currentTarget) || document.activeElement
  deleteTarget.value = selected.value
}

async function openLead(lead, event) {
  lastTrigger.value = (event && event.currentTarget) || document.activeElement
  selected.value = lead
  // Refresh diagnostics (attempts, error code) from the server; the row data
  // already renders instantly, so a failure here is silent.
  try {
    const data = await api.get(lead.id)
    if (data && data.lead && selected.value && selected.value.id === data.lead.id) {
      replaceLead(data.lead)
    }
  } catch {
    // Keep the row data.
  }
}

function closeLead() {
  selected.value = null
}

async function onStatusChange(event) {
  const status = event.target.value
  if (!selected.value || status === selected.value.status) return
  const leadId = selected.value.id
  const previous = selected.value.status
  updating.value = true
  try {
    const data = await api.updateStatus(leadId, status)
    replaceLead(data && data.lead)
    showNotice('success', `Status updated to ${statusLabel(status)}.`)
  } catch (err) {
    // Roll the selector back to the stored value.
    event.target.value = previous
    showError(err, 'Failed to update status')
  } finally {
    updating.value = false
  }
}

async function resend() {
  if (!selected.value) return
  const leadId = selected.value.id
  resending.value = true
  try {
    const data = await api.resendEmail(leadId)
    replaceLead(data && data.lead)
    const status = data && data.lead ? data.lead.email_status : ''
    if (status === 'sent') {
      showNotice('success', 'Email sent.')
    } else if (status === 'failed') {
      showNotice('error', 'Email failed again — see the error code below.')
    } else {
      showNotice('success', 'Email queued for sending.')
    }
  } catch (err) {
    showError(err, 'Failed to resend email')
  } finally {
    resending.value = false
  }
}

async function handleDelete() {
  if (!deleteTarget.value) return
  const leadId = deleteTarget.value.id
  deleting.value = true
  try {
    await api.remove(leadId)
    leads.value = leads.value.filter((item) => item.id !== leadId)
    total.value = Math.max(0, total.value - 1)
    if (selected.value && selected.value.id === leadId) {
      selected.value = null
    }
    deleteTarget.value = null
    showNotice('success', 'Booking lead deleted.')
    // Counts and page bounds may have shifted; refresh quietly.
    loadLeads()
  } catch (err) {
    showError(err, 'Failed to delete booking lead')
  } finally {
    deleting.value = false
  }
}

onMounted(loadLeads)
</script>
