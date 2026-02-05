import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Truck, Menu, X, Bell, RefreshCw, ChevronDown, Search } from 'lucide-react';
import DataSourceBadge from './DataSourceBadge';

const Header = ({
    isSidebarOpen,
    setSidebarOpen,
    fleet = [],
    currentDeviceId,
    onRefresh,
    isLoading,
    querySource,
    alertCount = 0,
    lastUpdated
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isFleetView = location.pathname === '/';

    const handleTruckChange = (e) => {
        const deviceId = e.target.value;
        if (deviceId) {
            navigate(`/dashboard/${deviceId}`);
        }
    };

    return (
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-8">
            {/* Left: Menu button & Logo */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden text-slate-500 hover:text-slate-700"
                >
                    <Menu className="w-6 h-6" />
                </button>

                <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => navigate('/')}
                >
                    <Truck className="w-6 h-6 text-blue-600" />
                    <h1 className="text-lg font-bold text-slate-800 hidden sm:block">
                        SCCIM Fleet
                    </h1>
                </div>
            </div>

            {/* Center: Truck Selector (when on dashboard) */}
            <div className="flex-1 max-w-md mx-4">
                {isFleetView ? (
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search fleet..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                ) : (
                    <div className="relative">
                        <select
                            value={currentDeviceId || ''}
                            onChange={handleTruckChange}
                            className="w-full pl-4 pr-10 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                        >
                            <option value="">Select a truck...</option>
                            {fleet.map(truck => (
                                <option key={truck.device_id} value={truck.device_id}>
                                    {truck.device_id} - {truck.driver_name} ({truck.cargo_type})
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                )}
            </div>

            {/* Right: Data Source, Refresh, Notifications */}
            <div className="flex items-center gap-3">
                {/* Data Source Indicator */}
                {!isLoading && querySource && (
                    <div className="hidden md:block">
                        <DataSourceBadge querySource={querySource} />
                    </div>
                )}

                {/* Refresh Button */}
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        disabled={isLoading}
                        className="hidden sm:flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 px-3 py-1.5 bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        <span className="hidden lg:inline">Refresh</span>
                    </button>
                )}

                {/* Last Updated */}
                {lastUpdated && (
                    <span className="hidden xl:block text-xs text-slate-400">
                        {lastUpdated.toLocaleTimeString()}
                    </span>
                )}

                {/* Notifications */}
                <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                    <Bell className="w-5 h-5" />
                    {alertCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full border border-white text-white text-[10px] font-bold flex items-center justify-center">
                            {alertCount > 9 ? '9+' : alertCount}
                        </span>
                    )}
                </button>
            </div>
        </header>
    );
};

export default Header;
