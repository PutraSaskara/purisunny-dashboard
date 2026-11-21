import { createRouter, createWebHistory } from 'vue-router'
import { getAuth } from '../authStorage'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import Articles from '../views/Articles.vue'
import ArticleForm from '../views/ArticleForm.vue'
import Categories from '../views/Categories.vue'
import SeoPages from '../views/SeoPages.vue'
import SeoPageForm from '../views/SeoPageForm.vue'
import Redirects from '../views/Redirects.vue'
import BookingLeads from '../views/BookingLeads.vue'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', name: 'Login', component: Login },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/bookings', name: 'Bookings', component: BookingLeads, meta: { requiresAuth: true } },
  { path: '/articles', name: 'Articles', component: Articles, meta: { requiresAuth: true } },
  { path: '/articles/new', name: 'ArticleNew', component: ArticleForm, meta: { requiresAuth: true } },
  { path: '/articles/:id/edit', name: 'ArticleEdit', component: ArticleForm, meta: { requiresAuth: true } },
  { path: '/categories', name: 'Categories', component: Categories, meta: { requiresAuth: true } },
  { path: '/seo', name: 'SeoPages', component: SeoPages, meta: { requiresAuth: true } },
  { path: '/seo/:pageKey/edit', name: 'SeoPageEdit', component: SeoPageForm, meta: { requiresAuth: true } },
  { path: '/redirects', name: 'Redirects', component: Redirects, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const token = getAuth()?.token
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router