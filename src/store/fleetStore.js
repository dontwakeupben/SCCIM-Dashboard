import { create } from 'zustand';
import {
    fetchFleet,
    fetchTelemetry,
    getFleetLocations,
    getLocationHistory,
    getFleetAnalytics,
    getCargoComparison,
    registerDevice,
    searchAlerts
} from '../services/api';
import { REFRESH_RATES } from '../lib/constants';

export const useFleetStore = create((set, get) => ({
    // State
    devices: [],
    selectedDeviceId: null,
    telemetryCache: new Map(),
    alertsCache: new Map(),
    fleetLocations: [],
    analytics: {
        fleetOverview: null,
        timeSeries: null
    },
    timeRange: '24h',
    selectedCargoTypes: [],
    mapViewport: {
        center: [1.3521, 103.8198],
        zoom: 12
    },
    isLoadingDevices: false,
    isLoadingTelemetry: false,
    isLoadingLocations: false,
    isLoadingAnalytics: false,
    isLoadingAlerts: false,
    error: null,
    intervals: {
        fleet: null,
        telemetry: null,
        locations: null,
        analytics: null
    },

    // Actions
    fetchDevices: async () => {
        set({ isLoadingDevices: true, error: null });
        try {
            const data = await fetchFleet();
            set({ devices: data.devices || [], isLoadingDevices: false });
        } catch (error) {
            set({ error: error.message, isLoadingDevices: false });
        }
    },

    fetchTelemetry: async (deviceId, range) => {
        const useRange = range || get().timeRange;
        set({ isLoadingTelemetry: true, error: null });
        try {
            const data = await fetchTelemetry(deviceId, useRange);
            // DEBUG: Log raw payload for 24h range to diagnose timestamp ordering issues
            if (useRange === '24h' && data?.history) {
                console.log('[DEBUG] fetchTelemetry payload for 24h range:', {
                    deviceId,
                    historyLength: data.history.length,
                    firstFewPoints: data.history.slice(0, 5).map(p => ({
                        timestamp: p.timestamp,
                        temperature: p.temperature
                    })),
                    lastFewPoints: data.history.slice(-5).map(p => ({
                        timestamp: p.timestamp,
                        temperature: p.temperature
                    }))
                });
            }
            const cache = get().telemetryCache;
            cache.set(deviceId, data);
            set({ telemetryCache: new Map(cache), isLoadingTelemetry: false });
        } catch (error) {
            set({ error: error.message, isLoadingTelemetry: false });
            if (error.message === 'Device not registered') {
                window.location.href = '/';
            }
        }
    },

    fetchSearchAlerts: async (deviceId, hours) => {
        const useHours = hours || (get().timeRange === '7d' ? 168 : 24);
        set({ isLoadingAlerts: true, error: null });
        try {
            const data = await searchAlerts(deviceId, useHours);
            const cache = get().alertsCache;
            cache.set(deviceId, data);
            set({ alertsCache: new Map(cache), isLoadingAlerts: false });
        } catch (error) {
            set({ error: error.message, isLoadingAlerts: false });
        }
    },

    fetchFleetLocations: async () => {
        set({ isLoadingLocations: true, error: null });
        try {
            const data = await getFleetLocations();
            const locations = data.trucks || [];
            const { devices } = get();
            const updatedDevices = devices.map(device => {
                const locationData = locations.find(l => l.device_id === device.device_id);
                if (locationData) {
                    return {
                        ...device,
                        current_location: {
                            lat: locationData.location?.lat,
                            lng: locationData.location?.lng,
                            speed: locationData.current_status?.speed_kmh,
                            temperature: locationData.current_status?.temperature,
                            last_updated: locationData.last_updated
                        }
                    };
                }
                return device;
            });
            set({ fleetLocations: locations, devices: updatedDevices, isLoadingLocations: false });
        } catch (error) {
            set({ error: error.message, isLoadingLocations: false });
        }
    },

    fetchLocationHistory: async (deviceId, hours = 24) => {
        try {
            const data = await getLocationHistory(deviceId, hours);
            return data.route;
        } catch (error) {
            set({ error: error.message });
            return [];
        }
    },

    fetchAnalytics: async () => {
        set({ isLoadingAnalytics: true, error: null });
        try {
            const [overviewData, comparisonData] = await Promise.all([
                getFleetAnalytics(),
                getCargoComparison()
            ]);
            set({
                analytics: {
                    fleetOverview: overviewData.cargo_breakdown,
                    timeSeries: comparisonData.chart_data
                },
                isLoadingAnalytics: false
            });
        } catch (error) {
            set({ error: error.message, isLoadingAnalytics: false });
        }
    },

    registerDevice: async (deviceData) => {
        set({ error: null });
        try {
            const result = await registerDevice(deviceData);
            await get().fetchDevices();
            return result;
        } catch (error) {
            set({ error: error.message });
            throw error;
        }
    },

    setSelectedDevice: (deviceId) => {
        set({ selectedDeviceId: deviceId });
    },

    setTimeRange: (range) => {
        set({ timeRange: range });
        const { selectedDeviceId } = get();
        if (selectedDeviceId) {
            get().fetchTelemetry(selectedDeviceId, range);
        }
    },

    toggleCargoFilter: (cargoType) => {
        const { selectedCargoTypes } = get();
        const newFilters = selectedCargoTypes.includes(cargoType)
            ? selectedCargoTypes.filter(t => t !== cargoType)
            : [...selectedCargoTypes, cargoType];
        set({ selectedCargoTypes: newFilters });
    },

    setMapViewport: (viewport) => {
        set({ mapViewport: viewport });
    },

    clearError: () => {
        set({ error: null });
    },

    refreshAll: async () => {
        await get().fetchDevices();
        await Promise.all([
            get().fetchFleetLocations(),
            get().fetchAnalytics()
        ]);
        const { selectedDeviceId } = get();
        if (selectedDeviceId) {
            await get().fetchTelemetry(selectedDeviceId);
        }
    },

    // Auto-refresh Management
    startAutoRefresh: () => {
        const { fetchDevices, fetchFleetLocations, fetchAnalytics, selectedDeviceId } = get();
        get().stopAutoRefresh();
        const intervals = {
            fleet: setInterval(() => fetchDevices(), REFRESH_RATES.fleet),
            locations: setInterval(() => fetchFleetLocations(), REFRESH_RATES.locations),
            analytics: setInterval(() => fetchAnalytics(), REFRESH_RATES.analytics)
        };
        if (selectedDeviceId) {
            intervals.telemetry = setInterval(
                () => get().fetchTelemetry(selectedDeviceId),
                REFRESH_RATES.telemetry
            );
        }
        set({ intervals });
    },

    stopAutoRefresh: () => {
        const { intervals } = get();
        Object.values(intervals).forEach(interval => {
            if (interval) clearInterval(interval);
        });
        set({
            intervals: { fleet: null, telemetry: null, locations: null, analytics: null }
        });
    },

    clearTelemetryCache: () => {
        console.log('[DEBUG] Clearing telemetry cache');
        set({
            telemetryCache: new Map(),
            alertsCache: new Map()
        });
    },

    restartTelemetryRefresh: () => {
        const { intervals, selectedDeviceId } = get();
        if (intervals.telemetry) {
            clearInterval(intervals.telemetry);
        }
        if (selectedDeviceId) {
            const newInterval = setInterval(
                () => get().fetchTelemetry(selectedDeviceId),
                REFRESH_RATES.telemetry
            );
            set({ intervals: { ...intervals, telemetry: newInterval } });
        }
    },

    // Selectors
    getSelectedDevice: () => {
        const { devices, selectedDeviceId } = get();
        return devices.find(d => d.device_id === selectedDeviceId) || null;
    },

    getSelectedTelemetry: () => {
        const { telemetryCache, selectedDeviceId } = get();
        return selectedDeviceId ? telemetryCache.get(selectedDeviceId) || null : null;
    },

    getFilteredDevices: () => {
        const { devices, selectedCargoTypes } = get();
        if (selectedCargoTypes.length === 0) return devices;
        return devices.filter(d => selectedCargoTypes.includes(d.cargo_type));
    },

    getActiveCount: () => {
        return get().devices.filter(d => d.status === 'ACTIVE').length;
    },

    getAlertCount: () => {
        return get().devices.filter(d =>
            (d.alerts && d.alerts > 0) ||
            (d.current_location?.temperature > d.alert_threshold)
        ).length;
    }
}));
