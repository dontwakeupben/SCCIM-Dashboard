import React, { useEffect, useState } from 'react';
import { useFleetStore } from '../store/fleetStore';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import {
    TrendingUp,
    AlertTriangle,
    Thermometer,
    Truck,
    Activity,
    RefreshCw
} from 'lucide-react';
import { CARGO_CONFIG, RISK_COLORS } from '../lib/constants';
import Header from '../components/Header';

const Analytics = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const {
        analytics,
        fetchAnalytics,
        isLoadingAnalytics,
        devices,
        fetchDevices,
        isLoadingDevices
    } = useFleetStore();

    // Load data on mount
    useEffect(() => {
        fetchDevices();
        fetchAnalytics();
    }, [fetchDevices, fetchAnalytics]);

    // Calculate fleet statistics
    const fleetStats = {
        total: devices.length,
        active: devices.filter(d => d.status === 'ACTIVE').length,
        withAlerts: devices.filter(d =>
            d.current_location?.temperature > d.alert_threshold
        ).length,
        avgTemp: devices.length > 0
            ? (devices.reduce((sum, d) => sum + (d.current_location?.temperature || 0), 0) / devices.filter(d => d.current_location?.temperature !== undefined).length || 0).toFixed(1)
            : '--'
    };

    // Cargo breakdown for pie chart
    const cargoBreakdown = React.useMemo(() => {
        const breakdown = {};
        devices.forEach(d => {
            breakdown[d.cargo_type] = (breakdown[d.cargo_type] || 0) + 1;
        });
        return Object.entries(breakdown).map(([type, count]) => ({
            name: type,
            value: count,
            color: CARGO_CONFIG[type]?.color || '#607D8B'
        }));
    }, [devices]);

    // Format time series data
    const timeSeriesData = analytics.timeSeries || [];

    // Cargo analytics data
    const cargoAnalytics = analytics.fleetOverview || [];

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <Header
                isSidebarOpen={isSidebarOpen}
                setSidebarOpen={setSidebarOpen}
                onRefresh={() => { fetchDevices(); fetchAnalytics(); }}
                isLoading={isLoadingDevices || isLoadingAnalytics}
            />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-800">Fleet Analytics</h1>
                    <p className="text-slate-500 mt-1">
                        Comprehensive insights into your cold chain operations
                    </p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        icon={Truck}
                        label="Total Trucks"
                        value={fleetStats.total}
                        color="blue"
                    />
                    <StatCard
                        icon={Activity}
                        label="Active"
                        value={fleetStats.active}
                        color="green"
                        subtext={`${Math.round((fleetStats.active / fleetStats.total) * 100) || 0}%`}
                    />
                    <StatCard
                        icon={AlertTriangle}
                        label="With Alerts"
                        value={fleetStats.withAlerts}
                        color={fleetStats.withAlerts > 0 ? "red" : "gray"}
                    />
                    <StatCard
                        icon={Thermometer}
                        label="Avg Temperature"
                        value={`${fleetStats.avgTemp}°C`}
                        color="orange"
                    />
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Cargo Distribution */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="font-semibold text-slate-800 mb-6">Cargo Type Distribution</h3>
                        {isLoadingDevices ? (
                            <ChartSkeleton />
                        ) : cargoBreakdown.length > 0 ? (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={cargoBreakdown}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {cargoBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <NoData message="No cargo data available" />
                        )}
                    </div>

                    {/* Cargo Analytics Bar Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="font-semibold text-slate-800 mb-6">Average Temperature by Cargo Type</h3>
                        {isLoadingAnalytics ? (
                            <ChartSkeleton />
                        ) : cargoAnalytics.length > 0 ? (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={cargoAnalytics}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis
                                            dataKey="cargo_type"
                                            tick={{ fontSize: 12 }}
                                            interval={0}
                                            angle={-15}
                                            textAnchor="end"
                                            height={60}
                                        />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="avg_temperature" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <NoData message="No analytics data available" />
                        )}
                    </div>
                </div>

                {/* Time Series Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-8">
                    <h3 className="font-semibold text-slate-800 mb-6">Temperature Trends by Cargo Type</h3>
                    {isLoadingAnalytics ? (
                        <ChartSkeleton />
                    ) : timeSeriesData.length > 0 ? (
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={timeSeriesData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="frozen"
                                        name="Frozen Seafood"
                                        stroke={CARGO_CONFIG['Frozen Seafood']?.color}
                                        strokeWidth={2}
                                        dot={false}
                                        connectNulls
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="fresh"
                                        name="Fresh Produce"
                                        stroke={CARGO_CONFIG['Fresh Produce']?.color}
                                        strokeWidth={2}
                                        dot={false}
                                        connectNulls
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="pharma"
                                        name="Pharmaceuticals"
                                        stroke={CARGO_CONFIG['Pharmaceuticals']?.color}
                                        strokeWidth={2}
                                        dot={false}
                                        connectNulls
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="dairy"
                                        name="Dairy"
                                        stroke={CARGO_CONFIG['Dairy']?.color}
                                        strokeWidth={2}
                                        dot={false}
                                        connectNulls
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="meat"
                                        name="Meat"
                                        stroke={CARGO_CONFIG['Meat']?.color}
                                        strokeWidth={2}
                                        dot={false}
                                        connectNulls
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <NoData message="No time series data available" />
                    )}
                </div>

                {/* Violations Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="font-semibold text-slate-800">Alert Violations Summary</h3>
                    </div>
                    {isLoadingAnalytics ? (
                        <div className="p-8 text-center text-slate-500">
                            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                            Loading violations data...
                        </div>
                    ) : cargoAnalytics.length > 0 ? (
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Cargo Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Avg Temperature
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Alert Violations
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {cargoAnalytics.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span>{CARGO_CONFIG[item.cargo_type]?.icon}</span>
                                                <span className="font-medium text-slate-900">{item.cargo_type}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                            {item.avg_temperature?.toFixed(1)}°C
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.alert_violations > 0
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-green-100 text-green-800'
                                                }`}>
                                                {item.alert_violations}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'OPTIMAL'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-8 text-center text-slate-500">
                            No violations data available
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

// Helper Components
const StatCard = ({ icon: Icon, label, value, color, subtext }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        red: 'bg-red-50 text-red-600',
        orange: 'bg-orange-50 text-orange-600',
        gray: 'bg-gray-50 text-gray-600'
    };

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${colors[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-slate-800">{value}</p>
                    <p className="text-sm text-slate-500">{label}</p>
                    {subtext && <p className="text-xs text-slate-400">{subtext}</p>}
                </div>
            </div>
        </div>
    );
};

const ChartSkeleton = () => (
    <div className="h-64 bg-slate-50 rounded-lg animate-pulse flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-slate-300 animate-spin" />
    </div>
);

const NoData = ({ message }) => (
    <div className="h-64 flex items-center justify-center text-slate-400">
        <p>{message}</p>
    </div>
);

export default Analytics;
