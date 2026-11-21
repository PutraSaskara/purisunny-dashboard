// Registry resmi 18 halaman situs yang dikelola SEO-nya.
// `key` harus persis cocok dengan page_key di backend API /api/seo.
// `path` = URL publik halaman (dipakai untuk preview Google & share URL).
export const SEO_PAGE_GROUPS = [
  {
    name: 'Halaman Statis',
    pages: [
      { key: 'page:home', label: 'Home', path: '/' },
      { key: 'page:our-story', label: 'Our Story', path: '/our-story' },
      { key: 'page:stay', label: 'Stay Overview', path: '/stay' },
      { key: 'page:stay-guest-house', label: 'Puri Sunny Guest House', path: '/stay/guest-house' },
      { key: 'page:stay-camp', label: 'Puri Sunny Camp', path: '/stay/camp' },
      { key: 'page:rooms', label: 'All Rooms & Cottages', path: '/rooms' },
      { key: 'page:experience', label: 'Experience', path: '/experience' },
      { key: 'page:explore-munduk', label: 'Explore Munduk', path: '/explore-munduk' },
      { key: 'page:journal', label: 'Journal', path: '/journal' },
      { key: 'page:reviews', label: 'Reviews', path: '/reviews' },
      { key: 'page:gallery', label: 'Gallery', path: '/gallery' },
      { key: 'page:contact', label: 'Contact', path: '/contact' },
    ],
  },
  {
    name: 'Halaman Kamar',
    pages: [
      { key: 'room:deluxe-room', label: 'Kamar: Deluxe Room', path: '/stay/rooms/deluxe-room' },
      { key: 'room:superior-room', label: 'Kamar: Superior Room', path: '/stay/rooms/superior-room' },
      { key: 'room:standard-double', label: 'Kamar: Standard Double', path: '/stay/rooms/standard-double' },
      { key: 'room:standard-twin', label: 'Kamar: Standard Twin', path: '/stay/rooms/standard-twin' },
      { key: 'room:standard-camp', label: 'Kamar: Standard Double / Twin Camp', path: '/stay/rooms/standard-camp' },
      { key: 'room:family-camp', label: 'Kamar: Family Camp', path: '/stay/rooms/family-camp' },
    ],
  },
]

export const SEO_PAGES = SEO_PAGE_GROUPS.flatMap((group) => group.pages)

export function findSeoPage(pageKey) {
  return SEO_PAGES.find((page) => page.key === pageKey) || null
}
