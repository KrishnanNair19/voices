import sharp from 'sharp'
import { config } from '../config'

/**
 * Compresses an image buffer using sharp.
 *
 * Strategy:
 * - Downscale to a maximum of 1920×1920 (preserving aspect ratio).
 * - Re-encode as JPEG at 80% quality.
 *
 * Called automatically by processAndUploadMedia when the image exceeds
 * config.limits.maxImageBytes.
 *
 * @param buffer  Raw image bytes (any format sharp supports: jpeg, png, webp, etc.)
 * @returns       Compressed JPEG buffer
 */
export async function compressImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate() // auto-rotate based on EXIF orientation
    .resize({
      width: 1920,
      height: 1920,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 80, progressive: true })
    .toBuffer()
}

/**
 * Returns the compressed buffer if the input exceeds the configured size
 * limit, otherwise returns the original buffer unchanged.
 */
export async function maybeCompressImage(buffer: Buffer): Promise<Buffer> {
  if (buffer.length > config.limits.maxImageBytes) {
    const compressed = await compressImage(buffer)
    console.info(
      `[imageCompressor] Compressed image: ${(buffer.length / 1024).toFixed(1)} KB → ` +
        `${(compressed.length / 1024).toFixed(1)} KB`,
    )
    return compressed
  }
  return buffer
}
