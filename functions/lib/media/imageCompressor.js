"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressImage = compressImage;
exports.maybeCompressImage = maybeCompressImage;
const sharp_1 = __importDefault(require("sharp"));
const config_1 = require("../config");
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
async function compressImage(buffer) {
    return (0, sharp_1.default)(buffer)
        .rotate() // auto-rotate based on EXIF orientation
        .resize({
        width: 1920,
        height: 1920,
        fit: 'inside',
        withoutEnlargement: true,
    })
        .jpeg({ quality: 80, progressive: true })
        .toBuffer();
}
/**
 * Returns the compressed buffer if the input exceeds the configured size
 * limit, otherwise returns the original buffer unchanged.
 */
async function maybeCompressImage(buffer) {
    if (buffer.length > config_1.config.limits.maxImageBytes) {
        const compressed = await compressImage(buffer);
        console.info(`[imageCompressor] Compressed image: ${(buffer.length / 1024).toFixed(1)} KB → ` +
            `${(compressed.length / 1024).toFixed(1)} KB`);
        return compressed;
    }
    return buffer;
}
