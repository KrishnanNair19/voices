import type { Timestamp } from 'firebase-admin/firestore'

// ── Session state machine ────────────────────────────────────────────────────

/**
 * Lifecycle states for a WhatsApp story-creation session.
 *
 * collecting       — user is actively sending content (text / audio / images)
 * awaiting_title   — FINISH received; prompting for a story title
 * awaiting_location — title collected (or skipped); prompting for location
 * awaiting_tags    — location collected (or skipped); prompting for tags
 * awaiting_visibility — tags collected (or skipped); prompting public/private
 */
export type SessionState =
  | 'collecting'
  | 'awaiting_title'
  | 'awaiting_location'
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

  // Metadata collected during the post-FINISH flow
  draftTitle: string | null
  draftLocation: string | null
  draftTags: string[]
  isPublic: boolean

  /** Voices user ID linked to this phone number; null if not yet linked. */
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
