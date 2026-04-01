"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookApp = void 0;
const express_1 = __importDefault(require("express"));
const messageRouter_1 = require("./messageRouter");
/**
 * Express app mounted as a Firebase Cloud Function.
 *
 * Twilio must be configured to POST inbound WhatsApp messages to:
 *   https://<region>-<project>.cloudfunctions.net/whatsappWebhook
 */
exports.webhookApp = (0, express_1.default)();
// Twilio sends application/x-www-form-urlencoded
exports.webhookApp.use(express_1.default.urlencoded({ extended: false }));
exports.webhookApp.post('/', async (req, res) => {
    await (0, messageRouter_1.routeMessage)(req, res);
});
// Health check — useful during setup
exports.webhookApp.get('/', (_req, res) => {
    res.status(200).send('Voices WhatsApp webhook is running.');
});
