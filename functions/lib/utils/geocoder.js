"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.geocodeAddress = geocodeAddress;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
/**
 * Geocodes a free-text location query using the Google Maps Geocoding API.
 *
 * Returns the top result, or null if:
 *   - GOOGLE_MAPS_API_KEY is not configured
 *   - Google returns no results for the query
 *   - The API call fails
 */
async function geocodeAddress(query) {
    if (!config_1.config.google.mapsApiKey) {
        return null;
    }
    try {
        const response = await axios_1.default.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: { address: query, key: config_1.config.google.mapsApiKey },
            timeout: 5000,
        });
        const { status, results } = response.data;
        if (status !== 'OK' || !results.length) {
            return null;
        }
        const top = results[0];
        return {
            formattedAddress: top.formatted_address,
            lat: top.geometry.location.lat,
            lng: top.geometry.location.lng,
        };
    }
    catch (err) {
        console.warn('[geocoder] Geocoding failed for query:', query, err);
        return null;
    }
}
