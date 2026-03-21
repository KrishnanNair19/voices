import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import MicNoneIcon from '@mui/icons-material/MicNone'
import NotesIcon from '@mui/icons-material/Notes'
import { tokens } from '@voices/core'
import type { PrimaryType } from '../hooks/useCreateStoryController'

interface StepFormatProps {
  value: PrimaryType
  onChange: (type: PrimaryType) => void
  onNext: () => void
}

const FORMAT_OPTIONS: { type: PrimaryType; icon: React.ReactNode; label: string; body: string }[] = [
  {
    type: 'text',
    icon: <NotesIcon sx={{ fontSize: 32 }} />,
    label: 'Written story',
    body: 'Type your story. Add images or a video to complement your words.',
  },
  {
    type: 'audio',
    icon: <MicNoneIcon sx={{ fontSize: 32 }} />,
    label: 'Voice memo',
    body: 'Record your voice. Add images or a video alongside your recording.',
  },
]

export default function StepFormat({ value, onChange, onNext }: StepFormatProps) {
  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={0.5}>
        What kind of story?
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Pick your primary format. You can add photos and video to either.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
        {FORMAT_OPTIONS.map(({ type, icon, label, body }) => {
          const isSelected = value === type
          return (
            <Box
              key={type}
              onClick={() => onChange(type)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2.5,
                p: 2.5,
                borderRadius: 3,
                border: `2px solid`,
                borderColor: isSelected ? tokens.color.primary : 'rgba(255,255,255,0.1)',
                bgcolor: isSelected ? `${tokens.color.primary}0f` : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s',
                '&:hover': {
                  borderColor: isSelected ? tokens.color.primary : 'rgba(255,255,255,0.25)',
                },
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  bgcolor: isSelected ? `${tokens.color.primary}22` : 'rgba(255,255,255,0.05)',
                  color: isSelected ? tokens.color.primary : 'text.secondary',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                }}
              >
                {icon}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="body1"
                  fontWeight={600}
                  color={isSelected ? tokens.color.primary : 'text.primary'}
                >
                  {label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {body}
                </Typography>
              </Box>
              {/* Selection indicator */}
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: `2px solid`,
                  borderColor: isSelected ? tokens.color.primary : 'rgba(255,255,255,0.2)',
                  bgcolor: isSelected ? tokens.color.primary : 'transparent',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
              >
                {isSelected && (
                  <Box
                    sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: tokens.color.bg }}
                  />
                )}
              </Box>
            </Box>
          )
        })}
      </Box>

      <Button variant="contained" size="large" fullWidth onClick={onNext}>
        Continue
      </Button>
    </Box>
  )
}
