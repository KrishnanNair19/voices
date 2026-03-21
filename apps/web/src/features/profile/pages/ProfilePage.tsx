/**
 * ProfilePage — /profile/:username
 *
 * Displays a user's public profile including their avatar, bio, stats,
 * stories grid, and playlists grid. Supports follow/unfollow and linking
 * to the edit page for the current user's own profile.
 */

import { useState } from 'react'
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import MicNoneIcon from '@mui/icons-material/MicNone'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import HeadphonesIcon from '@mui/icons-material/Headphones'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import {
  tokens,
  useUserProfileByUsername,
  useUserStories,
  usePlaylists,
  useIsFollowing,
  useFollowUser,
  useUnfollowUser,
  useAuthStore,
  formatDuration,
} from '@voices/core'
import type { Story, Playlist } from '@voices/core'
import PlaylistCard from '@/features/playlists/components/PlaylistCard'

// ── Inline ProfileStoryCard ───────────────────────────────────────────────────

function contentTypeIcon(type: Story['contentType']) {
  switch (type) {
    case 'audio':
      return <HeadphonesIcon sx={{ fontSize: 28, color: tokens.color.primary }} />
    case 'image':
      return <ImageOutlinedIcon sx={{ fontSize: 28, color: tokens.color.primary }} />
    case 'video':
      return <VideocamOutlinedIcon sx={{ fontSize: 28, color: tokens.color.primary }} />
    case 'text':
      return <ArticleOutlinedIcon sx={{ fontSize: 28, color: tokens.color.primary }} />
    default:
      return <MicNoneIcon sx={{ fontSize: 28, color: tokens.color.primary }} />
  }
}

