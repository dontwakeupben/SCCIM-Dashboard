import React, { useEffect, useState, useCallback, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertTriangle, RefreshCw, Truck, Filter } from 'lucide-react';
import { useFleetStore } from '../store/fleetStore';
import TruckCard from '../components/TruckCard';
import Header from '../components/Header';
import RegisterTruckModal from '../components/RegisterTruckModal';
import { CARGO_CONFIG, CARGO_TYPES } from '../lib/constants';

// Lazy load map component to avoid SSR issues
const FleetMap = lazy(() => import('../components/map/FleetMap'));

const FleetOverview = () => {
    const navigate = useNavigate();

    // Zustand store state
    const {
        devices,
        isLoadingDevices,
        error,
        fetchDevices,
        fetchFleetLocations,
        setSelectedDevice,
        selectedCargoTypes,
        toggleCargoFilter,
        getFilteredDevices,
        getActiveCount,
        getAlertCount
    } = useFleetStore();

    // Local state
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);

    // Load fleet data
    const loadFleet = useCallback(async () => {
        await fetchDevices();
        await fetchFleetLocations();
        setLastUpdated(new Date());
    }, [fetchDevices, fetchFleetLocations]);

    // Initial load
    useEffect(() => {
        loadFleet();
    }, [loadFleet]);

    // Calculate stats using store selectors
    const activeTrucks = getActiveCount();
    const alertTrucks = getAlertCount();

    // Get filtered devices
    const filteredDevices = getFilteredDevices();

    const handleTruckClick = (deviceId) => {
        setSelectedDevice(deviceId);
        navigate(`/dashboard/${deviceId}`);
    };

    const handleRegistrationSuccess = () => {
        // The store handles adding the new device
        loadFleet();
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <Header
                isSidebarOpen={isSidebarOpen}
                setSidebarOpen={setSidebarOpen}
                fleet={devices}
                onRefresh={loadFleet}
                isLoading={isLoadingDevices}
                alertCount={alertTrucks}
                lastUpdated={lastUpdated}
            />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Fleet Overview</h1>
                        <p className="text-slate-500 mt-1">
                            Manage and monitor your cold chain fleet in real-time
                        </p>
                    </div>
                    <button
                        onClick={() => setShowRegisterModal(true)}
                        className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5" />
                        Register New Truck
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="font-medium">Error loading fleet data</p>
                            <p>{error}</p>
                        </div>
                        <button
                            onClick={loadFleet}
                            className="flex items-center gap-1.5 text-red-600 hover:text-red-800 px-3 py-1.5 bg-red-100 rounded-md transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                        </button>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <StatCard
                        icon={Truck}
                        iconColor="blue"
                        value={devices.length}
                        label="Total Trucks"
                    />
                    <StatCard
                        icon={RefreshCw}
                        iconColor="green"
                        value={activeTrucks}
                        label="Active"
                    />
                    <StatCard
                        icon={AlertTriangle}
                        iconColor="red"
                        value={alertTrucks}
                        label="With Alerts"
                    />
                </div>

                {/* Cargo Type Filters */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Filter className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">Filter by Cargo Type</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {CARGO_TYPES.map(type => {
                            const config = CARGO_CONFIG[type];
                            const isSelected = selectedCargoTypes.includes(type);
                            return (
                                <button
                                    key={type}
                                    onClick={() => toggleCargoFilter(type)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${isSelected
                                        ? 'bg-slate-800 text-white'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <span>{config.icon}</span>
                                    <span>{type}</span>
                                </button>
                            );
                        })}
                        {selectedCargoTypes.length > 0 && (
                            <button
                                onClick={() => selectedCargoTypes.forEach(t => toggleCargoFilter(t))}
                                className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Fleet Map */}
                <div className="mb-8">
                    <Suspense fallback={
                        <div className="bg-slate-100 rounded-xl h-[300px] flex items-center justify-center">
                            <div className="text-slate-400">Loading map...</div>
                        </div>
                    }>
                        <FleetMap height="300px" />
                    </Suspense>
                </div>

                {/* Fleet Grid */}
                {isLoadingDevices && devices.length === 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 animate-pulse">
                                <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
                                <div className="h-3 bg-slate-200 rounded w-1/2 mb-2"></div>
                                <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredDevices.length === 0 ? (
                    <div className="text-center py-12">
                        <Truck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-700 mb-2">No trucks found</h3>
                        <p className="text-slate-500">
                            {selectedCargoTypes.length > 0
                                ? 'Try adjusting your filters'
                                : 'Register your first truck to get started'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredDevices.map(truck => (
                            <TruckCard
                                key={truck.device_id}
                                truck={truck}
                                onClick={() => handleTruckClick(truck.device_id)}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Registration Modal */}
            <RegisterTruckModal
                isOpen={showRegisterModal}
                onClose={() => setShowRegisterModal(false)}
                onSuccess={handleRegistrationSuccess}
            />
        </div>
    );
};

// Stat Card Component
const StatCard = ({ icon: Icon, iconColor, value, label }) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        red: 'bg-red-50 text-red-600'
    };

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${colorClasses[iconColor]}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-slate-800">{value}</p>
                    <p className="text-sm text-slate-500">{label}</p>
                </div>
            </div>
        </div>
    );
};

export default FleetOverview;
