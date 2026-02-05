import React from 'react';
import { Thermometer, User, Truck, AlertTriangle, Activity } from 'lucide-react';
import { CARGO_CONFIG, STATUS_COLORS } from '../lib/constants';
import { formatTemperature, getTempStatus, isLive } from '../lib/transforms';

const TruckCard = ({ truck, onClick, isActive }) => {
    // Get cargo configuration
    const cargoConfig = CARGO_CONFIG[truck.cargo_type] || {
        color: '#607D8B',
        icon: '📦',
        threshold: 8
    };

    // Determine temperature status
    const temp = truck.current_location?.temperature ?? truck.current_temperature;
    const alertThreshold = truck.alert_threshold ?? cargoConfig.threshold;
    const tempStatus = getTempStatus(temp, alertThreshold);

    // Determine status colors
    const statusColor = tempStatus === 'CRITICAL' ? '#F44336' :
        tempStatus === 'WARNING' ? '#FF9800' :
            tempStatus === 'OFFLINE' ? '#9E9E9E' : cargoConfig.color;

    // Check if live
    const lastUpdated = truck.current_location?.last_updated ?? truck.last_seen;
    const liveStatus = isLive(lastUpdated);

    // Sensitivity colors
    const sensitivityColors = {
        CRITICAL: 'text-red-600 font-bold',
        HIGH: 'text-orange-600 font-semibold',
        MEDIUM: 'text-yellow-600 font-medium',
        LOW: 'text-green-600'
    };

    return (
        <div
            onClick={onClick}
            className={`
                bg-white rounded-xl shadow-sm border p-5 cursor-pointer
                hover:shadow-md hover:border-blue-300 transition-all duration-200 group
                ${isActive ? 'ring-2 ring-blue-500 border-blue-500' : 'border-slate-200'}
            `}
        >
            {/* Header: Device ID & Status */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Truck
                        className="w-5 h-5 transition-colors"
                        style={{ color: cargoConfig.color }}
                    />
                    <h3 className="font-semibold text-slate-800">{truck.device_id}</h3>
                    {liveStatus && (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            <Activity className="w-3 h-3" />
                            Live
                        </span>
                    )}
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[truck.status] || STATUS_COLORS.DISABLED}`}>
                    {truck.status}
                </span>
            </div>

            {/* Driver & Vehicle Info */}
            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>{truck.driver_name}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-medium">{truck.vehicle_reg}</span>
                </div>
            </div>

            {/* Cargo Type with Color Coding */}
            <div
                className="flex items-center gap-2 p-3 rounded-lg mb-4"
                style={{ backgroundColor: `${cargoConfig.color}15` }}
            >
                <span className="text-lg">{cargoConfig.icon}</span>
                <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: cargoConfig.color }}>
                        {truck.cargo_type}
                    </p>
                    <p className={`text-xs ${sensitivityColors[truck.cargo_sensitivity] || 'text-slate-500'}`}>
                        {truck.cargo_sensitivity} SENSITIVITY
                    </p>
                </div>
            </div>

            {/* Temperature & Threshold */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                    <Thermometer
                        className="w-5 h-5"
                        style={{ color: statusColor }}
                    />
                    <div>
                        <span
                            className="text-lg font-bold"
                            style={{ color: statusColor }}
                        >
                            {formatTemperature(temp)}
                        </span>
                        {temp !== null && temp !== undefined && (
                            <p className="text-xs text-slate-400">
                                Threshold: {alertThreshold}°C
                            </p>
                        )}
                    </div>
                </div>

                {/* Alert Indicator */}
                {(truck.alerts && truck.alerts > 0) || tempStatus === 'CRITICAL' ? (
                    <div className="flex items-center gap-1 text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-medium">
                            {tempStatus === 'CRITICAL' ? 'Critical' : `${truck.alerts} alerts`}
                        </span>
                    </div>
                ) : tempStatus === 'WARNING' ? (
                    <div className="flex items-center gap-1 text-orange-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-medium">Warning</span>
                    </div>
                ) : null}
            </div>

            {/* Last Seen */}
            {lastUpdated && (
                <p className="text-xs text-slate-400 mt-3 text-right">
                    Last seen: {new Date(lastUpdated).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}
                </p>
            )}
        </div>
    );
};

export default TruckCard;
