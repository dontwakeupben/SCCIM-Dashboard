// --- Fleet Map Component per Technical Specification ---

import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useFleetStore } from '../../store/fleetStore';
import { CARGO_CONFIG, MAP_CONFIG } from '../../lib/constants';
import { Link } from 'react-router-dom';
import { Truck, Thermometer, Navigation } from 'lucide-react';

/**
 * Component to auto-fit map bounds to markers
 */
const FitBounds = ({ locations }) => {
    const map = useMap();

    useEffect(() => {
        // Filter out locations with undefined or invalid lat/lng
        const validLocations = locations.filter(loc =>
            loc && typeof loc.lat === 'number' && typeof loc.lng === 'number' &&
            !isNaN(loc.lat) && !isNaN(loc.lng)
        );

        if (validLocations.length > 0 && validLocations.length < 20) {
            const bounds = validLocations.map(loc => [loc.lat, loc.lng]);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [map, locations]);

    return null;
};

/**
 * Custom truck marker icon based on cargo type
 */
const createTruckIcon = (cargoType, status) => {
    const config = CARGO_CONFIG[cargoType] || { color: '#607D8B', icon: '📦' };
    const isOffline = status === 'OFFLINE' || status === 'DISABLED';

    return divIcon({
        className: 'custom-truck-marker',
        html: `
            <div style="
                width: 36px;
                height: 36px;
                background-color: ${isOffline ? '#9E9E9E' : config.color};
                border: 3px solid white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                font-size: 18px;
            ">${config.icon}</div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20]
    });
};

/**
 * Individual truck marker with popup
 */
const TruckMarker = ({ truck }) => {
    const { location, device_id, driver_name, cargo_type, current_status } = truck;

    if (!location || !location.lat || !location.lng) return null;

    const icon = createTruckIcon(cargo_type, truck.status);

    return (
        <Marker
            position={[location.lat, location.lng]}
            icon={icon}
        >
            <Popup>
                <div className="min-w-[200px] p-2">
                    <div className="flex items-center gap-2 mb-3">
                        <Truck className="w-5 h-5 text-slate-600" />
                        <h3 className="font-bold text-slate-800">{device_id}</h3>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400">Driver:</span>
                            <span className="font-medium">{driver_name}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-slate-400">Cargo:</span>
                            <span className="font-medium">{cargo_type}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Thermometer className="w-4 h-4 text-slate-400" />
                            <span className={`font-bold ${current_status?.temperature > 8 ? 'text-red-600' : 'text-slate-700'
                                }`}>
                                {current_status?.temperature?.toFixed(1) ?? '--'}°C
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Navigation className="w-4 h-4 text-slate-400" />
                            <span className="font-medium text-slate-700">
                                {current_status?.speed_kmh ?? 0} km/h
                            </span>
                            {current_status?.door_open && (
                                <span className="text-red-600 font-bold text-xs">DOOR OPEN</span>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                        <Link
                            to={`/dashboard/${device_id}`}
                            className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                            View Dashboard
                        </Link>
                    </div>
                </div>
            </Popup>
        </Marker>
    );
};

/**
 * Fleet Map Component
 */
const FleetMap = ({ height = '400px' }) => {
    const { fleetLocations, isLoadingLocations, fetchFleetLocations, devices } = useFleetStore();

    // Fetch locations on mount
    useEffect(() => {
        fetchFleetLocations();
    }, [fetchFleetLocations]);

    // Merge fleet locations with device data for complete info
    const locationsWithData = useMemo(() => {
        return fleetLocations.map(loc => {
            const device = devices.find(d => d.device_id === loc.device_id);
            return {
                ...loc,
                ...device,
                current_status: loc.current_status
            };
        }).filter(loc => loc.location && loc.location.lat && loc.location.lng);
    }, [fleetLocations, devices]);

    if (isLoadingLocations && locationsWithData.length === 0) {
        return (
            <div
                className="bg-slate-100 rounded-xl flex items-center justify-center"
                style={{ height }}
            >
                <div className="text-slate-400">Loading map...</div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Fleet Map</h3>
                <span className="text-sm text-slate-500">
                    {locationsWithData.length} trucks visible
                </span>
            </div>
            <div style={{ height }}>
                <MapContainer
                    center={MAP_CONFIG.center}
                    zoom={MAP_CONFIG.zoom}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <FitBounds locations={locationsWithData} />
                    {locationsWithData.map(truck => (
                        <TruckMarker key={truck.device_id} truck={truck} />
                    ))}
                </MapContainer>
            </div>
        </div>
    );
};

export default FleetMap;