function ProfileStoryCard({
  story,
  onClick,
}: {
  story: Story
  onClick: () => void
}) {
  const hasThumbnail = !!story.thumbnailUrl

  return (
    <Box
      onClick={onClick}
      sx={{
        bgcolor: tokens.color.surface,
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 2,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
        '&:hover': {
          borderColor: `${tokens.color.primary}40`,
        },
      }}
    >
      {/* Thumbnail / fallback */}
      <Box
        sx={{
          width: '100%',
          aspectRatio: '4/3',
          bgcolor: hasThumbnail ? undefined : `${tokens.color.primary}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {hasThumbnail ? (
          <img
            src={story.thumbnailUrl!}
            alt={story.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          contentTypeIcon(story.contentType)
        )}
      </Box>

      {/* Info */}
      <Box sx={{ px: 1.5, py: 1 }}>
        <Typography
          variant="body2"
          fontWeight={600}
          noWrap
          title={story.title}
          sx={{ mb: 0.25 }}
        >
          {story.title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <PlayCircleOutlineIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
          <Typography variant="caption" color="text.disabled">
            {story.playCount}
          </Typography>
          {story.durationMs != null && story.durationMs > 0 && (
            <>
              <Typography variant="caption" color="text.disabled" sx={{ mx: 0.25 }}>
                ·
              </Typography>
              <Typography variant="caption" color="text.disabled">
                {formatDuration(story.durationMs)}
              </Typography>
            </>
          )}
        </Box>
      </Box>
    </Box>
  )
}

// ── Loading skeleton ───────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <Box sx={{ maxWidth: 860, mx: 'auto', px: { xs: 2, sm: 3 }, pt: 5, pb: 3 }}>
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', mb: 4 }}>
        <Skeleton variant="circular" width={96} height={96} />
        <Box sx={{ flex: 1 }}>
          <Skeleton width="45%" height={32} sx={{ mb: 0.75 }} />
          <Skeleton width="28%" height={18} sx={{ mb: 1.5 }} />
          <Skeleton width="70%" height={16} sx={{ mb: 0.5 }} />
          <Skeleton width="55%" height={16} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" width={280} height={32} sx={{ borderRadius: 1 }} />
        </Box>
      </Box>
      <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1, mb: 3 }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 2 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
        ))}
      </Box>
    </Box>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

type TabValue = 'stories' | 'playlists'

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const currentUid = useAuthStore((s) => s.user?.uid)

  const [tab, setTab] = useState<TabValue>('stories')

  // ── Data fetching ──────────────────────────────────────────────────────────

  const { data: profile, isLoading: profileLoading, error: profileError } =
    useUserProfileByUsername(username ?? null)

  const { data: stories = [], isLoading: storiesLoading } =
    useUserStories(profile?.uid ?? null)

  const { data: playlists = [] } = usePlaylists(profile?.uid)

  const { data: isFollowing = false } = useIsFollowing(profile?.uid ?? '')

  const followUser = useFollowUser()
  const unfollowUser = useUnfollowUser()

  // ── Derived ────────────────────────────────────────────────────────────────

  const isOwnProfile = !!currentUid && currentUid === profile?.uid
  const mutationPending = followUser.isPending || unfollowUser.isPending

  // Filter to public playlists only (ownerId matches profile uid since this is their page)
  const publicPlaylists = (playlists as Playlist[]).filter(
    (pl) => pl.isPublic !== false,
  )

  // ── Loading / error states ─────────────────────────────────────────────────

  if (profileLoading) {
    return <ProfileSkeleton />
  }

  if (profileError || !profile) {
    return (
      <Box sx={{ maxWidth: 860, mx: 'auto', px: { xs: 2, sm: 3 }, py: 5 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Profile not found.
        </Alert>
        <Button
          component={RouterLink}
          to="/"
          variant="outlined"
          sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'text.secondary' }}
        >
          Back to Explore
        </Button>
      </Box>
    )
  }

  const initials = profile.displayName
    ? profile.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?'

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto', px: { xs: 2, sm: 3 } }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <Box sx={{ pt: 5, pb: 3 }}>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <Avatar
            src={profile.profileImageUrl ?? undefined}
            sx={{
              width: 96,
              height: 96,
              bgcolor: tokens.color.primaryDark,
              fontSize: '2rem',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {initials}
          </Avatar>

          {/* Info */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Name */}
            <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2 }}>
              {profile.displayName ?? profile.username}
            </Typography>

            {/* Username */}
            <Typography
              variant="body2"
              color="text.disabled"
              sx={{ mb: profile.bio ? 1.5 : 2 }}
            >
              @{profile.username}
            </Typography>

            {/* Bio */}
            {profile.bio && (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {profile.bio}
              </Typography>
            )}

            {/* Stats */}
            <Box sx={{ display: 'flex', gap: 4, mb: 2.5, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="h6" fontWeight={700} color="text.primary">
                  {stories.length}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  Stories
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} color="text.primary">
                  {profile.followerCount ?? 0}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  Followers
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} color="text.primary">
                  {profile.followingCount ?? 0}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  Following
                </Typography>
              </Box>
            </Box>

            {/* CTA */}
            {isOwnProfile ? (
              <Button
                component={RouterLink}
                to="/profile/edit"
                variant="outlined"
                size="small"
                startIcon={<EditOutlinedIcon />}
                sx={{
                  borderColor: 'rgba(255,255,255,0.2)',
                  color: 'text.secondary',
                  '&:hover': { borderColor: 'rgba(255,255,255,0.4)' },
                }}
              >
                Edit Profile
              </Button>
            ) : currentUid ? (
              <Button
                variant={isFollowing ? 'outlined' : 'contained'}
                size="small"
                disabled={mutationPending}
                onClick={() => {
                  if (isFollowing) {
                    unfollowUser.mutate(profile.uid)
                  } else {
                    followUser.mutate(profile.uid)
                  }
                }}
                sx={
                  isFollowing
                    ? {
                        borderColor: tokens.color.primary,
                        color: tokens.color.primary,
                        '&:hover': { borderColor: tokens.color.primaryDark },
                      }
                    : {
                        bgcolor: tokens.color.primary,
                        color: '#000',
                        '&:hover': { bgcolor: tokens.color.primaryDark },
                      }
                }
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </Button>
            ) : null}
          </Box>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <Tabs
        value={tab}
        onChange={(_, v: TabValue) => setTab(v)}
        sx={{
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          '& .MuiTab-root': { color: 'text.secondary' },
          '& .Mui-selected': { color: `${tokens.color.primary} !important` },
          '& .MuiTabs-indicator': { bgcolor: tokens.color.primary },
        }}
      >
        <Tab value="stories" label="Stories" />
        <Tab value="playlists" label="Playlists" />
      </Tabs>

      {/* ── Stories tab ─────────────────────────────────────────────────── */}
      {tab === 'stories' && (
        <Box sx={{ py: 3 }}>
          {storiesLoading ? (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 2,
              }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rectangular"
                  height={220}
                  sx={{ borderRadius: 2 }}
                />
              ))}
            </Box>
          ) : stories.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 8,
                gap: 1.5,
              }}
            >
              <MicNoneIcon
                sx={{ fontSize: 56, color: 'text.disabled', opacity: 0.4 }}
              />
              <Typography variant="body1" color="text.disabled">
                No stories yet
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 2,
              }}
            >
              {stories.map((story) => (
                <ProfileStoryCard
                  key={story.id}
                  story={story}
                  onClick={() => navigate(`/story/${story.id}`)}
                />
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* ── Playlists tab ───────────────────────────────────────────────── */}
      {tab === 'playlists' && (
        <Box sx={{ py: 3 }}>
          {publicPlaylists.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 8,
                gap: 1.5,
              }}
            >
              <Typography variant="body1" color="text.disabled">
                No public playlists
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 2,
              }}
            >
              {publicPlaylists.map((pl) => (
                <PlaylistCard
                  key={pl.id}
                  playlist={pl}
                  onClick={() => navigate(`/playlists/${pl.id}`)}
                />
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}
