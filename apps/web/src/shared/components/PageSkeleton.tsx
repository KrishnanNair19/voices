import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'

/**
 * Full-page loading skeleton shown during lazy-loaded page suspense boundaries.
 */
export default function PageSkeleton() {
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto', width: '100%' }}>
      <Skeleton variant="rectangular" height={48} sx={{ mb: 2, borderRadius: 2 }} />
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Skeleton variant="rectangular" height={400} sx={{ flex: 2, borderRadius: 2 }} />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
        </Box>
      </Box>
    </Box>
  )
}
