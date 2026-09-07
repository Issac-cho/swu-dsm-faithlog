import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SWU-DSM-FaithLog',
    short_name: '슈데페',
    description: '영성생활 기록 및 공동체 관리 PWA',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/dsm_logo.jpg',
        sizes: 'any',
        type: 'image/jpeg',
      },
      {
        src: '/dsm_logo.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        src: '/dsm_logo.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
  }
}
