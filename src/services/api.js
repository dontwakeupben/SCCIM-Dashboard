import { API_BASE_URL } from '../lib/constants';

/**
 * Fetch all devices (fleet overview)
 * GET /devices
 */
export async function fetchFleet() {
    const url = `${API_BASE_URL}/devices`;
    try {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) {
            if (response.status === 500) throw new Error('Server error, retrying...');
            if (response.status === 404) throw new Error('Fleet data not found');
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Fleet Fetch Error:', error);
        throw error;
    }
}

/**
 * Fetch telemetry for a specific device
 * GET /telemetry/{deviceId}?range={range}
 */
export async function fetchTelemetry(deviceId, range = '24h') {
    const url = `${API_BASE_URL}/telemetry/${deviceId}?range=${range}`;
    try {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) {
            if (response.status === 404) throw new Error('Device not registered');
            if (response.status === 500) throw new Error('Server error, retrying...');
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Telemetry Fetch Error:', error);
        throw error;
    }
}

/**
 * Register a new device (truck)
 * POST /devices
 */
export async function registerDevice(deviceData) {
    const url = `${API_BASE_URL}/devices`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            mode: 'cors',
            body: JSON.stringify(deviceData),
        });
        const data = await response.json();
        if (!response.ok) {
            if (response.status === 409) throw new Error('Device ID already exists');
            if (response.status === 400) throw new Error(data.message || data.error || 'Invalid device data');
            throw new Error(data.message || `API error: ${response.status} ${response.statusText}`);
        }
        return data;
    } catch (error) {
        console.error('Register Device Error:', error);
        throw error;
    }
}

/**
 * Get all device locations for mapping
 * GET /locations/fleet
 */
export async function getFleetLocations() {
    const url = `${API_BASE_URL}/locations/fleet`;
    try {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) {
            if (response.status === 500) throw new Error('Server error, retrying...');
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Fleet Locations Error:', error);
        throw error;
    }
}

/**
 * Get GPS route history for a device
 * GET /locations/{deviceId}/history
 */
export async function getLocationHistory(deviceId, hours = 24) {
    const url = `${API_BASE_URL}/locations/${deviceId}/history?hours=${hours}`;
    try {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) {
            if (response.status === 404) throw new Error('Device not registered');
            if (response.status === 500) throw new Error('Server error, retrying...');
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Location History Error:', error);
        throw error;
    }
}

/**
 * Get fleet-wide analytics aggregations
 * GET /analytics/fleet-overview
 */
export async function getFleetAnalytics() {
    const url = `${API_BASE_URL}/analytics/fleet-overview`;
    try {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) {
            if (response.status === 503) throw new Error('Analytics offline (using cached data)');
            if (response.status === 500) throw new Error('Server error, retrying...');
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Fleet Analytics Error:', error);
        throw error;
    }
}

/**
 * Get time-series cargo comparison data
 * GET /analytics/cargo-comparison
 */
export async function getCargoComparison() {
    const url = `${API_BASE_URL}/analytics/cargo-comparison`;
    try {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) {
            if (response.status === 503) throw new Error('Analytics offline (using cached data)');
            if (response.status === 500) throw new Error('Server error, retrying...');
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Cargo Comparison Error:', error);
        throw error;
    }
}

/**
 * Search alert history from DynamoDB
 * GET /search/alerts
 */
export async function searchAlerts(deviceId, hours = 24, cargo_type = null, limit = 50) {
    const params = new URLSearchParams();
    params.append('deviceId', deviceId);
    params.append('hours', hours.toString());
    if (cargo_type) params.append('cargo_type', cargo_type);
    if (limit) params.append('limit', limit.toString());

    const url = `${API_BASE_URL}/search/alerts?${params.toString()}`;
    try {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) {
            if (response.status === 404) throw new Error('Device not found');
            if (response.status === 500) throw new Error('Server error, retrying...');
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Search Alerts Error:', error);
        throw error;
    }
}

/**
 * FleetAPI Class for alternative usage pattern
 */
export class FleetAPI {
    async getDevices() {
        const data = await fetchFleet();
        return data.devices;
    }

    async getTelemetry(deviceId, range = '24h') {
        return fetchTelemetry(deviceId, range);
    }

    async getFleetLocations() {
        const data = await getFleetLocations();
        return data.trucks;
    }

    async getLocationHistory(deviceId, hours = 24) {
        const data = await getLocationHistory(deviceId, hours);
        return data.route;
    }

    async registerDevice(deviceData) {
        return registerDevice(deviceData);
    }

    async getFleetAnalytics() {
        const data = await getFleetAnalytics();
        return data.cargo_breakdown;
    }

    async getCargoComparison() {
        const data = await getCargoComparison();
        return data.chart_data;
    }

    async searchAlerts(deviceId, hours = 24, cargo_type = null, limit = 50) {
        return searchAlerts(deviceId, hours, cargo_type, limit);
    }
}

export const fleetAPI = new FleetAPI();
