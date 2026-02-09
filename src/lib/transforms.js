// --- Data Transformation Helpers per Technical Specification ---

import { RISK_COLORS } from './constants';

/**
 * Format temperature with unit
 * @param {number|null} temp
 * @param {'C' | 'F'} unit
 * @returns {string}
 */
export function formatTemperature(temp, unit = 'C') {
    if (temp === null || temp === undefined) return '--';
    return `${temp.toFixed(1)}°${unit}`;
}

/**
 * Format timestamp to time string (SG locale)
 * @param {string} ts - ISO timestamp
 * @returns {string}
 */
export function formatTimestamp(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('en-SG', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

/**
 * Format timestamp to date string
 * @param {string} ts - ISO timestamp
 * @returns {string}
 */
export function formatDate(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString('en-SG', {
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Calculate temperature trend
 * @param {number} current
 * @param {number} previous
 * @returns {'up' | 'down' | 'stable'}
 */
export function calculateTrend(current, previous) {
    if (previous === undefined || previous === null) return 'stable';
    const diff = current - previous;
    if (Math.abs(diff) < 0.1) return 'stable';
    return diff > 0 ? 'up' : 'down';
}

/**
 * Get risk color based on risk score
 * @param {string} risk
 * @returns {string}
 */
export function getRiskColor(risk) {
    return RISK_COLORS[risk] || RISK_COLORS.UNKNOWN;
}

/**
 * Transform history data to chart format
 * @param {import('../types/fleet').TelemetryPoint[]} history
 * @param {number} threshold
 * @returns {Array<{time: string, temperature: number, speed: number, threshold: number|null}>}
 */
export function toChartData(history, threshold) {
    if (!history || history.length === 0) return [];
    // DEBUG: Log raw history before transformation to diagnose timestamp issues
    console.log('[DEBUG] toChartData - raw history first/last points:', {
        totalPoints: history.length,
        firstPoint: { timestamp: history[0]?.timestamp, temp: history[0]?.temperature },
        secondPoint: { timestamp: history[1]?.timestamp, temp: history[1]?.temperature },
        lastPoint: { timestamp: history[history.length - 1]?.timestamp, temp: history[history.length - 1]?.temperature }
    });
    const result = history.map(point => ({
        time: formatTimestamp(point.timestamp),
        temperature: point.temperature,
        humidity: point.humidity,
        speed: point.gps?.speed,
        threshold: threshold
    }));
    // DEBUG: Log transformed chart data
    console.log('[DEBUG] toChartData - transformed chart data first/last:', {
        totalPoints: result.length,
        firstPoint: result[0],
        secondPoint: result[1],
        lastPoint: result[result.length - 1]
    });
    return result;
}

/**
 * Transform fleet data to location data format
 * @param {import('../types/fleet').Device[]} devices
 * @returns {Array<{device_id: string, lat: number, lng: number, status: string}>}
 */
export function toLocationData(devices) {
    if (!devices) return [];
    return devices
        .filter(d => d.current_location)
        .map(d => ({
            device_id: d.device_id,
            lat: d.current_location.lat,
            lng: d.current_location.lng,
            status: d.status,
            cargo_type: d.cargo_type
        }));
}

/**
 * Check if device is considered "live" (within 5 minutes)
 * @param {string} lastUpdated
 * @returns {boolean}
 */
export function isLive(lastUpdated) {
    if (!lastUpdated) return false;
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() - new Date(lastUpdated).getTime() < fiveMinutes;
}

/**
 * Get temperature status based on thresholds
 * @param {number|null} temp
 * @param {number} maxThreshold
 * @param {number} [warningOffset] - degrees before threshold to show warning
 * @returns {'OK' | 'WARNING' | 'CRITICAL' | 'OFFLINE'}
 */
export function getTempStatus(temp, maxThreshold, warningOffset = 2) {
    if (temp === null || temp === undefined) return 'OFFLINE';
    if (temp > maxThreshold) return 'CRITICAL';
    if (temp > maxThreshold - warningOffset) return 'WARNING';
    return 'OK';
}

/**
 * Sort devices by alert priority (critical first, then warning, then OK)
 * @param {import('../types/fleet').Device[]} devices
 * @returns {import('../types/fleet').Device[]}
 */
export function sortByPriority(devices) {
    const priority = { CRITICAL: 0, WARNING: 1, OFFLINE: 2, OK: 3 };
    return [...devices].sort((a, b) => {
        const statusA = getTempStatus(
            a.current_location?.temperature,
            a.alert_threshold
        );
        const statusB = getTempStatus(
            b.current_location?.temperature,
            b.alert_threshold
        );
        return priority[statusA] - priority[statusB];
    });
}
