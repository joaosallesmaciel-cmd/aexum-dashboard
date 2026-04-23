export const favicons = {
  dashboard: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="#8DC63F"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>`,
  brands: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="#8DC63F"><circle cx="8" cy="6" r="3"/><path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" fill="#8DC63F"/></svg>`,
  posts: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="#8DC63F"><rect x="1" y="1" width="14" height="14" rx="2"/><rect x="4" y="5" width="8" height="1.5" rx="0.75" fill="#0e0e0e"/><rect x="4" y="8" width="5" height="1.5" rx="0.75" fill="#0e0e0e"/><rect x="4" y="11" width="3" height="1.5" rx="0.75" fill="#0e0e0e"/></svg>`,
  crm: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="#8DC63F"><path d="M2 10V8a6 6 0 1 1 12 0v2"/><path d="M1 10h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-2Z" fill="#8DC63F"/><path d="M15 10h-2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2Z" fill="#8DC63F"/></svg>`,
  login: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="#8DC63F"><rect x="2" y="4" width="12" height="1.8" rx="0.9"/><rect x="2" y="7.1" width="12" height="1.8" rx="0.9"/><rect x="2" y="10.2" width="12" height="1.8" rx="0.9"/></svg>`,
}

export function faviconHref(key: keyof typeof favicons) {
  return `data:image/svg+xml,${encodeURIComponent(favicons[key])}`
}
