// --- Route History Component with GPS Polyline ---

import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, CircleMarker } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useFleetStore } from '../../store/fleetStore';
import { CARGO_CONFIG } from '../../lib/constants';
import { Clock, Thermometer, Navigation, Gauge, TrendingUp } from 'lucide-react';

/**
 * Create start/end marker icon
 */
const createEndpointIcon = (isStart) => {
    return divIcon({
        className: 'endpoint-marker',
        html: `
            <div style="
                width: 20px;
                height: 20px;
                background-color: ${isStart ? '#22c55e' : '#ef4444'};
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            "></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
};

/**
 * Route History Component
 * @param {Object} props
 * @param {string} props.deviceId
 * @param {number} [props.hours] - Hours of history to show (default 24)
 * @param {string} [props.height] - Map height (default 300px)
 * @param {Array} [props.telemetryHistory] - Fallback telemetry history with gps data
 */
const RouteHistory = ({ deviceId, hours = 24, height = '300px', telemetryHistory = [] }) => {
    const { fetchLocationHistory } = useFleetStore();
    const [route, setRoute] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Transform telemetry history to route format
    const transformTelemetryToRoute = (history) => {
        if (!Array.isArray(history) || history.length === 0) return [];

        return history
            .filter(point => point?.gps?.lat != null && point?.gps?.lng != null)
            .map(point => ({
                gps_lat: point.gps.lat,
                gps_lng: point.gps.lng,
                timestamp: point.timestamp,
                speed: point.gps.speed || 0,
                temperature: point.temperature || null,
                door_open: point.door_open || false
            }));
    };

    // Fetch route history
    useEffect(() => {
        const loadRoute = async () => {
            if (!deviceId) {
                console.log('[DEBUG RouteHistory] No deviceId provided');
                return;
            }

            console.log('[DEBUG RouteHistory] Loading route for device:', deviceId, 'hours:', hours);
            console.log('[DEBUG RouteHistory] telemetryHistory available:', telemetryHistory?.length || 0);
            setIsLoading(true);
            setError(null);

            try {
                const routeData = await fetchLocationHistory(deviceId, hours);
                console.log('[DEBUG RouteHistory] Received routeData:', routeData);
                console.log('[DEBUG RouteHistory] routeData length:', routeData?.length || 0);

                // Use location API data if available, otherwise fall back to telemetry history
                if (Array.isArray(routeData) && routeData.length > 0) {
                    console.log('[DEBUG RouteHistory] Using location API data');
                    setRoute(routeData);
                } else if (telemetryHistory?.length > 0) {
                    console.log('[DEBUG RouteHistory] Location API empty, using telemetry history fallback');
                    const fallbackRoute = transformTelemetryToRoute(telemetryHistory);
                    console.log('[DEBUG RouteHistory] Transformed telemetry to route points:', fallbackRoute.length);
                    setRoute(fallbackRoute);
                } else {
                    console.log('[DEBUG RouteHistory] No route data available from any source');
                    setRoute([]);
                }
            } catch (err) {
                console.error('[DEBUG RouteHistory] Error loading route:', err);
                // On error, try telemetry fallback
                if (telemetryHistory?.length > 0) {
                    console.log('[DEBUG RouteHistory] Error, using telemetry history fallback');
                    const fallbackRoute = transformTelemetryToRoute(telemetryHistory);
                    setRoute(fallbackRoute);
                } else {
                    setError(err.message);
                    setRoute([]);
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadRoute();
    }, [deviceId, hours, fetchLocationHistory, telemetryHistory]);

    // Filter out invalid route points
    const validRoute = useMemo(() => {
        console.log('[DEBUG RouteHistory] Processing route data:', route);
        console.log('[DEBUG RouteHistory] route length:', route?.length || 0);
        if (route?.length > 0) {
            console.log('[DEBUG RouteHistory] First raw point:', route[0]);
            console.log('[DEBUG RouteHistory] First point gps_lat:', route[0].gps_lat);
            console.log('[DEBUG RouteHistory] First point gps_lng:', route[0].gps_lng);
            console.log('[DEBUG RouteHistory] typeof gps_lat:', typeof route[0].gps_lat);
            console.log('[DEBUG RouteHistory] typeof gps_lng:', typeof route[0].gps_lng);
        }
        const filtered = route.filter(p =>
            p && typeof p.gps_lat === 'number' && typeof p.gps_lng === 'number' &&
            !isNaN(p.gps_lat) && !isNaN(p.gps_lng)
        );
        console.log('[DEBUG RouteHistory] After filtering valid points:', filtered.length);
        return filtered;
    }, [route]);

    // Calculate map center from route
    const mapCenter = useMemo(() => {
        if (validRoute.length === 0) return [1.3521, 103.8198]; // Default to Singapore

        const lats = validRoute.map(p => p.gps_lat);
        const lngs = validRoute.map(p => p.gps_lng);
        return [
            (Math.min(...lats) + Math.max(...lats)) / 2,
            (Math.min(...lngs) + Math.max(...lngs)) / 2
        ];
    }, [validRoute]);

    // Convert route to polyline positions
    const polylinePositions = useMemo(() => {
        return validRoute.map(point => [point.gps_lat, point.gps_lng]);
    }, [validRoute]);

    // Calculate statistics
    const stats = useMemo(() => {
        if (validRoute.length === 0) return null;

        // Debug: log available fields in first point
        if (validRoute.length > 0) {
            console.log('[DEBUG RouteHistory] First point fields:', Object.keys(validRoute[0]));
            console.log('[DEBUG RouteHistory] First point data:', validRoute[0]);
        }

        // Try multiple possible speed field names
        const speeds = validRoute.map(p => {
            const speed = p.speed ?? p.gps_speed ?? p.speed_kmh ?? p.gps?.speed ?? 0;
            return speed;
        }).filter(s => s > 0);

        const temps = validRoute.map(p => p.temperature).filter(t => t !== null && t !== undefined);

        console.log('[DEBUG RouteHistory] Speeds found:', speeds.length, 'values:', speeds.slice(0, 5));

        return {
            totalPoints: validRoute.length,
            avgSpeed: speeds.length > 0 ? (speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(1) : 0,
            maxSpeed: speeds.length > 0 ? Math.max(...speeds).toFixed(1) : 0,
            avgTemp: temps.length > 0 ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : '--',
            distanceKm: calculateDistance(validRoute)
        };
    }, [validRoute]);

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800">Route History (Last {hours}h)</h3>
                </div>
                <div
                    className="bg-slate-100 flex items-center justify-center"
                    style={{ height }}
                >
                    <div className="text-slate-400">Loading route...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800">Route History (Last {hours}h)</h3>
                </div>
                <div
                    className="bg-red-50 flex items-center justify-center p-4"
                    style={{ height }}
                >
                    <div className="text-red-600 text-center">
                        <p className="font-medium">Error loading route</p>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (validRoute.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800">Route History (Last {hours}h)</h3>
                </div>
                <div
                    className="bg-slate-100 flex items-center justify-center"
                    style={{ height }}
                >
                    <div className="text-slate-400">No route data available</div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-semibold text-slate-800">Route History (Last {hours}h)</h3>
                {stats && (
                    <div className="flex items-center gap-4 text-sm flex-wrap">
                        <span className="text-slate-500">
                            <Navigation className="w-4 h-4 inline mr-1" />
                            {stats.distanceKm} km
                        </span>
                        <span className="text-slate-500">
                            <Gauge className="w-4 h-4 inline mr-1" />
                            Avg: {stats.avgSpeed} km/h
                        </span>
                        <span className="text-slate-500">
                            <TrendingUp className="w-4 h-4 inline mr-1" />
                            Max: {stats.maxSpeed} km/h
                        </span>
                        <span className="text-slate-500">
                            {stats.totalPoints} points
                        </span>
                    </div>
                )}
            </div>

            <div style={{ height }}>
                <MapContainer
                    center={mapCenter}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Route polyline */}
                    <Polyline
                        positions={polylinePositions}
                        color="#3B82F6"
                        weight={4}
                        opacity={0.8}
                    />

                    {/* Start marker */}
                    {validRoute.length > 0 && (
                        <Marker
                            position={[validRoute[0].gps_lat, validRoute[0].gps_lng]}
                            icon={createEndpointIcon(true)}
                        >
                            <Popup>
                                <div className="text-sm">
                                    <p className="font-bold text-green-600">Start Point</p>
                                    <p className="text-slate-500">
                                        {new Date(validRoute[0].timestamp).toLocaleString('en-SG')}
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {/* End marker */}
                    {validRoute.length > 0 && (
                        <Marker
                            position={[validRoute[validRoute.length - 1].gps_lat, validRoute[validRoute.length - 1].gps_lng]}
                            icon={createEndpointIcon(false)}
                        >
                            <Popup>
                                <div className="text-sm">
                                    <p className="font-bold text-red-600">Current Position</p>
                                    <p className="text-slate-500">
                                        {new Date(validRoute[validRoute.length - 1].timestamp).toLocaleString('en-SG')}
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {/* Temperature indicators along route */}
                    {validRoute.length > 0 && validRoute.filter((_, i) => i % Math.ceil(validRoute.length / 10) === 0).map((point, idx) => (
                        <CircleMarker
                            key={idx}
                            center={[point.gps_lat, point.gps_lng]}
                            radius={6}
                            fillColor={getTempColor(point.temperature)}
                            color="white"
                            weight={2}
                            fillOpacity={0.8}
                        >
                            <Popup>
                                <div className="text-sm space-y-1">
                                    <p className="font-medium">
                                        <Clock className="w-4 h-4 inline mr-1" />
                                        {new Date(point.timestamp).toLocaleTimeString('en-SG')}
                                    </p>
                                    <p>
                                        <Thermometer className="w-4 h-4 inline mr-1" />
                                        {point.temperature?.toFixed(1) ?? '--'}°C
                                    </p>
                                    <p>
                                        <Navigation className="w-4 h-4 inline mr-1" />
                                        {point.speed} km/h
                                    </p>
                                    {point.door_open && (
                                        <p className="text-red-600 font-bold">⚠️ Door Open</p>
                                    )}
                                </div>
                            </Popup>
                        </CircleMarker>
                    ))}
                </MapContainer>
            </div>

            {/* Stats Bar */}
            {stats && (
                <div className="p-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs text-slate-500">Distance</p>
                        <p className="text-lg font-bold text-slate-800">{stats.distanceKm} km</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Avg Speed</p>
                        <p className="text-lg font-bold text-slate-800">{stats.avgSpeed} km/h</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Max Speed</p>
                        <p className="text-lg font-bold text-slate-800">{stats.maxSpeed} km/h</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Avg Temp</p>
                        <p className="text-lg font-bold text-slate-800">{stats.avgTemp}°C</p>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * Calculate approximate distance from route points
 */
function calculateDistance(route) {
    let totalDistance = 0;
    for (let i = 1; i < route.length; i++) {
        const prev = route[i - 1];
        const curr = route[i];
        totalDistance += haversineDistance(prev.gps_lat, prev.gps_lng, curr.gps_lat, curr.gps_lng);
    }
    return totalDistance.toFixed(1);
}

/**
 * Haversine formula for distance between two points
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * Get color based on temperature
 */
function getTempColor(temp) {
    if (temp === null || temp === undefined) return '#9E9E9E';
    if (temp > 8) return '#F44336'; // Red - too hot
    if (temp > 4) return '#FF9800'; // Orange - warning
    if (temp < -15) return '#2196F3'; // Blue - frozen
    return '#4CAF50'; // Green - good
}

export default RouteHistory;
