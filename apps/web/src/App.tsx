import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { Providers } from '@/app/providers'
import { router } from '@/app/router'
import { initAuthListener } from '@voices/core'

export default function App() {
  // Subscribe to Firebase Auth state — updates useAuthStore globally
  useEffect(() => {
    const unsubscribe = initAuthListener()
    return unsubscribe
  }, [])

  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  )
}
