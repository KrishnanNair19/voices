import type { Response } from 'express'
import { twimlReply } from '../webhook/twilioHelper'
import { updateSession, appendMediaUrl, appendText } from '../webhook/sessionManager'
import { processAndUploadMedia } from '../media/mediaProcessor'
import type { WhatsAppSession, TwilioInboundMessage } from '../types'

/** MIME type prefixes considered "audio" (WhatsApp voice notes and audio files). */
const AUDIO_MIME_PREFIXES = ['audio/']

/** MIME type prefixes considered "video". */
const VIDEO_MIME_PREFIXES = ['video/']

/** MIME type prefixes considered "image". */
const IMAGE_MIME_PREFIXES = ['image/']

function isAudio(ct: string) {
  return AUDIO_MIME_PREFIXES.some((p) => ct.startsWith(p))
}
function isVideo(ct: string) {
  return VIDEO_MIME_PREFIXES.some((p) => ct.startsWith(p))
}
function isImage(ct: string) {
  return IMAGE_MIME_PREFIXES.some((p) => ct.startsWith(p))
}

/**
 * Handles incoming media (images, video, voice messages) while in the
 * 'collecting' state.
 *
 * Logic gate (audio):
 *   - If the session already has text and the user sends audio → reject.
 *   - If the session already has audio and the user sends text (via caption) → reject caption.
 *   - Images/video are always accepted alongside either content type.
 */
export async function handleMedia(
  phoneNumber: string,
  session: WhatsAppSession,
  msg: TwilioInboundMessage,
  res: Response,
): Promise<void> {
  const replies: string[] = []

  for (let i = 0; i < msg.NumMedia; i++) {
    const url = msg.mediaUrls[i]
    const contentType = msg.mediaContentTypes[i]
    if (!url || !contentType) continue

    if (isAudio(contentType)) {
      // Logic gate: can't add audio if text already exists
      if (session.contentType === 'text') {
        twimlReply(
          res,
          '⛔ This story already contains text. ' +
            'You can\'t add a voice message to a text story.\n\n' +
            'Send FINISH to publish your text story, or send "START STORY" to begin a new one.',
        )
        return
      }

      if (session.audioUrl) {
        twimlReply(
          res,
          '⛔ A voice message is already attached to this story. ' +
            'Only one audio clip is supported per story.\n\n' +
            'Send FINISH to publish, or "START STORY" to begin a new one.',
        )
        return
      }

      const storedUrl = await processAndUploadMedia(url, contentType, phoneNumber, 'audio')
      await updateSession(phoneNumber, {
        audioUrl: storedUrl,
        contentType: 'audio',
      })
      replies.push('🎤 Voice message received!')
    } else if (isImage(contentType)) {
      const storedUrl = await processAndUploadMedia(url, contentType, phoneNumber, 'image')
      await appendMediaUrl(phoneNumber, storedUrl)
      replies.push('🖼 Image received!')
    } else if (isVideo(contentType)) {
      if (session.videoUrl) {
        replies.push('ℹ️ Only one video is supported per story — extra video skipped.')
        continue
      }
      const storedUrl = await processAndUploadMedia(url, contentType, phoneNumber, 'video')
      await updateSession(phoneNumber, { videoUrl: storedUrl })
      replies.push('🎬 Video received!')
    } else {
      replies.push(`ℹ️ Unsupported file type (${contentType}) — skipped.`)
    }
  }

  // Handle a text caption sent alongside media (only if content type allows it).
  // We check the *original* session.contentType — if audio was set during
  // this request, audioUrl is null in session but we handled it above.
  if (msg.Body && session.contentType !== 'audio') {
    await appendText(phoneNumber, msg.Body)
    replies.push('📝 Caption added.')
  }

  const summary = replies.length > 0 ? replies.join('\n') : '✅ Media received!'
  twimlReply(res, `${summary}\n\nKeep sending content or send FINISH when done.`)
}
