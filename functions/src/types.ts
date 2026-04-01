import type { Timestamp } from 'firebase-admin/firestore'

// ── Session state machine ────────────────────────────────────────────────────

/**
 * All possible states for a WhatsApp session.
 *
 * Auth states (before a story can be created):
 *   awaiting_auth_email   — no linked account; waiting for user to send their email
 *   awaiting_auth_otp     — email found; waiting for user to confirm with OTP code
 *
 * Story states:
 *   collecting            — receiving content (text / audio / images / video)
 *   awaiting_title        — FINISH received; prompting for story title
 *   awaiting_location     — title collected (or skipped); prompting for location
 *   awaiting_location_confirm — geocoded candidate shown; waiting for YES / NO / new query
 *   awaiting_tags         — location settled; prompting for tags
 *   awaiting_visibility   — tags settled; prompting public vs private
 */
export type SessionState =
  | 'awaiting_auth_email'
  | 'awaiting_auth_otp'
  | 'collecting'
  | 'awaiting_title'
  | 'awaiting_location'
  | 'awaiting_location_confirm'
  | 'awaiting_tags'
  | 'awaiting_visibility'

/**
 * Primary content type chosen by the user.
 * null  = no content yet
 * text  = at least one text message received
 * audio = a WhatsApp voice message (ogg/mpeg) received
 *
 * The logic gate: once contentType is set, the opposite type is rejected.
 * Images and video are always allowed alongside either.
 */
export type ContentType = 'text' | 'audio' | null

// ── Firestore document ───────────────────────────────────────────────────────

/** Stored under whatsapp_sessions/{phoneNumber} in Firestore. */
export interface WhatsAppSession {
  /** E.164 phone number, e.g. "+15551234567". Used as the document ID. */
  phoneNumber: string

  state: SessionState
  contentType: ContentType

  /** Accumulated text content (multiple messages concatenated with newlines). */
  textContent: string

  /** Firebase Storage URL for a voice message, if one was sent. */
  audioUrl: string | null

  /** Firebase Storage URLs for any attached images (up to several). */
  mediaUrls: string[]

  /** Firebase Storage URL for a video attachment. */
  videoUrl: string | null

  // ── Metadata collected during the post-FINISH flow ──────────────────────

  draftTitle: string | null

  /** Confirmed location name (formatted_address from geocoding, or raw text). */
  draftLocation: string | null
  /** Confirmed latitude — 0 if unknown. */
  draftLocationLat: number
  /** Confirmed longitude — 0 if unknown. */
  draftLocationLng: number

  draftTags: string[]
  isPublic: boolean

  // ── Location candidate (awaiting_location_confirm state) ────────────────

  /** Geocoded candidate awaiting user confirmation. */
  pendingLocationName: string | null
  pendingLocationLat: number | null
  pendingLocationLng: number | null

  // ── Auth (awaiting_auth_email / awaiting_auth_otp states) ───────────────

  /** Email entered by user during sign-in; cleared after auth completes. */
  pendingAuthEmail: string | null
  /** 6-digit OTP sent to the user; cleared after successful verification. */
  authOtpCode: string | null
  authOtpExpiresAt: Timestamp | null
  /** Number of failed OTP attempts this session. */
  authOtpAttempts: number

  // ── Identity ─────────────────────────────────────────────────────────────

  /** Voices user ID once authenticated; null until then. */
  userId: string | null

  createdAt: Timestamp
  lastActivityAt: Timestamp

  /** Set once the 1-hour reminder has been sent; null before that. */
  reminderSentAt: Timestamp | null
}

// ── Twilio incoming message shape ────────────────────────────────────────────

/** Parsed fields from a Twilio WhatsApp webhook POST body. */
export interface TwilioInboundMessage {
  /** E.164 with "whatsapp:" prefix, e.g. "whatsapp:+15551234567" */
  From: string
  To: string
  Body: string
  MessageSid: string
  NumMedia: number
  /** MediaUrl0, MediaUrl1, … */
  mediaUrls: string[]
  /** MediaContentType0, MediaContentType1, … */
  mediaContentTypes: string[]
}
