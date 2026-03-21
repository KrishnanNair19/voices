import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import FilledInput from '@mui/material/FilledInput'
import FormControl from '@mui/material/FormControl'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import LinearProgress from '@mui/material/LinearProgress'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import PublishIcon from '@mui/icons-material/Publish'
import type { GeoPoint } from '@voices/core'
import { tokens } from '@voices/core'

interface StepLocationProps {
  location: GeoPoint | null
  locationName: string
  onLocationNameChange: (v: string) => void
  onDetectLocation: () => void
  isGeolocating: boolean
  geoError: string | null

  // Publish
  onBack: () => void
  onPublish: () => void
  isPublishing: boolean
  publishError: string | null
  uploadProgress: number
}

export default function StepLocation({
  location,
  locationName,
  onLocationNameChange,
  onDetectLocation,
  isGeolocating,
  geoError,
  onBack,
  onPublish,
  isPublishing,
  publishError,
  uploadProgress,
}: StepLocationProps) {
  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={0.5}>
        Where is this story?
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Pin a location so others can find stories near them. Completely optional.
      </Typography>

      {/* Auto-detect */}
      <Button
        variant="outlined"
        startIcon={
          isGeolocating ? (
            <CircularProgress size={16} color="inherit" />
          ) : location ? (
            <CheckCircleOutlineIcon sx={{ color: 'success.main' }} />
          ) : (
            <MyLocationIcon />
          )
        }
        onClick={onDetectLocation}
        disabled={isGeolocating}
        fullWidth
        sx={{
          mb: 2,
          borderColor: location
            ? 'success.main'
            : 'rgba(255,255,255,0.15)',
          color: location ? 'success.main' : 'text.secondary',
          '&:hover': { borderColor: location ? 'success.main' : 'rgba(255,255,255,0.3)' },
        }}
      >
        {isGeolocating
          ? 'Detecting location…'
          : location
          ? `Location detected (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`
          : 'Use my current location'}
      </Button>

      {geoError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {geoError}
        </Alert>
      )}

      {/* Manual location name */}
      <FormControl fullWidth variant="filled" sx={{ mb: 4 }}>
        <InputLabel>Location name (optional)</InputLabel>
        <FilledInput
          value={locationName}
          onChange={(e) => onLocationNameChange(e.target.value)}
          placeholder="e.g. Golden Gate Bridge, San Francisco"
          inputProps={{ maxLength: 100 }}
          startAdornment={
            <InputAdornment position="start" sx={{ mt: '18px' }}>
              <MyLocationIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
            </InputAdornment>
          }
        />
      </FormControl>

      {publishError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {publishError}
        </Alert>
      )}

      {/* Upload progress */}
      {isPublishing && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Uploading your story…
            </Typography>
            <Typography variant="caption" color={tokens.color.primary}>
              {uploadProgress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={uploadProgress}
            sx={{
              height: 4,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.08)',
              '& .MuiLinearProgress-bar': { bgcolor: tokens.color.primary, borderRadius: 2 },
            }}
          />
        </Box>
      )}

      {/* Navigation */}
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Button
          variant="outlined"
          onClick={onBack}
          disabled={isPublishing}
          sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'text.secondary' }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={onPublish}
          disabled={isPublishing}
          startIcon={isPublishing ? <CircularProgress size={16} color="inherit" /> : <PublishIcon />}
          sx={{ flex: 1 }}
        >
          {isPublishing ? 'Publishing…' : 'Publish story'}
        </Button>
      </Box>

      {/* Skip hint */}
      {!isPublishing && (
        <Typography variant="caption" color="text.disabled" textAlign="center" display="block" mt={1.5}>
          Location is optional — you can publish without one.
        </Typography>
      )}
    </Box>
  )
}
