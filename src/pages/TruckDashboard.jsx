import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Thermometer,
    Droplets,
    AlertTriangle,
    Shield,
    RefreshCw,
    User,
    Truck,
    Package,
    Gauge,
    TrendingUp,
    TrendingDown,
    MapPin
} from 'lucide-react';
import { useFleetStore } from '../store/fleetStore';
import {
    formatTime,
    formatDateTime,
    timeAgo,
    getAlertType,
    getTempThresholds,
    isTemperatureBreached,
    isTheftRisk,
    calculateStats,
    getCargoColor
} from '../utils/helpers';
import { CARGO_CONFIG, REFRESH_RATES } from '../lib/constants';
import { toChartData } from '../lib/transforms';
import StatCard from '../components/StatCard';

// Lazy load RouteHistory component
const RouteHistory = lazy(() => import('../components/map/RouteHistory'));
import DataSourceBadge from '../components/DataSourceBadge';
import RiskScoreBadge from '../components/RiskScoreBadge';
import ExportableChart from '../components/ExportableChart';
import Header from '../components/Header';

const TruckDashboard = () => {
    const { deviceId } = useParams();
    const navigate = useNavigate();

    // Zustand store
    const {
        devices,
        telemetryCache,
        alertsCache,
        isLoadingTelemetry,
        isLoadingAlerts,
        error,
        fetchDevices,
        fetchTelemetry,
        fetchSearchAlerts,
        setSelectedDevice,
        timeRange,
        setTimeRange,
        clearTelemetryCache
    } = useFleetStore();

    // Local state
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    // Set selected device when mounted
    useEffect(() => {
        if (deviceId) {
            setSelectedDevice(deviceId);
        }
    }, [deviceId, setSelectedDevice]);

    // Fetch telemetry and alerts data
    const loadData = useCallback(async () => {
        if (!deviceId) return;
        const hours = timeRange === '7d' ? 168 : 24;
        await Promise.all([
            fetchTelemetry(deviceId, timeRange),
            fetchSearchAlerts(deviceId, hours)
        ]);
        setLastUpdated(new Date());
    }, [deviceId, fetchTelemetry, fetchSearchAlerts, timeRange]);

    // Clear cache and reload function for debugging
    const handleClearCache = useCallback(() => {
        console.log('[DEBUG] Manual cache clear triggered');
        clearTelemetryCache();
        loadData();
    }, [clearTelemetryCache, loadData]);

    // Initial load and when device/range changes
    useEffect(() => {
        loadData();
    }, [loadData]);

    // No auto-refresh for telemetry data

    // Get telemetry data from cache
    const telemetryData = telemetryCache.get(deviceId);

    // Get alerts data from cache (new searchAlerts API)
    const alertsData = alertsCache.get(deviceId);

    // Get current readings
    const current = telemetryData?.current;
    const metadata = telemetryData?.metadata;
    const querySource = telemetryData?.querySource;

    // Calculate thermal rate from history if not provided in current
    const getThermalRate = () => {
        // If API provides thermal_rate in current, use it (even if 0)
        if (current?.thermal_rate !== undefined && current?.thermal_rate !== null) {
            return current.thermal_rate;
        }
        // Otherwise calculate from last two history points
        const history = telemetryData?.history;
        if (!history || history.length < 2) return 0;
        const latest = history[history.length - 1];
        const previous = history[history.length - 2];
        if (latest?.temperature === undefined || previous?.temperature === undefined) return 0;
        // Calculate rate per minute (assuming ~5 min intervals)
        const tempDiff = latest.temperature - previous.temperature;
        return Number(tempDiff.toFixed(2));
    };

    const thermalRate = getThermalRate();

    // Calculate thresholds
    const tempThresholds = getTempThresholds(metadata);
    const hasTempBreach = current ? isTemperatureBreached(current.temperature, tempThresholds.max) : false;
    const hasTheftRisk = current ? isTheftRisk(current.door_open, current.gps_speed) : false;

    // Calculate stats from history
    const tempStats = calculateStats(telemetryData?.history);

    // Process chart data using new transform
    const chartData = toChartData(telemetryData?.history || [], tempThresholds.max);

    // Process alerts from new searchAlerts API
    const apiAlerts = alertsData?.alerts?.flatMap(alertGroup =>
        alertGroup.alerts?.map((alert, idx) => ({
            id: `${alertGroup.alert_timestamp}-${idx}`,
            type: getAlertType(alert.severity),
            message: alert.message,
            time: timeAgo(alertGroup.alert_timestamp),
            action: alert.recommendation,
            timestamp: alertGroup.alert_timestamp
        })) || []
    ) || [];

    // Add system alerts (from current telemetry status)
    const systemAlerts = [];
    if (hasTempBreach) {
        systemAlerts.push({
            id: 'temp-breach',
            type: 'critical',
            message: `TEMP BREACH: Current ${current.temperature}°C exceeds max ${tempThresholds.max}°C`,
            time: 'Active now',
            timestamp: new Date().toISOString()
        });
    }
    if (hasTheftRisk) {
        systemAlerts.push({
            id: 'theft-risk',
            type: 'security',
            message: `THEFT RISK: Door open while vehicle moving at ${current.gps_speed} km/h`,
            time: 'Active now',
            timestamp: new Date().toISOString()
        });
    }

    const allAlerts = [...systemAlerts, ...apiAlerts].slice(0, 10);

    // Get cargo color from new config
    const cargoConfig = metadata?.cargo_type ? CARGO_CONFIG[metadata.cargo_type] : null;
    const cargoColor = cargoConfig?.color || getCargoColor(metadata?.cargo_type);

    // Get temperature trend
    const getTempTrend = () => {
        if (Math.abs(thermalRate) < 0.01) return { icon: null, text: 'Stable', color: 'text-green-600' };
        if (thermalRate > 0.1) return { icon: TrendingUp, text: 'Rising', color: 'text-red-600' };
        if (thermalRate < -0.1) return { icon: TrendingDown, text: 'Falling', color: 'text-blue-600' };
        return { icon: null, text: 'Stable', color: 'text-green-600' };
    };

    const tempTrend = getTempTrend();

    // Calculate total alert count for badge
    const alertCount = allAlerts.length;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <Header
                isSidebarOpen={isSidebarOpen}
                setSidebarOpen={setSidebarOpen}
                fleet={devices}
                currentDeviceId={deviceId}
                onRefresh={loadData}
                isLoading={isLoadingTelemetry}
                querySource={querySource}
                alertCount={alertCount}
                lastUpdated={lastUpdated}
            />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                {/* Page Header with Time Range Selector */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Back to Fleet</span>
                        </button>
                        <div className="hidden sm:block text-slate-300">|</div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span>Fleet</span>
                            <span>/</span>
                            <span className="font-medium text-slate-800">{deviceId}</span>
                        </div>
                    </div>

                    {/* Time Range Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">Time Range:</span>
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="24h">Last 24 Hours</option>
                            <option value="7d">Last 7 Days</option>
                        </select>
                        {/* DEBUG: Clear cache button */}
                        <button
                            onClick={handleClearCache}
                            className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200 transition-colors"
                            title="Clear cache and reload"
                        >
                            Clear Cache
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        <p className="font-medium mb-1">Error loading data</p>
                        <p>{error}</p>
                        {error === 'Device not registered' && (
                            <button
                                onClick={() => navigate('/')}
                                className="mt-3 flex items-center gap-1.5 text-blue-600 hover:text-blue-800 px-3 py-1.5 bg-blue-100 rounded-md transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Fleet
                            </button>
                        )}
                        <button
                            onClick={loadData}
                            className="mt-3 flex items-center gap-1.5 text-red-600 hover:text-red-800 px-3 py-1.5 bg-red-100 rounded-md transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                        </button>
                    </div>
                )}

                {/* Info Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {/* Driver Info Card */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-slate-800">Driver Info</h3>
                        </div>
                        <div className="space-y-2">
                            <p className="text-lg font-bold text-slate-800">
                                {isLoadingTelemetry ? 'Loading...' : metadata?.driver_name || 'Unknown'}
                            </p>
                            <p className="text-sm text-slate-500">
                                Vehicle: {isLoadingTelemetry ? '...' : metadata?.vehicle_reg || 'Unknown'}
                            </p>
                        </div>
                    </div>

                    {/* Cargo Info Card */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div
                                className="p-2 rounded-lg"
                                style={{ backgroundColor: `${cargoColor}20` }}
                            >
                                <Package className="w-5 h-5" style={{ color: cargoColor }} />
                            </div>
                            <h3 className="font-semibold text-slate-800">Cargo Info</h3>
                        </div>
                        <div className="space-y-2">
                            <p className="text-lg font-bold" style={{ color: cargoColor }}>
                                {isLoadingTelemetry ? 'Loading...' : metadata?.cargo_type || 'Unknown'}
                            </p>
                            <p className="text-sm text-slate-500">
                                {isLoadingTelemetry ? '...' : `${metadata?.cargo_sensitivity || 'Unknown'} sensitivity`}
                            </p>
                        </div>
                    </div>

                    {/* Thresholds Card */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-orange-50 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-orange-600" />
                            </div>
                            <h3 className="font-semibold text-slate-800">Thresholds</h3>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm text-slate-600">
                                Alert: <span className="font-bold text-slate-800">{tempThresholds.max}°C</span>
                            </p>
                            <p className="text-sm text-slate-600">
                                Min: <span className="font-bold text-slate-800">{tempThresholds.min}°C</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Current Status Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-8">
                    <h2 className="text-lg font-semibold text-slate-800 mb-6">Current Status</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Big Temperature Display */}
                        <div className={`p-6 rounded-xl border-2 ${hasTempBreach ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-slate-50'} text-center`}>
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Thermometer className={`w-6 h-6 ${hasTempBreach ? 'text-red-600' : 'text-slate-600'}`} />
                                <span className="text-sm text-slate-500">Temperature</span>
                            </div>
                            <p className={`text-4xl font-bold ${hasTempBreach ? 'text-red-600 animate-pulse' : 'text-slate-800'}`}>
                                {isLoadingTelemetry ? '--' : `${current?.temperature ?? '--'}°C`}
                            </p>
                            {tempTrend && (
                                <div className={`flex items-center justify-center gap-1 mt-2 ${tempTrend.color}`}>
                                    {tempTrend.icon && <tempTrend.icon className="w-4 h-4" />}
                                    <span className="text-sm">{tempTrend.text}</span>
                                </div>
                            )}
                        </div>

                        {/* Risk Score */}
                        <div className="p-6 rounded-xl border-2 border-slate-200 bg-slate-50 text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Shield className="w-6 h-6 text-slate-600" />
                                <span className="text-sm text-slate-500">Risk Score</span>
                            </div>
                            <p className="text-4xl font-bold text-slate-800">
                                {isLoadingTelemetry ? '--' : telemetryData?.risk_score || 'LOW'}
                            </p>
                            {!isLoadingTelemetry && telemetryData?.risk_score && telemetryData?.risk_score !== 'UNKNOWN' && (
                                <div className="mt-2">
                                    <RiskScoreBadge score={telemetryData.risk_score} />
                                </div>
                            )}
                        </div>

                        {/* Humidity */}
                        <div className="p-6 rounded-xl border-2 border-slate-200 bg-slate-50 text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Droplets className="w-6 h-6 text-blue-600" />
                                <span className="text-sm text-slate-500">Humidity</span>
                            </div>
                            <p className="text-4xl font-bold text-slate-800">
                                {isLoadingTelemetry ? '--' : `${current?.humidity ?? '--'}%`}
                            </p>
                            <p className="text-sm text-slate-500 mt-2">
                                {current?.humidity > 70 ? 'High' : current?.humidity < 30 ? 'Low' : 'Normal'}
                            </p>
                        </div>

                        {/* Vehicle Speed */}
                        <div className="p-6 rounded-xl border-2 border-slate-200 bg-slate-50 text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Truck className="w-6 h-6 text-slate-600" />
                                <span className="text-sm text-slate-500">Speed</span>
                            </div>
                            <p className="text-4xl font-bold text-slate-800">
                                {isLoadingTelemetry ? '--' : `${current?.gps_speed ?? '--'} km/h`}
                            </p>
                            <p className={`text-sm mt-2 ${hasTheftRisk ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                                {hasTheftRisk ? '⚠️ THEFT RISK' : current?.gps_speed > 0 ? 'Moving' : 'Stopped'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <ExportableChart
                        title={`Temperature History (${timeRange})`}
                        data={chartData}
                        dataKey="temperature"
                        color={cargoColor || '#3b82f6'}
                        type="line"
                        threshold={tempThresholds.max}
                        isLoading={isLoadingTelemetry}
                    />
                    <ExportableChart
                        title={`Humidity History (${timeRange})`}
                        data={chartData}
                        dataKey="humidity"
                        color="#10b981"
                        type="area"
                        isLoading={isLoadingTelemetry}
                    />
                </div>

                {/* Route History Map */}
                <div className="mb-8">
                    <Suspense fallback={
                        <div className="bg-slate-100 rounded-xl h-[300px] flex items-center justify-center">
                            <div className="text-slate-400">Loading route history...</div>
                        </div>
                    }>
                        <RouteHistory
                            deviceId={deviceId}
                            hours={timeRange === '7d' ? 168 : 24}
                            telemetryHistory={telemetryData?.history || []}
                        />
                    </Suspense>
                </div>

                {/* Bottom Section: Stats & Alerts */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Stats Cards */}
                    <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <StatCard
                            title="24h Average"
                            value={tempStats.avg ? `${tempStats.avg}°C` : '--'}
                            subtext={tempStats.avg ? `Based on ${telemetryData?.history?.length || 0} readings` : 'No data'}
                            icon={Gauge}
                            trend="neutral"
                            isLoading={isLoadingTelemetry}
                        />
                        <StatCard
                            title="24h Range"
                            value={tempStats.min && tempStats.max ? `${tempStats.min}°C to ${tempStats.max}°C` : '--'}
                            subtext="Min / Max temperature"
                            icon={Thermometer}
                            trend="neutral"
                            isLoading={isLoadingTelemetry}
                        />
                        <StatCard
                            title="Door Status"
                            value={isLoadingTelemetry ? '--' : current?.door_open ? 'OPEN' : 'Closed'}
                            subtext={hasTheftRisk ? '⚠️ THEFT RISK DETECTED!' : 'Security status'}
                            icon={Shield}
                            trend={hasTheftRisk ? 'down' : 'neutral'}
                            isLoading={isLoadingTelemetry}
                            alert={hasTheftRisk}
                        />
                        <StatCard
                            title="Thermal Rate"
                            value={isLoadingTelemetry ? '--' : `${thermalRate}°C/min`}
                            subtext={Math.abs(thermalRate) > 0.5 ? 'Rapid temperature change' : 'Stable temperature'}
                            icon={Gauge}
                            trend={Math.abs(thermalRate) > 0.5 ? 'down' : 'neutral'}
                            isLoading={isLoadingTelemetry}
                            alert={Math.abs(thermalRate) > 0.5}
                        />
                    </div>

                    {/* Alerts Panel */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-800">Recent Alerts</h3>
                            {allAlerts.length > 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    {allAlerts.length} active
                                </span>
                            )}
                        </div>
                        <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                            {isLoadingAlerts ? (
                                <div className="space-y-3">
                                    <div className="h-16 bg-slate-100 animate-pulse rounded"></div>
                                    <div className="h-16 bg-slate-100 animate-pulse rounded"></div>
                                    <div className="h-16 bg-slate-100 animate-pulse rounded"></div>
                                </div>
                            ) : allAlerts.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-3">
                                        <Shield className="w-6 h-6 text-green-600" />
                                    </div>
                                    <p className="text-sm text-slate-600">No active alerts</p>
                                    <p className="text-xs text-slate-400 mt-1">System operating normally</p>
                                </div>
                            ) : (
                                allAlerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        className={`flex gap-4 p-3 rounded-lg border ${alert.type === 'critical' ? 'bg-red-50 border-red-200' :
                                            alert.type === 'security' ? 'bg-purple-50 border-purple-200' :
                                                alert.type === 'warning' ? 'bg-orange-50 border-orange-200' :
                                                    'bg-slate-50 border-slate-100'
                                            }`}
                                    >
                                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${alert.type === 'critical' ? 'bg-red-500' :
                                            alert.type === 'security' ? 'bg-purple-500' :
                                                alert.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                                            }`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800">
                                                {alert.message}
                                            </p>
                                            {alert.action && (
                                                <p className="text-xs font-semibold text-red-600 mt-1 uppercase tracking-wide">
                                                    {alert.action}
                                                </p>
                                            )}
                                            <p className="text-xs text-slate-500 mt-1">{alert.time}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TruckDashboard;
