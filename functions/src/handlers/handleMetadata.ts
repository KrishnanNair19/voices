import type { Response } from 'express'
import { twimlReply } from '../webhook/twilioHelper'
import { updateSession, deleteSession } from '../webhook/sessionManager'
import { publishStory } from '../story/storyPublisher'
import type { WhatsAppSession, TwilioInboundMessage } from '../types'
import { config } from '../config'

const SKIP = 'SKIP'

/**
 * Handles responses during the post-FINISH metadata collection flow.
 *
 * State machine:
 *   awaiting_title      → awaiting_location  (or skip)
 *   awaiting_location   → awaiting_tags      (or skip)
 *   awaiting_tags       → awaiting_visibility (or skip)
 *   awaiting_visibility → publish + send link
 */
export async function handleMetadata(
  phoneNumber: string,
  session: WhatsAppSession,
  msg: TwilioInboundMessage,
  res: Response,
): Promise<void> {
  const body = msg.Body.trim()
  const isSkip = body.toUpperCase() === SKIP

  switch (session.state) {
    // ── Title ──────────────────────────────────────────────────────────────
    case 'awaiting_title': {
      const title = isSkip ? null : body
      await updateSession(phoneNumber, {
        draftTitle: title,
        state: 'awaiting_location',
      })
      twimlReply(
        res,
        `📍 *Where did this story take place?*\n` +
          `Enter a location name (e.g. "Hanoi, Vietnam") or SKIP.`,
      )
      break
    }

    // ── Location ───────────────────────────────────────────────────────────
    case 'awaiting_location': {
      const location = isSkip ? null : body
      await updateSession(phoneNumber, {
        draftLocation: location,
        state: 'awaiting_tags',
      })
      twimlReply(
        res,
        `🏷 *Add some tags* to help others find your story.\n` +
          `Enter comma-separated tags (e.g. "travel, food, vietnam") or SKIP.`,
      )
      break
    }

    // ── Tags ───────────────────────────────────────────────────────────────
    case 'awaiting_tags': {
      const tags = isSkip
        ? []
        : body
            .split(',')
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean)

      await updateSession(phoneNumber, {
        draftTags: tags,
        state: 'awaiting_visibility',
      })
      twimlReply(
        res,
        `🌐 *Should this story be public?*\n` +
          `Reply *yes* to share with everyone, or *no* to keep it private.\n` +
          `(Default: yes)`,
      )
      break
    }

    // ── Visibility → publish ───────────────────────────────────────────────
    case 'awaiting_visibility': {
      const lc = body.toLowerCase()
      const isPublic = lc !== 'no' && lc !== 'n' && lc !== 'private'

      await updateSession(phoneNumber, { isPublic })

      // Re-read the freshest session state for publishing
      const freshSession: WhatsAppSession = {
        ...session,
        isPublic,
      }

      try {
        const storyId = await publishStory(freshSession)
        await deleteSession(phoneNumber)

        const storyUrl = `${config.app.webUrl}/story/${storyId}`
        const visibilityLabel = isPublic ? 'public' : 'private'

        twimlReply(
          res,
          `🎉 Your story is live!\n\n` +
            `View it here:\n${storyUrl}\n\n` +
            `Visibility: ${visibilityLabel}\n\n` +
            `Send "START STORY" any time to create another.`,
        )
      } catch (err) {
        console.error('[handleMetadata] publishStory failed:', err)
        twimlReply(
          res,
          '❌ Something went wrong while publishing your story. ' +
            'Please try again by replying to the visibility question.',
        )
      }
      break
    }

    default: {
      twimlReply(res, 'Unexpected state. Send "START STORY" to begin a new story.')
    }
  }
}
