import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Saint App',
    short_name: 'Saint App',
    description: 'A premium app for managing internal operations and resources of Saint Group.',
    start_url: '/',
    display: 'standalone', // This makes it look like a native app (hides browser UI)
    background_color: '#f4f4f5',
    theme_color: '#f4f4f5',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}