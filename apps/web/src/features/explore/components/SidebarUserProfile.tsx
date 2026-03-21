/**
 * User profile panel in the explore sidebar.
 *
 * Shown when the user selects a person from the search typeahead.
 * Displays: profile header + stats, playlists, recent stories.
 * Their stories are shown on the map (controlled by the parent via mapStories).
 */

import { Link as RouterLink } from 'react-router-dom'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import QueueMusicIcon from '@mui/icons-material/QueueMusic'
import {
  tokens,
  useUserProfile,
  useUserStories,
  usePlaylists,
  relativeTime,
} from '@voices/core'
import type { Story } from '@voices/core'

interface Props {
  userId: string
  onBack: () => void
  onSelectStory: (story: Story) => void
}

export default function SidebarUserProfile({
  userId,
  onBack,
  onSelectStory,
}: Props) {
  const { data: profile, isLoading: profileLoading } = useUserProfile(userId)
  const { data: stories = [], isLoading: storiesLoading } = useUserStories(userId)
  const { data: playlists = [] } = usePlaylists(userId)

  const isLoading = profileLoading || storiesLoading

  if (isLoading) {
    return (
      <Box sx={{ px: 2, py: 2, flex: 1 }}>
        <Skeleton width={80} height={28} sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Skeleton variant="circular" width={56} height={56} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="60%" height={22} sx={{ mb: 0.5 }} />
            <Skeleton width="40%" height={16} />
          </Box>
        </Box>
        <Skeleton height={16} sx={{ mb: 0.5 }} />
        <Skeleton height={16} width="80%" />
      </Box>
    )
  }

  if (!profile) return null

  return (
    <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
      {/* Back */}
      <Box sx={{ px: 2, pt: 1.5 }}>
        <Button
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{ color: 'text.secondary', pl: 0 }}
        >
          Back
        </Button>
      </Box>

      {/* Profile header */}
      <Box sx={{ px: 2, pt: 1.5, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
          <Avatar
            src={profile.profileImageUrl ?? undefined}
            sx={{
              width: 56,
              height: 56,
              bgcolor: tokens.color.primaryDark,
              fontSize: '1.25rem',
            }}
          >
            {profile.displayName[0]?.toUpperCase() ?? '?'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {profile.displayName}
            </Typography>
            <Typography variant="body2" color="text.disabled">
              @{profile.username}
            </Typography>
          </Box>
        </Box>

        {profile.bio && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1.5, lineHeight: 1.5 }}
          >
            {profile.bio}
          </Typography>
        )}

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 3, mb: 1.5 }}>
          {[
            { value: profile.storyCount, label: 'Stories' },
            { value: profile.followerCount, label: 'Followers' },
            { value: profile.followingCount, label: 'Following' },
          ].map(({ value, label }) => (
            <Box key={label}>
              <Typography variant="subtitle2" fontWeight={700}>
                {value}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                {label}
              </Typography>
            </Box>
          ))}
        </Box>

        <Button
          component={RouterLink}
          to={`/profile/${profile.username}`}
          variant="outlined"
          size="small"
          fullWidth
          sx={{
            borderColor: 'rgba(255,255,255,0.15)',
            color: 'text.secondary',
            borderRadius: 2,
          }}
        >
          View Full Profile
        </Button>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

      {/* Playlists */}
      {playlists.length > 0 && (
        <>
          <Box sx={{ px: 2, pt: 2, pb: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                mb: 1.5,
              }}
            >
              <QueueMusicIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
              <Typography
                variant="caption"
                color="text.disabled"
                fontWeight={600}
                textTransform="uppercase"
                letterSpacing={0.5}
              >
                Playlists
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {playlists.slice(0, 3).map((pl) => (
                <Box
                  key={pl.id}
                  component={RouterLink}
                  to={`/playlists/${pl.id}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1,
                    borderRadius: 1.5,
                    bgcolor: 'rgba(255,255,255,0.03)',
                    textDecoration: 'none',
                    transition: 'background 0.15s',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      bgcolor: `${tokens.color.primary}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}
                  >
                    {pl.coverImageUrl ? (
                      <img
                        src={pl.coverImageUrl}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <QueueMusicIcon
                        sx={{ fontSize: 20, color: tokens.color.primary, opacity: 0.6 }}
                      />
                    )}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={500} noWrap>
                      {pl.title}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {pl.storyIds.length}{' '}
                      {pl.storyIds.length === 1 ? 'story' : 'stories'}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
        </>
      )}

      {/* Recent stories */}
      <Box sx={{ px: 2, pt: 2, pb: 3 }}>
        <Typography
          variant="caption"
          color="text.disabled"
          fontWeight={600}
          textTransform="uppercase"
          letterSpacing={0.5}
          sx={{ mb: 1.5, display: 'block' }}
        >
          Recent Stories
        </Typography>

        {stories.length === 0 ? (
          <Typography variant="body2" color="text.disabled">
            No stories yet.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {stories.slice(0, 6).map((story) => (
              <Box
                key={story.id}
                onClick={() => onSelectStory(story)}
                sx={{
                  display: 'flex',
                  gap: 1.25,
                  p: 1,
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  bgcolor: 'rgba(255,255,255,0.03)',
                  transition: 'background 0.15s',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 1,
                    flexShrink: 0,
                    overflow: 'hidden',
                    bgcolor: `${tokens.color.primary}18`,
                    border: `1px solid ${tokens.color.primary}22`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {story.mediaUrls?.[0] || story.thumbnailUrl ? (
                    <img
                      src={(story.mediaUrls?.[0] ?? story.thumbnailUrl) as string}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : null}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={500} noWrap>
                    {story.title}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {relativeTime(story.createdAt)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  )
}
