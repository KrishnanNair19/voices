import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { tokens } from '@voices/core'

interface PlaceholderPageProps {
  title: string
  subtitle?: string
}

/**
 * Temporary stub page for routes not yet implemented (Phase 3.2+).
 * Replaced feature-by-feature as each phase ships.
 */
export default function PlaceholderPage({ title, subtitle }: PlaceholderPageProps) {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 4,
        minHeight: '60vh',
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${tokens.color.primary}22, ${tokens.color.primary}44)`,
          border: `2px solid ${tokens.color.primary}55`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: tokens.color.primary,
            opacity: 0.8,
          }}
        />
      </Box>

      <Typography variant="h5" fontWeight={700} color="text.primary">
        {title}
      </Typography>

      {subtitle && (
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {subtitle}
        </Typography>
      )}
    </Box>
  )
}
