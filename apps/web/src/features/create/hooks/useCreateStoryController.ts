/**
 * Wizard state + publish logic for the story creation flow.
 *
 * Content rules (per user spec):
 *   - Primary content: Text OR Voice (required, pick one)
 *   - Attachments: up to 3 images + 1 video (optional, available for both primary types)
 *
 * contentType is derived at publish time:
 *   audio only          → 'audio'
 *   text only           → 'text'
 *   audio + any media   → 'mixed'
 *   text + any media    → 'mixed'
 */

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useCreateStory } from '@voices/core'
import type { GeoPoint } from '@voices/core'

export type PrimaryType = 'text' | 'audio'
export type WizardStep = 0 | 1 | 2 | 3  // Format | Content | Details | Location+Publish

export const WIZARD_STEPS = ['Format', 'Content', 'Details', 'Location'] as const

const MAX_IMAGES = 3
const MAX_VIDEO = 1

export function useCreateStoryController() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const createStory = useCreateStory()

  // ── Wizard navigation ──────────────────────────────────────────────────────
  const [step, setStep] = useState<WizardStep>(0)
  const nextStep = () => setStep((s) => Math.min(3, s + 1) as WizardStep)
  const prevStep = () => setStep((s) => Math.max(0, s - 1) as WizardStep)

  // ── Step 0: Format ─────────────────────────────────────────────────────────
  const [primaryType, setPrimaryType] = useState<PrimaryType>('text')

  // ── Step 1: Content ────────────────────────────────────────────────────────
  const [textContent, setTextContent] = useState('')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioDurationMs, setAudioDurationMs] = useState(0)

  // Attachments — shared regardless of primary type
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [videoFile, setVideoFile] = useState<File | null>(null)

  const addImages = useCallback((files: File[]) => {
    setMediaFiles((prev) => {
      const remaining = MAX_IMAGES - prev.length
      return [...prev, ...files.slice(0, remaining)]
    })
  }, [])

  const removeImage = useCallback((index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const setVideo = useCallback((file: File | null) => {
    setVideoFile(file)
  }, [])

  // ── Step 2: Details ────────────────────────────────────────────────────────
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [isPublic, setIsPublic] = useState(true)
  const [titleError, setTitleError] = useState('')

  const addTag = useCallback((raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, '-')
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags((prev) => [...prev, tag])
    }
  }, [tags])

  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag))
  }, [])

  // ── Step 3: Location ────────────────────────────────────────────────────────
  const [location, setLocation] = useState<GeoPoint | null>(null)
  const [locationName, setLocationName] = useState('')
  const [isGeolocating, setIsGeolocating] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.')
      return
    }
    setIsGeolocating(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setIsGeolocating(false)
      },
      () => {
        setGeoError('Could not detect location. You can type a location name manually.')
        setIsGeolocating(false)
      },
      { timeout: 8000 },
    )
  }, [])

  // ── Upload progress ────────────────────────────────────────────────────────
  const [uploadProgress, setUploadProgress] = useState(0)

  // ── Validation helpers ─────────────────────────────────────────────────────

  /** True when step 1 has enough content to proceed. */
  const step1Valid =
    primaryType === 'text' ? textContent.trim().length > 0 : audioBlob !== null

  const validateDetails = (): boolean => {
    if (!title.trim()) {
      setTitleError('Title is required.')
      return false
    }
    if (title.trim().length > 120) {
      setTitleError('Title must be 120 characters or fewer.')
      return false
    }
    setTitleError('')
    return true
  }

  // ── Publish ────────────────────────────────────────────────────────────────

  const publish = useCallback(async () => {
    if (!user) return
    if (!validateDetails()) {
      setStep(2)
      return
    }

    const hasMedia = mediaFiles.length > 0 || videoFile !== null
    const contentType =
      primaryType === 'audio'
        ? hasMedia ? 'mixed' : 'audio'
        : hasMedia ? 'mixed' : 'text'

    createStory.mutate(
      {
        draft: {
          contentType,
          title: title.trim(),
          description: description.trim(),
          tags,
          isPublic,
          ...(primaryType === 'audio' && audioBlob && { audioBlob }),
          ...(primaryType === 'text' && { textContent: textContent.trim() }),
          ...(mediaFiles.length > 0 && { mediaFiles: mediaFiles.slice(0, MAX_IMAGES) }),
          ...(videoFile && { videoFile: [videoFile].slice(0, MAX_VIDEO)[0] }),
          ...(location && { location }),
          ...(locationName.trim() && { locationName: locationName.trim() }),
          ...(primaryType === 'audio' && { durationMs: audioDurationMs }),
        },
        authorId: user.uid,
        onProgress: setUploadProgress,
      },
      {
        onSuccess: (storyId) => {
          navigate(`/story/${storyId}`, { replace: true })
        },
      },
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user, primaryType, textContent, audioBlob, audioDurationMs,
    mediaFiles, videoFile, title, description, tags, isPublic,
    location, locationName, createStory, navigate,
  ])

  return {
    // Navigation
    step, nextStep, prevStep, setStep,

    // Step 0
    primaryType, setPrimaryType,

    // Step 1 — content
    textContent, setTextContent,
    audioBlob, setAudioBlob,
    audioDurationMs, setAudioDurationMs,
    mediaFiles, addImages, removeImage,
    videoFile, setVideo,
    step1Valid,
    maxImages: MAX_IMAGES,

    // Step 2 — details
    title, setTitle, titleError,
    description, setDescription,
    tags, addTag, removeTag,
    isPublic, setIsPublic,
    validateDetails,

    // Step 3 — location
    location, locationName, setLocationName,
    detectLocation, isGeolocating, geoError,

    // Publish
    publish,
    isPublishing: createStory.isPending,
    publishError: createStory.error?.message ?? null,
    uploadProgress,
  }
}
