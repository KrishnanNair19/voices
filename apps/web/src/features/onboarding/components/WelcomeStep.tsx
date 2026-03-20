import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import MicNoneIcon from '@mui/icons-material/MicNone'
import MapOutlinedIcon from '@mui/icons-material/MapOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import { tokens } from '@voices/core'

interface WelcomeStepProps {
  displayName: string | null
  onNext: () => void
}

const FEATURES = [
  { icon: <MicNoneIcon />, title: 'Share your voice', body: 'Record audio stories, write entries, or upload photos and videos.' },
  { icon: <MapOutlinedIcon />, title: 'Place your stories', body: 'Pin stories to places on a map — explore the world through voices.' },
  { icon: <GroupsOutlinedIcon />, title: 'Build your community', body: 'Follow storytellers, curate playlists, leave comments.' },
]

export default function WelcomeStep({ displayName, onNext }: WelcomeStepProps) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      {/* Logo mark */}
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.primaryDark})`,
          boxShadow: `0 0 32px ${tokens.color.primary}44`,
          mx: 'auto',
          mb: 3,
        }}
      />

      <Typography variant="h4" fontWeight={700} mb={1}>
        Welcome to Voices{displayName ? `, ${displayName}` : ''}
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        A few quick steps to set up your account.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4, textAlign: 'left' }}>
        {FEATURES.map(({ icon, title, body }) => (
          <Box key={title} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: `${tokens.color.primary}18`,
                border: `1px solid ${tokens.color.primary}33`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: tokens.color.primary,
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {body}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      <Button variant="contained" size="large" fullWidth onClick={onNext}>
        Get started
      </Button>
    </Box>
  )
}
