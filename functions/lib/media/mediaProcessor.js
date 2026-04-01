"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processAndUploadMedia = processAndUploadMedia;
const axios_1 = __importDefault(require("axios"));
const storage_1 = require("firebase-admin/storage");
const config_1 = require("../config");
const imageCompressor_1 = require("./imageCompressor");
// ── Download ─────────────────────────────────────────────────────────────────
/**
 * Downloads media from a Twilio URL.
 * Twilio protects media with HTTP Basic auth (SID + token).
 */
async function downloadMedia(url) {
    const response = await axios_1.default.get(url, {
        responseType: 'arraybuffer',
        auth: {
            username: config_1.config.twilio.accountSid,
            password: config_1.config.twilio.authToken,
        },
        timeout: 30000,
    });
    const contentType = response.headers['content-type'] ?? 'application/octet-stream';
    return { buffer: Buffer.from(response.data), contentType };
}
// ── Upload ───────────────────────────────────────────────────────────────────
/**
 * Uploads a buffer to Firebase Storage and returns a permanent public URL.
 *
 * Path structure:
 *   whatsapp/{phoneNumber}/{kind}/{timestamp}_{random}.{ext}
 */
async function uploadToStorage(buffer, storagePath, contentType) {
    const bucket = (0, storage_1.getStorage)().bucket(config_1.config.firebase.storageBucket);
    const file = bucket.file(storagePath);
    await file.save(buffer, {
        contentType,
        resumable: false,
        public: true,
        metadata: {
            cacheControl: 'public, max-age=31536000',
        },
    });
    // Returns https://storage.googleapis.com/{bucket}/{path}
    return file.publicUrl();
}
// ── Extension helpers ─────────────────────────────────────────────────────────
const EXT_MAP = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'audio/ogg': 'ogg',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/aac': 'aac',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/webm': 'webm',
};
function extForMime(mimeType) {
    return EXT_MAP[mimeType] ?? 'bin';
}
// ── Orchestrator ──────────────────────────────────────────────────────────────
/**
 * Full pipeline: download from Twilio → compress if needed → upload to Storage.
 *
 * @param twilioUrl   The MediaUrl* value from Twilio's POST body
 * @param mimeType    The MediaContentType* value
 * @param phoneNumber Used to namespace the Storage path
 * @param kind        'image' | 'audio' | 'video'
 * @returns           Public Firebase Storage URL
 */
async function processAndUploadMedia(twilioUrl, mimeType, phoneNumber, kind) {
    const { buffer: rawBuffer, contentType: detectedType } = await downloadMedia(twilioUrl);
    const finalMime = mimeType || detectedType;
    let finalBuffer = rawBuffer;
    // Compress oversized images
    if (kind === 'image') {
        finalBuffer = await (0, imageCompressor_1.maybeCompressImage)(rawBuffer);
    }
    const ext = extForMime(finalMime);
    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);
    // Strip "+" from phone for a valid path segment
    const safePhone = phoneNumber.replace(/\+/g, '');
    const storagePath = `whatsapp/${safePhone}/${kind}/${ts}_${rand}.${ext}`;
    const publicUrl = await uploadToStorage(finalBuffer, storagePath, finalMime);
    console.info(`[mediaProcessor] Uploaded ${kind} → ${storagePath}`);
    return publicUrl;
}
