/**
 * Airbnb-style search bar with typeahead dropdown.
 *
 * Suggestions are separated into "Locations" and "People" sections.
 * Clicking outside closes the dropdown.
 */

import { useRef, useEffect } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import OutlinedInput from '@mui/material/OutlinedInput'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import SearchIcon from '@mui/icons-material/Search'
import { tokens } from '@voices/core'
import type {
  SearchSuggestion,
  LocationSuggestion,
  UserSuggestion,
} from '../hooks/useExploreController'

interface SearchBarProps {
  value: string
  onChange: (v: string) => void
  onClear: () => void
  onFocus: () => void
  suggestions: SearchSuggestion[]
  isFetching: boolean
  isOpen: boolean
  onSelectLocation: (s: LocationSuggestion) => void
  onSelectUser: (s: UserSuggestion) => void
  onClose: () => void
}

export default function SearchBar({
  value,
  onChange,
  onClear,
  onFocus,
  suggestions,
  isFetching,
  isOpen,
  onSelectLocation,
  onSelectUser,
  onClose,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const locationSuggestions = suggestions.filter(
    (s): s is LocationSuggestion => s.type === 'location',
  )
  const userSuggestions = suggestions.filter(
    (s): s is UserSuggestion => s.type === 'user',
  )

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        !dropdownRef.current?.contains(target) &&
        !inputRef.current?.contains(target)
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const showDropdown =
    isOpen && value.trim().length > 0 && (isFetching || suggestions.length > 0)

  return (
    <Box sx={{ px: 2, pt: 2, pb: 1.5, position: 'relative', zIndex: 10 }}>
      <OutlinedInput
        inputRef={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder="Search locations or people…"
        fullWidth
        size="small"
        startAdornment={
          <InputAdornment position="start">
            {isFetching ? (
              <CircularProgress size={16} sx={{ color: tokens.color.primary }} />
            ) : (
              <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
            )}
          </InputAdornment>
        }
        endAdornment={
          value ? (
            <InputAdornment position="end">
              <IconButton size="small" edge="end" onClick={onClear}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null
        }
        sx={{
          bgcolor: 'rgba(255,255,255,0.05)',
          borderRadius: 2,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255,255,255,0.1)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255,255,255,0.2)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: tokens.color.primary,
          },
        }}
      />

      {/* Typeahead dropdown */}
      {showDropdown && (
        <Paper
          ref={dropdownRef}
          elevation={12}
          sx={{
            position: 'absolute',
            top: 'calc(100% - 4px)',
            left: 16,
            right: 16,
            zIndex: 1300,
            bgcolor: '#1a1f2e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 2,
            overflow: 'hidden',
            maxHeight: 380,
            overflowY: 'auto',
          }}
        >
          {isFetching && suggestions.length === 0 && (
            <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={20} sx={{ color: tokens.color.primary }} />
            </Box>
          )}

          {/* Locations section */}
          {locationSuggestions.length > 0 && (
            <>
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <LocationOnOutlinedIcon
                  sx={{ fontSize: 13, color: 'text.disabled' }}
                />
                <Typography
                  variant="caption"
                  color="text.disabled"
                  fontWeight={600}
                  textTransform="uppercase"
                  letterSpacing={0.5}
                >
                  Locations
                </Typography>
              </Box>

              {locationSuggestions.map((s, i) => (
                <Box
                  key={i}
                  onMouseDown={(e) => {
                    e.preventDefault() // prevent input blur before click fires
                    onSelectLocation(s)
                  }}
                  sx={{
                    px: 2,
                    py: 1.25,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: `${tokens.color.primary}18`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <LocationOnOutlinedIcon
                      sx={{ fontSize: 16, color: tokens.color.primary }}
                    />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={500} noWrap>
                      {s.label}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" noWrap>
                      {s.fullLabel.split(',').slice(2, 4).join(',').trim()}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </>
          )}

          {/* Divider */}
          {locationSuggestions.length > 0 && userSuggestions.length > 0 && (
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 0.5 }} />
          )}

          {/* People section */}
          {userSuggestions.length > 0 && (
            <>
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <PersonOutlineIcon
                  sx={{ fontSize: 13, color: 'text.disabled' }}
                />
                <Typography
                  variant="caption"
                  color="text.disabled"
                  fontWeight={600}
                  textTransform="uppercase"
                  letterSpacing={0.5}
                >
                  People
                </Typography>
              </Box>

              {userSuggestions.map((s) => (
                <Box
                  key={s.uid}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    onSelectUser(s)
                  }}
                  sx={{
                    px: 2,
                    py: 1.25,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                  }}
                >
                  <Avatar
                    src={s.profileImageUrl ?? undefined}
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: tokens.color.primaryDark,
                      fontSize: '0.75rem',
                    }}
                  >
                    {s.displayName[0]?.toUpperCase() ?? '?'}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={500} noWrap>
                      {s.displayName}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      @{s.username}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </>
          )}

          {/* No results */}
          {!isFetching && suggestions.length === 0 && (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.disabled">
                No results found
              </Typography>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  )
}
